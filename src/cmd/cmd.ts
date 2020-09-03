import { either, taskEither } from "fp-ts"
import { Either } from "fp-ts/lib/Either"
import { pipe } from "fp-ts/lib/function"
import { fold } from "fp-ts/lib/TaskEither"
import { Moment } from "moment"
import readline from "readline"
import { AppError, UserIsUnknown } from "../app/errors"
import { parse } from "../commands/commandParser"
import { doCheck, doRegister, doUnregister } from "../commands/commands"
import config from "../config"
import { createRepository } from "../db/createUserRepository"
import { Repository } from "../db/userRepository"
import { createUserContextFromSlackId } from "../slack/createUserContext"

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const displayRegisterResult = either.fold(e => { throw e }, () => { console.log("Success!") })


const requestAndRunCommand = async (repository: Repository): Promise<void> => {
    rl.question("Enter a command ", async (answer) => {
        const parsedAnswer = parse(answer)

        if (parsedAnswer.status) {
            const context = createUserContextFromSlackId(repository, "cmd-user")
            const command = parsedAnswer.value

            switch (command.name) {
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
                break
            case "check channel":
                /*
                you could test functionality if you provide an existing mite account here:
                const displayCheckUsersResults = either.fold(e => { throw e }, (report) => { console.log("report", report) })
                const restrictedUserContext = createRestrictedUserContext(repository, "cmd-user")
                await doCheckUsers(restrictedUserContext, ["cmd-user"], () => taskEither.right({ email: "some.email.address@leanovate.de" }))()
                    .then(displayCheckUsersResults)
                */
                console.log("sorry, but that's not possible here")
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
        either.fold(e => { throw e }, timeEntries => {
            const message = timeEntries.length > 0
                ? "Your time entries for the following dates are missing or contain 0 minutes:\n"
                + timeEntries.map(date => `https://${config.miteAccountName}.mite.yo.lk/#${date.format("YYYY/MM/DD")}`)
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
