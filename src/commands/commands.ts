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
    constructor(private readonly slackUser: SlackUser, private readonly  repository: Repository, private readonly config: Config) {
    }

    runMiteCommand(c: RegisterCommand): Promise<void>
    runMiteCommand(c: UnregisterCommand): Promise<void>
    runMiteCommand(c: CheckCommand): Promise<Moment[]>
    runMiteCommand(c: MiteCommand): Promise<void | Moment[]>
    runMiteCommand(c: MiteCommand): Promise<void | Moment[]> {
        switch (c.name) {
        case "register":
            return this.repository.registerUser(this.slackUser.slackId, c.miteApiKey)
        case "unregister":
            return this.repository.unregisterUser(this.slackUser.slackId)
        case "check":
            return this.doCheck(this.slackUser, this.repository)
        }
    }

    private doCheck(slackUser: SlackUser, repository: Repository): Promise<Moment[]> {
        const user = repository.loadUser(slackUser.slackId)

        let apiKey: string | undefined
        let miteId: string

        if(user?.miteApiKey) {
            miteId = "current"
            apiKey = user.miteApiKey
        } else {
            const mId = repository.getMiteId(slackUser.slackId)
            if(!mId) {
                throw new Error("User is unknown and needs to register with his/her own api key.")
            }
            miteId = mId
            apiKey = this.config.miteApiKey
        }

        if (!apiKey) {
            throw new Error("Unable to find api key. Please register as a user or provide an admin api key.")
        }

        return getMissingTimeEntries(
            miteId,
            moment().subtract(40, "day"),
            moment(),
            createMiteApi(apiKey),
        )
    }
}
