import readline from "readline"
import { parse } from "../commands/commandParser"
import { CommandRunner, Failures } from "../commands/commands"
import { createRepository } from "../db/create-user-repository"
import { Repository } from "../db/user-repository"
import { createUserContext } from "../slack/events"

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const requestAndRunCommand = async (repository: Repository): Promise<void> => {
    rl.question("Enter a command ", async (answer) => {
        const parsedAnswer = parse(answer)

        if (parsedAnswer.status) {
            const context = createUserContext(repository, "cmd-user")
            const command = parsedAnswer.value
            const runner = new CommandRunner(context)

            if (command.name === "check") {
                const result = await runner.runMiteCommand(command)
                console.log(`Finished running command ${command.name}`)

                if (result === Failures.ApiKeyIsMissing || result === Failures.UserIsUnknown) {
                    console.log("Could not check because ", result)
                } else {
                    console.log("Your time entries for the following dates are missing or contain 0 minutes:\n"
                        + result.map(date => `https://leanovate.mite.yo.lk/#${date.format("YYYY/MM/DD")}`)
                            .join("\n"))
                }
            } else {
                await runner.runMiteCommand(command)
            }
        } else {
            console.log("I don't understand")
            throw new Error("Unknown command")
        }

        rl.close()
    })
}

createRepository()
    .then(repository => requestAndRunCommand(repository))
    .catch(e => console.log("Unable to run command:", e))
