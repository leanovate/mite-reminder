import moment, { Moment } from "moment"
import { Repository } from "../db/user-repository"
import { getMiteId } from "../mite/getMiteId"
import { getMissingTimeEntries } from "../mite/time"
import { isCheckContext, UserContext } from "../slack/userContext"
import { CheckCommand, MiteCommand, RegisterCommand, UnregisterCommand } from "./commandParser"

export type SlackUser = {
    slackId: string
}

export class CommandRunner {
    private readonly repository: Repository
    private readonly slackId: string

    constructor(private readonly context: UserContext) {
        this.repository = context.repository
        this.slackId = context.slackId
    }

    runMiteCommand(c: RegisterCommand): Promise<void>
    runMiteCommand(c: UnregisterCommand): Promise<void>
    runMiteCommand(c: CheckCommand): Promise<Moment[] | Failures>
    runMiteCommand(c: MiteCommand): Promise<void | Moment[] | Failures>
    runMiteCommand(c: MiteCommand): Promise<void | Moment[] | Failures> {
        switch (c.name) {
        case "register":
            return this.repository.registerUser(this.slackId, c.miteApiKey)
        case "unregister":
            return this.repository.unregisterUser(this.slackId)
        case "check":
            return this.doCheck(this.context)
        }
    }

    private async doCheck(context: UserContext): Promise<Moment[] | Failures> {
        if(!isCheckContext(context)) {
            return Failures.ApiKeyIsMissing
        }

        const result = await getMiteId(context)

        if(result === Failures.UserIsUnknown) {
            return result
        }


        return getMissingTimeEntries(
            result,
            moment().subtract(40, "day"),
            moment(),
            context.miteApi
        )
    }
}

export enum Failures {
    ApiKeyIsMissing = "User is known but no app wide admin-api key is specified.",
    UserIsUnknown = "User is unknown and needs to register with his/her own api key."
}

