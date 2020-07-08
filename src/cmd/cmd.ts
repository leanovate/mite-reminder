import readline from "readline"
import { runCommand } from "../commands/commands"
import { parse } from "../commands/commandParser"

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

rl.question("Enter a command ", (answer) => {
  
    const parsedAnswer = parse(answer)
    if (parsedAnswer.status) {
        runCommand(parsedAnswer.value)
    } else {
        console.log("I don't understand")
    }

    rl.close()
})