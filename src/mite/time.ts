import { Moment } from "moment"
import { TimeEntries } from "mite-api"

const isWeekend = (dateAsMoment: Moment): boolean => [0, 6].includes(dateAsMoment.day())

const isTimeEnteredOnDay = (miteEntries: TimeEntries, day: Moment): boolean =>
    miteEntries
        .map(entry => entry.time_entry)
        .find(time_entry =>
            time_entry.date_at === day.format("YYYY-MM-DD")
            && time_entry.minutes !== 0) !== undefined

const getDatesBetween = (start: Moment, end: Moment): Moment[] => {
    const datesToCheck = []
    const date = start.clone()
    while (date.isSameOrBefore(end, "day")) {
        datesToCheck.push(date.clone())
        date.add(1, "day")
    }
    return datesToCheck
}

const lastWeekThursdayToThursday = (currentMoment: Moment): { start: Moment, end: Moment } => {
    const mostRecentThursday = currentMoment.clone().day(currentMoment.day() > 4 ? 4 : -3)
    const secondMostRecentThursday = mostRecentThursday.clone().subtract(1, "week")

    return {
        start: secondMostRecentThursday,
        end: mostRecentThursday
    }
}

export {
    isWeekend,
    isTimeEnteredOnDay,
    getDatesBetween,
    lastWeekThursdayToThursday
}
