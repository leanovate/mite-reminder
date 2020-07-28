jest.mock("../../src/config", () => ({}))
jest.mock("fs/promises", () => {
    return {
        writeFile: jest.fn( () => Promise.resolve({}))
    }
})

import fs from "fs/promises"
import { Repository } from "../../src/db/userRepository"

describe("User Repository", () => {

    afterEach(() => {
        jest.clearAllMocks()
    })

    it("should save mite api key along with a user", async () => {
        const testDb = {}
        const slackId = "slack-id"
        const miteApiKey = "mite-api-key"
        const path = "path"
        await new Repository(testDb, path).registerUserWithMiteApiKey(slackId, miteApiKey)()

        expect(fs.writeFile).toBeCalledTimes(1)
        expect(testDb).toEqual({ [slackId]: { miteApiKey } })
        expect(fs.writeFile).toBeCalledWith(path, JSON.stringify(testDb), { encoding: "utf-8" })
    })

    it("should save mite id along with a user", async () => {
        const testDb = {}
        const slackId = "slack-id"
        const miteId = 12
        const path = "path"
        
        await new Repository(testDb, path).registerUserWithMiteId(slackId, miteId)()

        expect(fs.writeFile).toBeCalledTimes(1)
        expect(testDb).toEqual({ [slackId]: { miteId } })
        expect(fs.writeFile).toBeCalledWith(path, JSON.stringify(testDb), { encoding: "utf-8" })
    })

    it("should load information about a user", () => {
        const slackId = "slack-id"
        const miteApiKey = "mite-api-key"
        const testDb = {
            [slackId]: { miteApiKey }
        }

        const user = new Repository(testDb, "path").loadUser(slackId)
        expect(user?.miteApiKey).toEqual(miteApiKey)
    })

    it("should return null if the user cannot be found", () => {
        const testDb = {}

        const user = new Repository(testDb, "path").loadUser("slack-id")
        expect(user).toBeNull()
    })

    it("should remove a user from the storage", async () => {
        const slackId = "slack-id"
        const miteApiKey = "mite-api-key"
        const path = "path"
        const testDb = {
            [slackId]: { miteApiKey }
        }

        await new Repository(testDb, path).unregisterUser(slackId)()

        expect(testDb).toEqual({})
        expect(fs.writeFile).toHaveBeenCalledTimes(1)
        expect(fs.writeFile).toBeCalledWith(path, JSON.stringify(testDb), { encoding: "utf-8" })
    })

    it("should do nothing when user to be unregistered cannot be found", async () => {
        const slackId = "slack-id"
        const miteApiKey = "mite-api-key"
        const testDb = {
            [slackId]: { miteApiKey }
        }

        await new Repository(testDb, "path").unregisterUser("unknown-slack-id")()
        expect(testDb).toEqual({ [slackId]: { miteApiKey } })
        expect(fs.writeFile).toHaveBeenCalledTimes(0)
    })

    it("should return all users", () => {
        const testDb = {
            "slack-id-1": { miteApiKey: "mite-api-key-1" },
            "slack-id-2": {}
        }

        const allUsers = new Repository(testDb, "path").loadAllUsers()
        expect(allUsers).toHaveLength(Object.keys(testDb).length)
        expect(allUsers).toEqual([
            { slackId: "slack-id-1", miteApiKey: "mite-api-key-1" },
            { slackId: "slack-id-2" },
        ])
    })
})