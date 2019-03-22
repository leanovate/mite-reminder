const moment = require("./moment-holiday-berlin.min"); // compiled with https://github.com/kodie/moment-holiday
const { createMiteApi, getTimeEntries } = require("./mite/mite-api")
const { loadUsersToCheck } = require("./bot/db")
const { createBot, send } = require("./bot/utils")

if (!process.env.MITE_API_KEY) {
    console.error("MITE_API_KEY environment variable not set.\n")
    console.log("Either run 'export MITE_API_KEY=<your key>'")
    console.log("or run again with 'MITE_API_KEY=<your key> npm start'")
    console.log("Your api key can be found here: https://leanovate.mite.yo.lk/myself")
    process.exit()
}

const mite = createMiteApi(process.env.MITE_API_KEY)

const now = moment()
const fourtyDaysAgo = now.clone().subtract(40, "days")


const getUsers = async () => {
    const miteUsers = (await new Promise(resolve => mite.getUsers(
        {},
        async (_, result) => {
            const r = result.map(u => ({ id: u.user.id, name: u.user.name }))
            resolve(r)
        })
    )).map(user => `${user.name}, ${user.id}`)
    const slackUsers = (await createBot("mite-reminder-admin-bot", true).getUsers())
        .members
        .filter(user => !user.deleted)
        .map(user => ({ id: user.id, name: user.real_name }))
        .map(user => `${user.name}, ${user.id}`)
    console.log("mite users:\n", miteUsers.join("\n"))
    console.log("\n")
    console.log("slack users:\n", slackUsers.join("\n"))
}

const runTimeEntries = async userId => {
    const userName = await getUserName(mite, userId)
    const missingEntries = await getTimeEntries(
        mite,
        userId,
        fourtyDaysAgo,
        now)
    return { userName, missingEntries }
}

const runAllTimeEntires = async () => {
    const users = await loadUsersToCheck()
    const miteIds = users.map(user => user.miteId)
    const results = (await Promise.all(miteIds.map(id => runTimeEntries(id))))
        .map(entry => `${entry.missingEntries.length} days missing: ${entry.userName}`)
    console.log(results)
}

const remindAll = async () => {
    const users = await loadUsersToCheck()
    const results = await Promise.all(users.map(async user => ({ user, missingEntries: await runTimeEntries(user.miteId).then(result => result.missingEntries) })))
    const bot = createBot("mite-reminder-admin-bot", true)
    results.forEach(result => {
        if (result.missingEntries.length === 0) {
            return
        }
        const message = "Your are missing mite entries, please update them here:\n"
            + result.missingEntries
                .map(date => `* https://leanovate.mite.yo.lk/#${date.format("YYYY/MM/DD")}`)
                .join("\n")
        send({ bot, user: result.user.slackId }, message)
    })
}

const command = process.argv[2]

switch (command) {
    case "users":
        getUsers()
        break;
    case "times":
        runAllTimeEntires()
        break;
    case "remind":
        remindAll()
        break;
}