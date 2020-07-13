import readline from "readline"
import { runMiteCommand } from "../commands/commands"
import { parse } from "../commands/commandParser"
import { createRepository, Repository } from "../db/user-repository"

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const requestAndRunCommand = async (repository: Repository) => new Promise((resolve, reject) => {
    rl.question("Enter a command ", async (answer) => {  
        const parsedAnswer = parse(answer)

        if (parsedAnswer.status) {
            await runMiteCommand({slackId: "cmd-user"}, repository)(parsedAnswer.value)
        } else {
            console.log("I don't understand")
            reject("Unknown command")
        }

        rl.close()
        resolve()
    })
})

createRepository()
    .then(repository => requestAndRunCommand(repository))
    .catch(e => console.log("Unable to run command:", e))
