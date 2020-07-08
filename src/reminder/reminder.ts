import { Moment } from "moment"
import { isHoliday } from "../mite/holidays"
import { createMiteApi, getTimeEntries } from "../mite/mite-api-wrapper"
import { getDatesBetween, isTimeEnteredOnDay, isWeekend } from "../mite/time"
import { TimeEntries } from "../mite/types"
import config from "../config"

if (!config.miteApiKey) {
    throw new Error("mite api key not set") //TODO make this a non-requirement
}
const miteApi = createMiteApi(config.miteApiKey)

export async function getMissingTimeEntries(miteUserId: string, from: Moment, to: Moment): Promise<Moment[]> {
    let timeEntries: TimeEntries = []
    try {
        timeEntries = await getTimeEntries(miteApi, miteUserId, from, to)
    }
    catch (error) {
        console.error("Failed to get time entries: ", error)
    }

    const datesToCheck = getDatesBetween(from, to)

    return datesToCheck
        .filter(date => !isHoliday(date))
        .filter(date => !isWeekend(date))
        .filter(date => !isTimeEnteredOnDay(timeEntries, date))
}
