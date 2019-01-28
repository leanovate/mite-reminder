const SlackBot = require('slackbots');

const miteApi = require("mite-api")
const moment = require("./moment-holiday-berlin.min"); // compiled with https://github.com/kodie/moment-holiday
const fs = require('fs');
var cron = require('node-cron');

if (!process.env.SLACK_TOKEN) {
    console.error("SLACK_TOKEN environment variable not set.\n")
    console.log("Either run 'export SLACK_TOKEN=<slack bot token>'")
    console.log("or run again with 'SLACK_TOKEN=<slack bot token> npm run bot'")
    process.exit()
}

let db = {}
fs.readFile('db.json', 'utf8', (err, data) => {
    if (err) {
        console.err("Error when loading db", err)
    }
    if (data) {
        db = JSON.parse(data)
    }
})

const createMiteApi = apiKey => miteApi({
    account: 'leanovate',
    apiKey: apiKey,
    applicationName: 'leanovate-mite-reminder'
});

const isWeekend = dateAsMoment => [0, 6].includes(dateAsMoment.day())

const send = async (context, message) => await context.bot.postMessageToUser(context.db[context.user].name, message)
const sendToId = async (context, message) => await context.bot.postMessage(context.user, message)

const isTimeEnteredOnDay = (miteEntries, day) =>
    miteEntries.map(entry => entry.time_entry.date_at).includes(day.format("YYYY-MM-DD"))
    && miteEntries
        .map(entry => entry.time_entry)
        .filter(time_entry => time_entry.date_at === day.format("YYYY-MM-DD"))[0].minutes !== 0
const runTimeEntries = (context, start, end) => {
    createMiteApi(context.db[context.user].miteApiKey).getTimeEntries({
        from: start.format("YYYY-MM-DD"),
        to: end.format("YYYY-MM-DD"),
        user_id: 'current'
    }, async (_, result) => {
        if (!context.db[context.user]) {
            console.log("Failed to get time entries because user was not found in db")
        }
        let datesToCheck = []
        let date = start.clone()
        while (date.isBefore(end)) {
            datesToCheck.push(date.clone())
            date.add(1, "day")
        }
        const datesWithoutEntires = datesToCheck
            .filter(date => !isWeekend(date) && !date.isHoliday() && !isTimeEnteredOnDay(result, date))

        console.log(`found ${datesWithoutEntires.length} that need time entries`)
        if (datesWithoutEntires.length > 0) {
            const message = "Your time entries for the following dates are missing or contain 0 minutes:\n"
                + datesWithoutEntires.map(date => `https://leanovate.mite.yo.lk/#${date.format("YYYY/MM/DD")}`)
                    .join("\n")
            send(context, message)
        }
    })
}

const updateDb = (context, value) => {
    context.db[context.user] = value
    fs.writeFile('db.json', JSON.stringify(context.db), 'utf8', err => {
        if (err) {
            console.err("Failed to update db", err)
            send(context, "Sorry, there was an error completing your action")
        }
        console.log(`Updated db at key '${context.user}'`);
    })
}
const removeFromDb = (context) => {
    delete context.db[context.user]
    fs.writeFile('db.json', JSON.stringify(context.db), 'utf8', err => {
        if (err) {
            console.err("Failed to update db", err)
            sendToId(context, "Sorry, there was an error completing your action")
        }
        console.log(`Removed db at key '${context.user}'`);
    })
}
const registerUser = (context, name, miteApiKey) => {
    updateDb(context, { name, miteApiKey })
    send(context, `Hi ${name}, I registered you. You can now check your times with \`check\`!`)
}
const unregisterUser = (context) => {
    removeFromDb(context)
    sendToId(context, `Ok, I successfully unregistered you.`)
}

var bot = new SlackBot({
    token: process.env.SLACK_TOKEN,
    name: 'mite reminder'
});
bot.on('start', () => {
    console.log("Bot started.")
})
bot.on('message', data => {
    if (data.type === 'message' && data.bot_id === undefined) {
        bot.openIm(data.user).then(im => {
            if (im.channel.id === data.channel) {
                const context = { bot, user: data.user, db }
                if (data.text === "help") {
                    sendToId(context, "Use `register <your slack name> <your mite api key>` to receive mite reminders in the future. Use `check` to list missing times in the last 60 days. Use `unregister` to undo your registration.")
                } else if (data.text.startsWith("register")) {
                    const parts = data.text.split(" ")
                    registerUser(context, parts[1], parts[2])
                } else if (data.text === "unregister") {
                    unregisterUser(context)
                } else if (data.text === "check") {
                    send(context, "Checking time entries for the last 40 days...")
                    runTimeEntries(context, moment().subtract(40, "days").startOf("day"), moment().endOf("day"))
                    send(context, "...done")
                } else {
                    const userName = context.db[context.user].name
                    sendToId(context, `Hi${userName ? ` ${userName}` : ""}, I don't know this command. Send \`help\` to the \`mite\`-bot find out what you can do.`)
                }
            }
        })
    }
})

cron.schedule('0 9 1 * *', () => {
    console.log(`Running cron for ${Object.keys(db).length} users.`)
    for (let user in db) {
        if (db.hasOwnProperty(user)) {
            const context = { bot, user, db }

            const referenceDay = moment().subtract(1, "month").subtract(15, "day") // referer to the previous month until the 15th
            const startOfMonth = referenceDay.clone().startOf("month")
            const endOfMonth = referenceDay.clone().endOf("month")
            runTimeEntries(context, startOfMonth, endOfMonth)
        }
    }
});