import fs from "fs/promises"
import { MiteApi } from "mite-api"
import { getUserByEmail } from "../mite/mite-api-wrapper"

export type User = {
    miteApiKey?: string
}

export type DB = { [slackId: string]: User }
export type Users = Array<User & {slackId: string}>

export class Repository {
    constructor(private readonly db: DB, private readonly path: string, private miteApi: MiteApi) { }

    async registerUser(slackId: string, miteApiKey?: string): Promise<void> {
        this.db[slackId] = { miteApiKey }
        await this.updateDatabase()
    }

    async unregisterUser(slackId: string): Promise<void> {

        if (!this.db[slackId]) {
            console.log(`User with slackId ${slackId} is unknown, hence cannot be unregistered.`)
            return
        }

        delete this.db[slackId]
        await this.updateDatabase()
    }

    loadUser(slackId: string): User | null {
        return this.db[slackId] || null
    } 

    async getMiteId(email: string): Promise<number | null> {
        return (await getUserByEmail(this.miteApi, email))?.id ?? null
    }

    loadAllUsers(): Users  {
        return Object.keys(this.db)
            .map(key => ({ slackId: key, ...this.db[key] }))
    }

    private async updateDatabase(): Promise<void> {
        await fs.writeFile(this.path, JSON.stringify(this.db), {encoding: "utf-8"})
    }
}
