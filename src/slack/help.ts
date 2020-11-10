import config from "../config"
import { SayFn } from "@slack/bolt"

const sharedHelpText = `
Use \`sync\` to synchronize your calendar events with mite. All events with #mite <PROJECT_ID>/<SERVICE_ID> in description within the last seven days will be added automatically.
Use \`projects <SEARCH_TEXT>\` the Project- or Service-IDs where the name contains <SEARCH_TEXT>.
Use \`check <CHANNEL>\` to get a list of people in channel which filled all mite events for the last week and those who didn't.
Use \`check\` to for missing time entries. Holidays and weekends are automatically excluded.
Use \`unregister\` to undo your registration.
`
const helpTextAdmin = `
Use \`register\` to receive mite reminders in the future.
${sharedHelpText}
`
const helpTextNoAdmin = `
Use \`register <MITE_API_KEY>\` to receive mite reminders in the future. You can find your api key here: https://${config.miteAccountName}.mite.yo.lk/myself
${sharedHelpText}
`
const helpText = config.miteApiKey ? helpTextAdmin : helpTextNoAdmin

export const sayHelp = async (say: SayFn) : Promise<void> => {
    await say(helpText)
}