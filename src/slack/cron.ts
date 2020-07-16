import cron from "node-cron"
import config from "../config"
import { Repository } from "../db/user-repository"
import { getMissingTimeEntries } from "../reminder/reminder"
import { createMiteApi } from "../mite/mite-api-wrapper"
import { lastWeekThursdayToThursday } from "../mite/time"
import moment from "moment"

const { timezone } = config

export const scheduleCronJobs = (repository: Repository): void => {
    scheduleDailyCron(repository)
}

const scheduleDailyCron = (repository: Repository) => {
    cron.schedule("0 9 * * 1-5", () => {
        const users = repository.loadAllUsers()
        console.log(`Running daily cron for ${users.length} users.`)
        for (const user in users) {
    
            const { start, end } = lastWeekThursdayToThursday(moment())

            const miteApi = createMiteApi("miteApiKey") // TODO
            getMissingTimeEntries("miteUserId", start, end, miteApi) // TODO
        }
    }, { timezone })
}
