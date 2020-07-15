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

// TODO: This decision is probably not statical. It depends on the current user and if he/she has
// previously registered.
const helpText = config.useMiteAdminKey ? helpTextAdmin : helpTextNoAdmin

export const sayHelp = (say: SayFn) : Promise<void> => {
    return say(helpText)
        .then(() => undefined)
}