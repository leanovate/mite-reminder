import { either, taskEither } from "fp-ts"
import { Either } from "fp-ts/lib/Either"
import { pipe } from "fp-ts/lib/function"
import { Moment } from "moment"
import readline from "readline"
import { AppError, UserIsUnknown } from "../app/errors"
import { parse } from "../commands/commandParser"
import { doCheck, doRegister, doUnregister } from "../commands/commands"
import { createRepository } from "../db/create-user-repository"
import { Repository } from "../db/user-repository"
import { createUserContext } from "../slack/createUserContext"
import { fold } from "fp-ts/lib/TaskEither"

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const displayRegisterResult = either.fold(e => {throw e}, () => {console.log("Success!")})

const requestAndRunCommand = async (repository: Repository): Promise<void> => {
    rl.question("Enter a command ", async (answer) => {
        const parsedAnswer = parse(answer)

        if (parsedAnswer.status) {
            const context = createUserContext(repository, "cmd-user")
            const command = parsedAnswer.value

            switch(command.name) {
            case "check":
                await doCheck(context)()
                    .then(displayCheckResult)
                break
            case "register":
                await doRegister(command, context, () => taskEither.left(new UserIsUnknown("cmd-user")))()
                    .then(displayRegisterResult)
                break
            case "unregister":
                await doUnregister(context)()
                    .then(displayUnregisterResult)
            }
        } else {
            console.log("I don't understand")
            throw new Error("Unknown command")
        }

        rl.close()
    })
}

function displayCheckResult(result: Either<AppError, Moment[]>) {
    pipe(
        result,
        either.fold(e => {throw e}, timeEntries => {
            const message = timeEntries.length > 0
                ? "Your time entries for the following dates are missing or contain 0 minutes:\n"
                + timeEntries.map(date => `https://leanovate.mite.yo.lk/#${date.format("YYYY/MM/DD")}`)
                    .join("\n")
                : "You completed all your time entries."
            console.log(message)
        })
    )
}

function displayUnregisterResult() {
    console.log("Success!")   
}

pipe(
    createRepository(),
    fold(
        e => async () => console.error("Unable to start the application:", e),
        repository => () => requestAndRunCommand(repository)
    )
)()
