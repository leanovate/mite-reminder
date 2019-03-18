const moment = require("./moment-holiday-berlin.min"); // compiled with https://github.com/kodie/moment-holiday
const { createMiteApi, getTimeEntries } = require("./mite/mite-api")
const { loadUsersToCheck } = require("./bot/db")

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


const getUsers = () => mite.getUsers(
    {},
    async (_, result) => {
        const r = result.map(u => ({ id: u.user.id, name: u.user.name }))
        console.log("Users:", r)
    })

const runTimeEntries = async userId => {
    const userName = await getUserName(mite, userId)
    const missingEntries = await getTimeEntries(
        mite,
        userId,
        startOfMonth,
        endOfMonth)
    return { userName, missingEntries }
}

const runAllTimeEntires = async () => {
    const ids = await loadUsersToCheck()
    const results = await Promise.all(ids.map(id => runTimeEntries(id)))
    console.log(results)
}

const command = process.argv[2]

switch (command) {
    case "users":
        getUsers()
        break;
    case "times":
        runAllTimeEntires()
        break;
}
