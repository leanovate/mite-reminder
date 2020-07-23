import config from "../config"
import fs from "fs/promises"
import { Repository, DB } from "./user-repository"

export const createRepository = async (): Promise<Repository> => {
    try {
        await fs.writeFile(config.dbPath, "{}", { flag: "wx" })
    } catch {
        //  This is thrown if the file already exists. We do not need to handle that case.
    }

    const db = JSON.parse(await fs.readFile(config.dbPath, { encoding: "utf-8" })) as DB
    return new Repository(db, config.dbPath)
}