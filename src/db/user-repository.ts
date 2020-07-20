import fs from "fs/promises"

export type User = Partial<UserWithMiteId & UserWithMiteApiKey>

type UserWithMiteId = { miteId: number }
type UserWithMiteApiKey = { miteApiKey: string }

export type DB = { [slackId: string]: User }
export type Users = Array<User & {slackId: string}>

export class Repository {
    constructor(private readonly db: DB, private readonly path: string) { }

    async registerUserWithMiteApiKey(slackId: string, miteApiKey: string): Promise<void> {
        this.db[slackId] = { miteApiKey }
        await this.updateDatabase()
    }

    async registerUserWithMiteId(slackId: string, miteId: number) : Promise<void> {
        this.db[slackId] = { miteId }
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

    loadAllUsers(): Users  {
        return Object.keys(this.db)
            .map(key => ({ slackId: key, ...this.db[key] }))
    }

    private async updateDatabase(): Promise<void> {
        await fs.writeFile(this.path, JSON.stringify(this.db), {encoding: "utf-8"})
    }
}
