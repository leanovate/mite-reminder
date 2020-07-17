import { MiteCommand, RegisterCommand, UnregisterCommand, CheckCommand } from "./commandParser"
import { getMissingTimeEntries } from "../reminder/reminder"
import moment, { Moment } from "moment"
import { Repository } from "../db/user-repository"
import { createMiteApi } from "../mite/mite-api-wrapper"
import { Config } from "../config"

export type SlackUser = {
    slackId: string
}

export class CommandRunner {
    constructor(private readonly slackUser: SlackUser, private readonly repository: Repository, private readonly config: Config) {
    }

    runMiteCommand(c: RegisterCommand): Promise<void>
    runMiteCommand(c: UnregisterCommand): Promise<void>
    runMiteCommand(c: CheckCommand): Promise<Moment[] | Failures>
    runMiteCommand(c: MiteCommand): Promise<void | Moment[] | Failures>
    runMiteCommand(c: MiteCommand): Promise<void | Moment[] | Failures> {
        switch (c.name) {
            case "register":
                return this.repository.registerUser(this.slackUser.slackId, c.miteApiKey)
            case "unregister":
                return this.repository.unregisterUser(this.slackUser.slackId)
            case "check":
                return this.doCheck(this.slackUser, this.repository)
        }
    }

    private async doCheck(slackUser: SlackUser, repository: Repository): Promise<Moment[] | Failures> {
        const result = getMiteCredentials(repository, slackUser.slackId, this.config)

        switch (result) {
            case Failures.ApiKeyIsMissing:
            case Failures.UserIsUnknown:
                return result
            default:
                return getMissingTimeEntries(
                    result.miteId,
                    moment().subtract(40, "day"),
                    moment(),
                    createMiteApi(result.apiKey),
                )
        }

    }
}

function getMiteCredentials(repository: Repository, slackId: string, config: Config): { apiKey: string, miteId: string } | Failures.ApiKeyIsMissing | Failures.UserIsUnknown {
    let apiKey: string | undefined
    let miteId: string

    const user = repository.loadUser(slackId)

    if (user?.miteApiKey) {
        miteId = "current"
        apiKey = user.miteApiKey
    } else {
        const mId = repository.getMiteId(slackId)
        if (!mId) {
            return Failures.UserIsUnknown
        }
        miteId = mId
        apiKey = config.miteApiKey
    }

    if (!apiKey) {
        return Failures.ApiKeyIsMissing
    }

    return { apiKey, miteId }
}

export enum Failures {
    ApiKeyIsMissing = "User is known but no app wide admin-api key is specified.",
    UserIsUnknown = "User is unknown and needs to register with his/her own api key."
}

