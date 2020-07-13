import { MiteCommand } from "./commandParser"
import { getMissingTimeEntries } from "../reminder/reminder"
import moment from "moment"

export async function runCommand(command: MiteCommand): Promise<void> {
    switch (command.name) {
    case "check":
        await getMissingTimeEntries(
            "current",
            moment().subtract(40, "day"),
            moment())
            .then(console.log)
        break
    case "register":
        console.log("register not implemented")
        break
    case "unregister":
        console.log("unregister not implemented")
        break
    default:
        console.log("Received an unknown command.", command)
    }
}