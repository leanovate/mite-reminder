import { Moment } from "moment"
import { TimeEntries } from "./types"

const isWeekend = (dateAsMoment: Moment) => [0, 6].includes(dateAsMoment.day())

const isTimeEnteredOnDay = (miteEntries: TimeEntries, day: Moment) =>
    miteEntries
        .map(entry => entry.time_entry)
        .find(time_entry =>
            time_entry.date_at === day.format("YYYY-MM-DD")
            && time_entry.minutes !== 0) !== undefined

const getDatesBetween = (start: Moment, end: Moment): Moment[] => {
    const datesToCheck = []
    let date = start.clone()
    while (date.isSameOrBefore(end, "day")) {
        datesToCheck.push(date.clone())
        date.add(1, "day")
    }
    return datesToCheck
}

export {
  isWeekend,
  isTimeEnteredOnDay,
  getDatesBetween
}