import config from "../config"
import { SayFn } from "@slack/bolt"

const helpTextAdmin = `
Use \`register\` to receive mite reminders in the future.
Use \`check\` to for missing time entries. Holidays and weekends are automatically excluded.
Use \`unregister\` to undo your registration.
`
const helpTextNoAdmin = `
Use \`register <MITE_API_KEY>\` to receive mite reminders in the future. You can find your api key here: https://leanovate.mite.yo.lk/myself
Use \`check\` to for missing time entries. Holidays and weekends are automatically excluded.
Use \`unregister\` to undo your registration.
`

const helpText = config.useMiteAdminKey ? helpTextAdmin : helpTextNoAdmin

export const sayHelp = async (say: SayFn) : Promise<void> => {
    await say(helpText)
}