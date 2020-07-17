import cron from "node-cron"
import config from "../config"
import { Repository } from "../db/user-repository"
import { getMissingTimeEntries } from "../reminder/reminder"
import { createMiteApi } from "../mite/mite-api-wrapper"
import { lastWeekThursdayToThursday } from "../mite/time"
import moment from "moment"
import { SayFn } from "@slack/bolt"

const { timezone } = config

export const scheduleCronJobs = (repository: Repository, say: SayFn): void => {
    scheduleDailyCron(repository, say)
}

const scheduleDailyCron = (repository: Repository, say: SayFn) => {
    cron.schedule("0 9 * * 1-5", () => {
        const users = repository.loadAllUsers()
        console.log(`Running daily cron for ${users.length} users.`)
        users.forEach(user => { // for (const user in users) gets the type wrong for some reason (it is not string)
            const { start, end } = lastWeekThursdayToThursday(moment())

            const miteId = repository.getMiteId(user.slackId)
            if (miteId === null) {
                say("I cannot remind you because I can't find your mite account. Please register with your mite api key from https://leanovate.mite.yo.lk/myself and send `register <YOUR_MITE_API_KEY>`.")
                return
            }
            const miteApi = createMiteApi(miteId)
            getMissingTimeEntries(miteId, start, end, miteApi)
                .then(times => {
                    if (times.length > 0) {
                        say("Your time entries for the following dates are missing or contain 0 minutes:\n"
                            + times.map(date => `https://leanovate.mite.yo.lk/#${date.format("YYYY/MM/DD")}`)
                                .join("\n"))
                    }
                }).catch(e => {
                    console.log("Error when running daily cron:", e)
                    // TODO also send an error via slack?
                })
        })
    }, { timezone })
}
