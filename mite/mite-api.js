const miteApi = require("mite-api")
const { getDatesBetween, isWeekend } = require("./time")

const createMiteApi = apiKey => miteApi({
    account: 'leanovate',
    apiKey: apiKey,
    applicationName: 'leanovate-mite-reminder'
});

getTimeEntries = (mite, userId, from, to) =>
    new Promise((resolve, reject) => mite.getTimeEntries({
        from: from.format("YYYY-MM-DD"),
        to: to.format("YYYY-MM-DD"),
        user_id: userId
    }, (_, result) => {
        if (typeof result !== "object") {
            reject(result)
            return
        }
        const times = result.map(entry => entry.time_entry.date_at)
        const datesToCheck = getDatesBetween(from, to)
        resolve(datesToCheck
            .filter(date => !date.isHoliday())
            .filter(date => !isWeekend(date))
            .filter(date => !times.includes(date.format("YYYY-MM-DD")))
        )
    }))

getUserName = (mite, userId) =>
    new Promise(resolve => mite.getUser(userId, (_, result) => resolve(result.user.name)))

module.exports = {
    createMiteApi,
    getTimeEntries
}