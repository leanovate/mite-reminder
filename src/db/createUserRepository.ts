import config from "../config"
import fs from "fs/promises"
import { Repository, DB } from "./userRepository"
import { TaskEither } from "fp-ts/lib/TaskEither"
import { pipe } from "fp-ts/lib/function"
import { taskEither, task } from "fp-ts"
import { Task } from "fp-ts/lib/Task"
import { IOError } from "../app/errors"

const createFile: Task<void> = async (): Promise<void> => {
    try {
        await fs.writeFile(config.dbPath, "{}", { flag: "wx" })
    } catch {
        //  This is thrown if the file already exists. We do not need to handle that case.
    }
}

export const createRepository = (): TaskEither<IOError, Repository> => {
    return pipe(
        createFile,
        task.chain(() => taskEither.tryCatch(
            () => fs.readFile(config.dbPath, { encoding: "utf-8" }),
            e => new IOError(e as Error) 
        )),
        taskEither.map(data => new Repository(JSON.parse(data) as DB, config.dbPath))
    )
}

