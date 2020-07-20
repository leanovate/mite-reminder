import { MiteCommand, RegisterCommand, UnregisterCommand, CheckCommand } from "./commandParser"
import moment, { Moment } from "moment"
import { Repository } from "../db/user-repository"
import { UserContext } from "../slack/events"
import { MiteApi } from "mite-api"
import { getMissingTimeEntries } from "../mite/time"

export type SlackUser = {
    slackId: string
}

export class CommandRunner {
    private readonly repository: Repository
    private readonly slackId: string
    private readonly miteApi: MiteApi

    constructor(private readonly context: UserContext) {
        this.repository = context.repository
        this.slackId = context.slackId
        this.miteApi = context.miteApi
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
        const result = await getMiteId(context)

        if(result === Failures.UserIsUnknown) {
            return result
        }

        return getMissingTimeEntries(
            result,
            moment().subtract(40, "day"),
            moment(),
            this.miteApi,
        )
    }
}

//TODO move to different file
export async function getMiteId(context: UserContext): Promise<number | "current" | Failures.UserIsUnknown> {
    let miteId: number | "current"

    const user = context.repository.loadUser(context.slackId)

    if (user?.miteApiKey) {
        miteId = "current"
    } else {
        const mId = await context.repository.getMiteId(context.slackId)
        if (!mId) {
            return Failures.UserIsUnknown
        }
        miteId = mId
    }

    return miteId
}

export enum Failures {
    ApiKeyIsMissing = "User is known but no app wide admin-api key is specified.",
    UserIsUnknown = "User is unknown and needs to register with his/her own api key."
}

