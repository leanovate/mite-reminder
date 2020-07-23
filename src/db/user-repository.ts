import fs from "fs/promises"
import { taskEither } from "fp-ts"
import { TaskEither } from "fp-ts/lib/TaskEither"
import { UnknownAppError, AppError } from "../app/errors"

export type User = Partial<UserWithMiteId & UserWithMiteApiKey>

type UserWithMiteId = { miteId: number }
type UserWithMiteApiKey = { miteApiKey: string }

export type DB = { [slackId: string]: User }
export type Users = Array<User & { slackId: string }>

export class Repository {
    constructor(private readonly db: DB, private readonly path: string) { }

    registerUserWithMiteApiKey(slackId: string, miteApiKey: string): TaskEither<AppError, void> {
        this.db[slackId] = { miteApiKey }
        return this.updateDatabase()
    }

    registerUserWithMiteId(slackId: string, miteId: number): TaskEither<AppError, void> {
        this.db[slackId] = { miteId }
        return this.updateDatabase()
    }

    async unregisterUser(slackId: string): Promise<void> {

        if (!this.db[slackId]) {
            console.log(`User with slackId ${slackId} is unknown, hence cannot be unregistered.`)
            return
        }

        delete this.db[slackId]
        
        await this.updateDatabase()()
    }

    loadUser(slackId: string): User | null {
        const user = this.db[slackId] || null
        if (user && !user.miteApiKey && !user.miteId) {
            console.warn(`User [${slackId}] is in an invalid state. Neither miteId nor miteApiKey is present. Telling user to re-register to fix the issue.`)
            return null
        }

        return user
    }

    loadAllUsers(): Users {
        return Object.keys(this.db)
            .map(key => ({ slackId: key, ...this.db[key] }))
    }

    private updateDatabase(): TaskEither<AppError, void> {
        return taskEither.tryCatch(
            () => fs.writeFile(this.path, JSON.stringify(this.db), { encoding: "utf-8" }),
            e => new UnknownAppError(e as Error)
        )
    }
}
