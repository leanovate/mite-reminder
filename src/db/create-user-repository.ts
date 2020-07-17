import config from "../config"
import fs from "fs/promises"
import { Repository, DB } from "./user-repository"
import { MiteApi } from "mite-api"

export const createRepository = async (): Promise<Repository> => {
    try {
        await fs.writeFile(config.dbPath, "{}", {flag: "wx"})
    } catch {
        //  This is thrown if the file already exists. We do not need to handle that case.
    }

    const db = JSON.parse(await fs.readFile(config.dbPath, { encoding: "utf-8" })) as DB
    return new Repository(db, config.dbPath, null as any as MiteApi) // FIXME: make miteApi a non-requirement
}