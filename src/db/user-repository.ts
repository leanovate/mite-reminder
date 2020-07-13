import fs, { FileHandle } from "fs/promises"
import config from "../config"

export type User = {
    miteApiKey?: string
}

export type DB = { [slackId: string]: User }

export const createRepository = async (): Promise<Repository> => {
    const fileHandle = await fs.open(config.dbPath, "rw")
    const db = JSON.parse(await fileHandle.readFile({ encoding: "utf-8" })) as DB

    return new Repository(db, fileHandle)
}

export class Repository {
    constructor(private readonly db: DB, private readonly fileHandle: FileHandle) { }

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

    private updateDatabase(): Promise<void> {
        return this.fileHandle.writeFile(JSON.stringify(this.db), { encoding: "utf-8" })
    }
}
