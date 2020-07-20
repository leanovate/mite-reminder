import { App } from "@slack/bolt"
import moment from "moment"
import cron from "node-cron"
import { Failures } from "../commands/commands"
import { getMiteId } from "../mite/getMiteId"
import config from "../config"
import { Repository } from "../db/user-repository"
import { lastWeekThursdayToThursday, getMissingTimeEntries } from "../mite/time"
import { createUserContext } from "./createUserContext"
import { isCheckContext } from "./userContext"

const { timezone } = config

export const scheduleCronJobs = (app: App, repository: Repository): void => {
    scheduleDailyCron(repository, app)
}

const scheduleDailyCron = (repository: Repository, app: App) => {
    cron.schedule("0 9 * * 1-5", async () => {
        const users = repository.loadAllUsers()
        console.log(`Running daily cron for ${users.length} users.`)
        users.forEach(async user => { // for (const user in users) gets the type wrong for some reason (it is not string)
            const { start, end } = lastWeekThursdayToThursday(moment())
            const context = createUserContext(repository, user.slackId)

            if(!isCheckContext(context)) {
                return sayPleaseRegisterWithApiKey(app, config.slackToken, user.slackId)
            }

            const miteId = await getMiteId(context)

            if (miteId === Failures.UserIsUnknown) {
                return sayPleaseRegisterWithApiKey(app, config.slackToken, user.slackId)
            }

            getMissingTimeEntries(miteId, start, end, context.miteApi)
                .then(times => {
                    if (times.length > 0) {
                        const text = "Your time entries for the following dates are missing or contain 0 minutes:\n"
                        + times.map(date => `https://leanovate.mite.yo.lk/#${date.format("YYYY/MM/DD")}`)
                            .join("\n")

                        app.client.chat.postMessage({
                            token: config.slackToken,
                            channel: user.slackId,
                            text
                        })
                    }
                }).catch(e => {
                    console.log("Error when running daily cron:", e)
                    app.client.chat.postMessage({
                        token: config.slackToken,
                        channel: user.slackId,
                        text: "I tried check your mite time entries, but something went wrong. Please inform the mite bot admin."
                    })
                })
        })
    }, { timezone })
}

async function sayPleaseRegisterWithApiKey(app: App, token: string, channel: string): Promise<void> {
    app.client.chat.postMessage({
        token,
        channel,
        text: "I cannot remind you because I can't find your mite account. Please register with your mite api key from https://leanovate.mite.yo.lk/myself and send `register <YOUR_MITE_API_KEY>`."
    })
}