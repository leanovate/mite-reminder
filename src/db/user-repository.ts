import { FileHandle } from 'fs/promises'

export type User = {
    miteApiKey?: string
}

export type DB = { [slackId: string]: User }

export async function registerUser(db: DB, fileHandle: FileHandle, slackId: string, miteApiKey?: string): Promise<void> {
    db[slackId] = { miteApiKey }
    await updateDatabase(db, fileHandle)
}

export async function unregisterUser(db: DB, fileHandle: FileHandle, slackId: string): Promise<void> {
    if (!db[slackId]) {
        console.log(`User with slackId ${slackId} is unknown, hence cannot be unregistered.`)
        return
    }

    delete db[slackId]
    await updateDatabase(db, fileHandle)
}

export function loadUser(db: DB, slackId: string): User | null {
    return db[slackId] || null
}

function updateDatabase(db: DB, fileHandle: FileHandle): Promise<void> {
    return fileHandle.writeFile(JSON.stringify(db), { encoding: 'utf-8' })
}