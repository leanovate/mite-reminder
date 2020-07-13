/* eslint-disable no-case-declarations */ // TODO Remove this line
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
        const user = repository.loadUser(executor.slackId)
        const api = createMiteApi(user?.miteApiKey ?? config.miteApiKey ?? "mite-api-key") // TODO

        return getMissingTimeEntries(
            "current",
            moment().subtract(40, "day"),
            moment(),
            api
        )
    }
}
