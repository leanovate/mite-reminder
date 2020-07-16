import { Moment } from "moment"
import { isHoliday } from "../mite/holidays"
import { getTimeEntries } from "../mite/mite-api-wrapper"
import { getDatesBetween, isTimeEnteredOnDay, isWeekend } from "../mite/time"
import { TimeEntries } from "../mite/types"
import { MiteApi } from "mite-api"

export async function getMissingTimeEntries(
    miteUserId: string, 
    from: Moment, 
    to: Moment, 
    api: MiteApi): Promise<Moment[]> {
    let timeEntries: TimeEntries = []
    try {
        timeEntries = await getTimeEntries(api, miteUserId, from, to)
    }
    catch (error) {
        console.error("Failed to get time entries: ", error)
        return []
    }

    const datesToCheck = getDatesBetween(from, to)

    return datesToCheck
        .filter(date => !isHoliday(date))
        .filter(date => !isWeekend(date))
        .filter(date => !isTimeEnteredOnDay(timeEntries, date))
}
