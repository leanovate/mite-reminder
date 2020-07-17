import cron from "node-cron"
import config from "../config"
import { Repository } from "../db/user-repository"
import { getMissingTimeEntries } from "../reminder/reminder"
import { createMiteApi } from "../mite/mite-api-wrapper"
import { lastWeekThursdayToThursday } from "../mite/time"
import moment from "moment"
import { App } from "@slack/bolt"
import { getMiteCredentials, Failures } from "../commands/commands"

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
            const result = await getMiteCredentials(repository, user.slackId, config)

            if (result === Failures.ApiKeyIsMissing || result === Failures.UserIsUnknown) {
                app.client.chat.postMessage({
                    token: config.slackToken,
                    channel: user.slackId,
                    text: "I cannot remind you because I can't find your mite account. Please register with your mite api key from https://leanovate.mite.yo.lk/myself and send `register <YOUR_MITE_API_KEY>`."
                })
                return
            }
            const miteApi = createMiteApi(result.apiKey)
            getMissingTimeEntries(result.miteId, start, end, miteApi)
                .then(times => {
                    // if (times.length > 0) {

                    app.client.chat.postMessage({
                        token: config.slackToken,
                        channel: user.slackId,
                        text: "Yay cron job ran"
                    })

                    // say("Your time entries for the following dates are missing or contain 0 minutes:\n"
                    //     + times.map(date => `https://leanovate.mite.yo.lk/#${date.format("YYYY/MM/DD")}`)
                    //         .join("\n"))
                    // }
                }).catch(e => {
                    console.log("Error when running daily cron:", e)
                    // TODO also send an error via slack?
                })
        })
    }, { timezone })
}
