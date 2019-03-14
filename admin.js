const moment = require("./moment-holiday-berlin.min"); // compiled with https://github.com/kodie/moment-holiday
const { createMiteApi } = require("./mite/mite-api")
const { isWeekend } = require("./mite/time")
const fs = require('fs');

if (!process.env.MITE_API_KEY) {
    console.error("MITE_API_KEY environment variable not set.\n")
    console.log("Either run 'export MITE_API_KEY=<your key>'")
    console.log("or run again with 'MITE_API_KEY=<your key> npm start'")
    console.log("Your api key can be found here: https://leanovate.mite.yo.lk/myself")
    process.exit()
}

const mite = createMiteApi(process.env.MITE_API_KEY)

const referenceDay = moment().subtract(15, "day") // referer to the previous month until the 15th
const startOfMonth = referenceDay.clone().startOf("month")
const endOfMonth = referenceDay.clone().endOf("month")

const getDatesBetween = (start, end) => {
    const datesToCheck = []
    let date = start.clone()
    while (date.isBefore(end)) {
        datesToCheck.push(date.clone())
        date.add(1, "day")
    }
    return datesToCheck
}

const getUsers = () => mite.getUsers(
    {},
    async (_, result) => {
        const r = result.map(u => ({ id: u.user.id, name: u.user.name }))
        console.log("Users:", r)
    })

getTimeEntries = (userId, from, to) =>
    new Promise(resolve => mite.getTimeEntries({
        from,
        to,
        user_id: userId
    }, (_, result) => {
        const times = result.map(entry => entry.time_entry.date_at)
        const datesToCheck = getDatesBetween(startOfMonth, endOfMonth)
        resolve(datesToCheck
            .filter(date => !date.isHoliday())
            .filter(date => !isWeekend(date))
            .filter(date => !times.includes(date.format("YYYY-MM-DD")))
            .map(date => date.format("YYYY-MM-DD"))
        )
    }))
getUserName = userId =>
    new Promise(resolve => mite.getUser(userId, (_, result) => resolve(result.user.name)))


const runTimeEntries = async userId => {
    const userName = await getUserName(userId)
    const missingEntries = await getTimeEntries(
        userId,
        startOfMonth.format("YYYY-MM-DD"),
        endOfMonth.format("YYYY-MM-DD"))
    return { userName, missingEntries }
}

const runAllTimeEntires = async () => {
    const ids = await loadUsersToCheck()
    const results = await Promise.all(ids.map(id => runTimeEntries(id)))
    console.log(results)
}

const loadUsersToCheck = () =>
    new Promise(resolve =>
        fs.readFile('users.csv', 'utf8', (err, data) => {
            if (err) {
                console.error("Error when loading users to check", err)
            }
            if (data) {
                resolve(
                    data
                        .split(/\r?\n/)
                        .map(entry => entry.split(",")[0])
                )
            }
        })
    )


const command = process.argv[2]

switch (command) {
    case "users":
        getUsers()
        break;
    case "times":
        runAllTimeEntires()
        break;
}
