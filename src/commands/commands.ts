import { MiteCommand } from "./commandParser"
import { getMissingTimeEntries } from "../reminder/reminder"
import moment, { Moment } from "moment"
import { Repository } from "../db/user-repository"
import { createMiteApi } from "../mite/mite-api-wrapper"
import config from "../config"

export type CommandExecutor = {
    slackId: string
}

export const runMiteCommand = (executor: CommandExecutor, repository: Repository) => (command: MiteCommand): Promise<void | Moment[]> => {

    switch(command.name) {
    case "register":
        return repository.registerUser(executor.slackId, command.miteApiKey)
    case "unregister":
        return repository.unregisterUser(executor.slackId)
    case "check":
        return doCheck(executor, repository)
    }
}

const doCheck = (executor: CommandExecutor, repository: Repository):Promise<Moment[]> => {
    const user = repository.loadUser(executor.slackId)
    const apiKey = user?.miteApiKey ?? config.miteApiKey
    if(!apiKey) {
        throw new Error("Unable to find api key. Please register as a user or provide an admin api key.")
    }

    return getMissingTimeEntries(
        "current",
        moment().subtract(40, "day"),
        moment(),
        createMiteApi(apiKey)
    )
}
