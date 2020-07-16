import readline from "readline"
import { CommandRunner } from "../commands/commands"
import { parse } from "../commands/commandParser"
import { Repository } from "../db/user-repository"
import config from "../config"
import { createRepository } from "../db/create-user-repository"

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const requestAndRunCommand = async (repository: Repository): Promise<void> => {
    rl.question("Enter a command ", async (answer) => {
        const parsedAnswer = parse(answer)

        if (parsedAnswer.status) {
            const command = parsedAnswer.value
            const runner = new CommandRunner({ slackId: "cmd-user" }, repository, config)

            if (command.name === "check") {
                const result = await runner.runMiteCommand(command)
                console.log(`Finished running command ${command.name}`)

                const message = "Your time entries for the following dates are missing or contain 0 minutes:\n"
                    + result.map(date => `https://leanovate.mite.yo.lk/#${date.format("YYYY/MM/DD")}`)
                        .join("\n")
                console.log(message)
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
