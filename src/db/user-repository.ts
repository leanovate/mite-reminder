import fs from "fs/promises"
import config from "../config"

export type User = {
    miteApiKey?: string
}

export type DB = { [slackId: string]: User }

export const createRepository = async (): Promise<Repository> => {
    try {
        await fs.writeFile(config.dbPath, "{}", {flag: "wx"})
    } catch {
        //  This is thrown if the file already exists. We do not need to handle that case.
    }

    const db = JSON.parse(await fs.readFile(config.dbPath, { encoding: "utf-8" })) as DB
    return new Repository(db, config.dbPath)
}

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

    private async updateDatabase(): Promise<void> {
        await fs.writeFile(this.path, JSON.stringify(this.db), {encoding: "utf-8"})
    }
}
