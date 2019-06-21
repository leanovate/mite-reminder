const isWeekend = dateAsMoment => [0, 6].includes(dateAsMoment.day())

const isTimeEnteredOnDay = (miteEntries, day) =>
    miteEntries
        .map(entry => entry.time_entry)
        .find(time_entry =>
            time_entry.date_at === day.format("YYYY-MM-DD")
            && time_entry.minutes !== 0) !== undefined

const getDatesBetween = (start, end) => {
    const datesToCheck = []
    let date = start.clone()
    while (date.isBefore(end)) {
        datesToCheck.push(date.clone())
        date.add(1, "day")
    }
    return datesToCheck
}

module.exports = {
    isWeekend,
    isTimeEnteredOnDay,
    getDatesBetween
}