import { Moment } from "moment"
import { TimeEntries, MiteApi } from "mite-api"
import { getTimeEntries } from "./miteApiWrapper"
import { isHoliday } from "./holidays"
import { TaskEither } from "fp-ts/lib/TaskEither"
import { AppError } from "../app/errors"
import { pipe } from "fp-ts/lib/function"
import { taskEither } from "fp-ts"

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

const lastMonth = (currentMoment: Moment): { start: Moment, end: Moment } => {
    const pastMonth = currentMoment.clone().subtract(1, "month")
    const startOfPastMonth = pastMonth.clone().startOf("month")
    const endOfPastMonth = pastMonth.clone().endOf("month")

    return {
        start: startOfPastMonth,
        end: endOfPastMonth
    }
}

const lastFortyDays = (currentMoment: Moment): { start: Moment, end: Moment } => {
    return {
        start: currentMoment.clone().subtract(40, "days"),
        end: currentMoment.clone().subtract(1, "day")
    }
}

function getMissingTimeEntries(
    miteUserId: number | "current", 
    from: Moment, 
    to: Moment, 
    api: MiteApi): TaskEither<AppError, Moment[]> {

    return pipe(
        getTimeEntries(api, miteUserId, from, to),
        taskEither.map(timeEntries => getDatesBetween(from, to)
            .filter(date => !isHoliday(date))
            .filter(date => !isWeekend(date))
            .filter(date => !isTimeEnteredOnDay(timeEntries, date)))
    )
}

const formatTimeReadable = (moment: Moment): string => moment.format("dd YYYY/MM/DD")

export {
    isWeekend,
    isTimeEnteredOnDay,
    getDatesBetween,
    lastWeekThursdayToThursday,
    getMissingTimeEntries,
    lastMonth,
    lastFortyDays,
    formatTimeReadable
}
