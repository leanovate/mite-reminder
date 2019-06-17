const moment = require("../moment-holiday-berlin.min"); // compiled with https://github.com/kodie/moment-holiday
const cron = require('node-cron');
const { createMiteApi, getTimeEntries } = require("../mite/mite-api")
const { registerUser, unregisterUser, getDb } = require("./db")
const { getCommand } = require("./commands")
const { send, createBot } = require("./utils")

if (!process.env.SLACK_TOKEN) {
    console.error("SLACK_TOKEN environment variable not set.\n")
    console.log("Either run 'export SLACK_TOKEN=<slack bot token>'")
    console.log("or run again with 'SLACK_TOKEN=<slack bot token> npm run bot'")
    process.exit()
}

const helpText = `
Use \`register <your mite api key>\` to receive mite reminders in the future.
    Your mite api key can be found here https://leanovate.mite.yo.lk/myself ).
Use \`check\` to for missing time entries. Holidays and weekends are automatically excluded.
Use \`unregister\` to undo your registration.
`

const commands = context => ({
    register: ({ miteApiKey }) => registerUser(context, miteApiKey),
    unregister: () => unregisterUser(context),
    help: () => send(context, helpText),
    check: () => {
        send(context, "Checking time entries for the last 40 days (exlcuding today)")
        runTimeEntries(
            context,
            moment().subtract(40, "days").startOf("day"),
            moment().startOf("day"),
            () => send(context, "You completed all time entries!"))
    },
    unknown: () => send(context, "I don't know this command. Send `help` to find out what you can do."),
})

let db = {}
getDb(result => db = result)

const runTimeEntries = async (context, start, end, onNothingToReport) => {
    if (!context.db[context.user]) {
        send(context, "You are not registered, cannot check mite entries.")
        console.log("Failed to get time entries because user was not found in db")
        return
    }

    try {
        const datesWithoutEntires = await getTimeEntries(
            createMiteApi(context.db[context.user].miteApiKey),
            "current",
            start,
            end
        )
        console.log(`found ${datesWithoutEntires.length} that need time entries`)
        if (datesWithoutEntires.length > 0) {
            const message = "Your time entries for the following dates are missing or contain 0 minutes:\n"
                + datesWithoutEntires.map(date => `https://leanovate.mite.yo.lk/#${date.format("YYYY/MM/DD")}`)
                    .join("\n")
            send(context, message)
        } else {
            onNothingToReport && onNothingToReport()
        }
    } catch (err) {
        send(context, err)
        console.log("Failed to get time entries: ", err)
    }
}

const bot = createBot("mite-reminder")

bot.on('start', () => {
    console.log("Bot started.")
})
bot.on('message', data => {
    if (data.type === 'message' && data.bot_id === undefined) {
        bot.openIm(data.user).then(im => {
            if (im.channel.id === data.channel) {
                const context = { bot, user: data.user, db }
                const command = getCommand(data.text)
                commands(context)[command.name](command)
            }
        })
    }
})
bot.on('close', data => {
    console.log("Bot disconnected, will try to reconnect", data)
    bot.login()
});
bot.on('error', data => {
    console.log("Bot got an error", data)
});

cron.schedule('30 9 1 * *', () => {
    console.log(`Running monthly cron for ${Object.keys(db).length} users.`)
    for (let user in db) {
        if (db.hasOwnProperty(user)) {
            const context = { bot, user, db }

            const referenceDay = moment().subtract(15, "day") // refer to the previous month until the 15th
            const startOfMonth = referenceDay.clone().startOf("month")
            const endOfMonth = referenceDay.clone().endOf("month")
            runTimeEntries(context, startOfMonth, endOfMonth)
        }
    }
});

cron.schedule('0 9 * * 1-5', () => {
    console.log(`Running daily cron for ${Object.keys(db).length} users.`)
    for (let user in db) {
        if (db.hasOwnProperty(user)) {
            const context = { bot, user, db }

            const referenceDay = moment()
            const mostRecentThursday = referenceDay.clone().day(referenceDay.day() >= 4 ? 4 : -3);
            const secondMostRecentThursday = mostRecentThursday.clone().subtract(1, "week")
            runTimeEntries(context, secondMostRecentThursday, mostRecentThursday)
        }
    }
});