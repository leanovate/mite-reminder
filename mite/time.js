const isWeekend = dateAsMoment => [0, 6].includes(dateAsMoment.day())

const isTimeEnteredOnDay = (miteEntries, day) =>
    miteEntries.map(entry => entry.time_entry.date_at).includes(day.format("YYYY-MM-DD"))
    && miteEntries
        .map(entry => entry.time_entry)
        .filter(time_entry => time_entry.date_at === day.format("YYYY-MM-DD"))[0].minutes !== 0
        
module.exports = {
    isWeekend,
    isTimeEnteredOnDay
}