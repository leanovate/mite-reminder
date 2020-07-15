import fs from "fs/promises"

export type User = {
    miteApiKey?: string
}

export type DB = { [slackId: string]: User }

export class Repository {
    constructor(private readonly db: DB, private readonly path: string) { }

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

    getMiteId(slackId: string): string | null {
        console.warn("************************************************************")
        console.warn("getMiteId is currently mocked and will always return 'null'.")
        console.warn("************************************************************")
        return null
    }

    private async updateDatabase(): Promise<void> {
        await fs.writeFile(this.path, JSON.stringify(this.db), {encoding: "utf-8"})
    }
}
