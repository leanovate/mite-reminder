import { taskEither } from "fp-ts"
import { TaskEither } from "fp-ts/lib/TaskEither"
import fs from "fs/promises"
import { AppError, IOError } from "../app/errors"

type UserWithMiteId = { miteId: number }
type UserWithMiteApiKey = { miteApiKey: string }
type DBUser = Partial<UserWithMiteId & UserWithMiteApiKey> 

export type User = DBUser & {slackId: string}
export type DB = { [slackId: string]: DBUser }

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

    unregisterUser(slackId: string): TaskEither<IOError, void> {
        if (!this.db[slackId]) {
            console.log(`User with slackId ${slackId} is unknown, hence cannot be unregistered.`)
            return taskEither.right(undefined)
        }

        delete this.db[slackId]
        
        return this.updateDatabase()
    }

    loadUser(slackId: string): User | null {
        const user = this.db[slackId]

        if(!user) {
            return null
        }

        if (!user.miteApiKey && !user.miteId) {
            console.warn(`User [${slackId}] is in an invalid state. Neither miteId nor miteApiKey is present. Telling user to re-register to fix the issue.`)
            return null
        }

        return { ...user, slackId }
    }

    loadAllUsers(): User[] {
        return Object.keys(this.db)
            .map(key => ({ slackId: key, ...this.db[key] }))
    }

    private updateDatabase(): TaskEither<IOError, void> {
        return taskEither.tryCatch(
            () => fs.writeFile(this.path, JSON.stringify(this.db), { encoding: "utf-8" }),
            e => new IOError(e as Error)
        )
    }
}
