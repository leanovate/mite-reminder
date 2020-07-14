import readline from "readline"
import { runMiteCommand } from "../commands/commands"
import { parse } from "../commands/commandParser"
import { createRepository, Repository } from "../db/user-repository"

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const requestAndRunCommand = async (repository: Repository): Promise<void> => {
    rl.question("Enter a command ", async (answer) => {  
        const parsedAnswer = parse(answer)

        if (parsedAnswer.status) {
            const result = await runMiteCommand({slackId: "cmd-user"}, repository)(parsedAnswer.value)
            console.log(`Finished running command ${parsedAnswer.value.name}. Result: ${JSON.stringify(result, null, 3)}`)
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
