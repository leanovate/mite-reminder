import { App } from "@slack/bolt"
import moment from "moment"
import cron from "node-cron"
import config from "../config"
import { Repository } from "../db/userRepository"
import { getMissingTimeEntries, lastWeekThursdayToThursday } from "../mite/time"
import { missingTimeEntriesBlock } from "./blocks"
import { createUserContextFromSlackId } from "./createUserContext"
import { isCheckContext } from "./userContext"
import { pipe } from "fp-ts/lib/function"
import { taskEither } from "fp-ts"

const { timezone } = config

export const scheduleCronJobs = (app: App, repository: Repository): void => {
    scheduleDailyCron(repository, app)
}

function scheduleDailyCron(repository: Repository, app: App) {
    cron.schedule("0 9 * * 1-5", async () => {
        const users = repository.loadAllUsers()
        console.log(`Running daily cron for ${users.length} users.`)
        users.forEach(async user => { // for (const user in users) gets the type wrong for some reason (it is not string)
            const { start, end } = lastWeekThursdayToThursday(moment())
            const context = createUserContextFromSlackId(repository, user.slackId)

            if(!isCheckContext(context)) {
                return sayPleaseRegisterWithApiKey(app, config.slackToken, user.slackId)
            }

            if(!user.miteId && !user.miteApiKey) {
                return sayPleaseRegister(app, config.slackToken, user.slackId)
            }

            const miteId = user.miteId ?? "current"

            await pipe(
                getMissingTimeEntries(miteId, start, end, context.miteApi),
                taskEither.fold(e => async () => {
                    console.error("Error when running daily cron:", e)
                    await app.client.chat.postMessage({
                        token: config.slackToken,
                        channel: user.slackId,
                        text: "I tried check your mite time entries, but something went wrong. Please inform the mite bot admin."
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
    }, { timezone })
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