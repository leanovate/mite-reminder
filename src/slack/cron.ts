import { App } from "@slack/bolt"
import moment, { Moment } from "moment"
import cron from "node-cron"
import config from "../config"
import { Repository } from "../db/userRepository"
import { getMissingTimeEntries, lastWeekThursdayToThursday, lastMonth } from "../mite/time"
import { missingTimeEntriesBlock } from "./blocks"
import { createUserContextFromSlackId } from "./createUserContext"
import { isCheckContext } from "./userContext"
import { pipe } from "fp-ts/lib/function"
import { taskEither } from "fp-ts"

const { timezone } = config

export const scheduleCronJobs = (app: App, repository: Repository): void => {
    scheduleDailyCron(repository, app)
    scheduleMonthlyCron(repository, app)
}

function scheduleDailyCron(repository: Repository, app: App) {
    cron.schedule("0 9 * * 1-5", () => 
        runReminder(app, repository, lastWeekThursdayToThursday(moment()))
    , { timezone })
}

function scheduleMonthlyCron(repository: Repository, app: App) {
    // 2 9 1 * *
    cron.schedule("* * * * *", () =>
        runReminder(app, repository, lastMonth(moment()))
    , { timezone })
}

function runReminder(app: App, repository: Repository, { start, end }: {start: Moment, end: Moment}): Promise<void>[] {
    const users = repository.loadAllUsers()
    console.log(`Running reminder for ${users.length} users.`)
    return users.map(async user => {
        const context = createUserContextFromSlackId(repository, user.slackId)

        if(!isCheckContext(context)) {
            return sayPleaseRegisterWithApiKey(app, config.slackToken, user.slackId)
        }

        if(!user.miteId && !user.miteApiKey) {
            return sayPleaseRegister(app, config.slackToken, user.slackId)
        }

        const miteId = user.miteId ?? "current"

        return pipe(
            getMissingTimeEntries(miteId, start, end, context.miteApi),
            taskEither.fold(e => async () => {
                console.error("Error when running reminder:", e)
                await app.client.chat.postMessage({
                    token: config.slackToken,
                    channel: user.slackId,
                    text: `I tried to remind you about your missing time entries, but failed because of: "${e.presentableMessage}"`
                })
            }, times => async () => {
                if (times.length > 0) {
                    await app.client.chat.postMessage({
                        token: config.slackToken,
                        channel: user.slackId,
                        ...missingTimeEntriesBlock(times)
                    })
                }
            })
        )()
    })
}

async function sayPleaseRegister(app: App, token: string, channel: string): Promise<void> {
    app.client.chat.postMessage({
        token,
        channel,
        text: "I cannot remind you because I can't find your mite account. Please register again by sending `register`."
    })
}

async function sayPleaseRegisterWithApiKey(app: App, token: string, channel: string): Promise<void> {
    app.client.chat.postMessage({
        token,
        channel,
        text: `I cannot remind you because I can't find your mite account. Please register with your mite api key from https://${config.miteAccountName}.mite.yo.lk/myself and send \`register <YOUR_MITE_API_KEY>\`.`
    })
}