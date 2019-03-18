const miteApi = require("mite-api")
const { getDatesBetween, isWeekend } = require("./time")

const createMiteApi = apiKey => miteApi({
    account: 'leanovate',
    apiKey: apiKey,
    applicationName: 'leanovate-mite-reminder'
});

getTimeEntries = (mite, userId, from, to) =>
    new Promise(resolve => mite.getTimeEntries({
        from: from.format("YYYY-MM-DD"),
        to: to.format("YYYY-MM-DD"),
        user_id: userId
    }, (_, result) => {
        const times = result.map(entry => entry.time_entry.date_at)
        const datesToCheck = getDatesBetween(from, to)
        resolve(datesToCheck
            .filter(date => !date.isHoliday())
            .filter(date => !isWeekend(date))
            .filter(date => !times.includes(date.format("YYYY-MM-DD")))
            .map(date => date.format("YYYY-MM-DD"))
        )
    }))

module.exports = {
    createMiteApi,
    getTimeEntries
}