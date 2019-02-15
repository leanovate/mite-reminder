#!/usr/bin/env node
const miteApi = require("mite-api")
const prompts = require("prompts");
const moment = require("./moment-holiday-berlin.min"); // compiled with https://github.com/kodie/moment-holiday
const { createMiteApi } = require("./mite/mite-api")
const { isWeekend} = require("./mite/time")
const config = require("./mite/config")

const API_KEY = config.get().apiKey
const ACCOUNT_NAME = config.get().account 

if (!!!API_KEY) {
    console.error("Mite key is not set!")
    console.error("Please set the key via the 'mite' command")
    console.error("Your api key can be found here: https://<account>.mite.yo.lk/myself where account is the name of the organization")
    process.exit()
}

const mite = createMiteApi(API_KEY)

const referenceDay = moment().subtract(15, "day") // referer to the previous month until the 15th
const startOfMonth = referenceDay.clone().startOf("month")
const endOfMonth = referenceDay.clone().endOf("month")

const createTimeEntry = entry => new Promise((resolve, _) => mite.addTimeEntry(entry, (_, result) => resolve(result)))
const createNonProjectEntry = async dateAsString => createTimeEntry({
    date_at: dateAsString,
    note: "non-project day",
    minutes: 480,
    project_id: 1081386,
    service_id: 238652,
})
const pomptForDate = async date => prompts({
    type: 'toggle',
    name: 'value',
    message: `Did you work in a project on '${date.format("dddd")} ${date.format("YYYY-MM-DD")}?'`,
    initial: true,
    active: 'yes',
    inactive: 'no'
})

const runTimeEntries = () => mite.getTimeEntries({
    from: startOfMonth.format("YYYY-MM-DD"),
    to: endOfMonth.format("YYYY-MM-DD"),
    user_id: 'current'
}, async (_, result) => {
    const times = result.map(entry => entry.time_entry.date_at)
    let date = startOfMonth.clone()
    while (date.isBefore(endOfMonth)) {
        const dateAsString = date.format("YYYY-MM-DD")
        const isHoliday = date.isHoliday()
        if (isHoliday) {
            console.log(`Skipping ${dateAsString} because it is a holiday (${isHoliday})`)
        }
        if (!times.includes(dateAsString) && !isWeekend(date) && !isHoliday) {
            console.log("\n")
            const didWork = (await pomptForDate(date)).value;
            if (didWork === undefined) {
                console.log("aborting...")
                break // breaking because the user did not select yes or no (likely Ctrl+C)
            } else if (didWork) {
                console.log(`Your times are missing, please update them here: https://${ACCOUNT_NAME}.mite.yo.lk/#${date.format("YYYY/MM/DD")}`)
            } else {
                await createNonProjectEntry(dateAsString)
                console.log("Ok, I've marked that day a non-project time")
            }
        }
        date.add(1, "day")
    }
    console.log(`\nNo time entries left to check in month ${startOfMonth.format("MMMM")}.`)
})

runTimeEntries()