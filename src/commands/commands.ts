import { Command } from "./commandParser"
import { getMissingTimeEntries } from "../reminder/reminder"
import moment from "moment"

export async function runCommand(command: Command): Promise<void> {
    switch (command) {
    case "check":
        await getMissingTimeEntries(
            "current",
            moment().subtract(40, "day"),
            moment())
            .then(console.log)
        return
    case "register":
        console.log("register not implemented")
        return
    case "unregister":
        console.log("unregister not implemented")
        return
    }
    if (command.name === "register") {
        console.log(`register with mite api key (${command.miteApiKey}) not implemented.`)
        return
    }
    console.log("got nothing", command)
}