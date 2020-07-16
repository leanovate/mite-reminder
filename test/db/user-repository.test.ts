jest.mock("../../src/config", () => ({}))
jest.mock("fs/promises", () =>  {
    return {
        writeFile: jest.fn()
    }
})

import fs from "fs/promises"
import { Repository } from "../../src/db/user-repository"
import { MiteApi } from "mite-api"

describe("User Repository", () => {

    const miteApiMock = <MiteApi>{}

    afterEach(() => {
        jest.clearAllMocks()
    })

    it("should save information about a user", async () => {
        const testDb = {}
        const slackId = "slack-id"
        const miteApiKey = "mite-api-key"
        const path = "path"
        await new Repository(testDb, path, miteApiMock).registerUser(slackId, miteApiKey)

        expect(fs.writeFile).toBeCalledTimes(1)
        expect(testDb).toEqual({ [slackId]: { miteApiKey } })
        expect(fs.writeFile).toBeCalledWith(path, JSON.stringify(testDb), { encoding: "utf-8" })
    })

    it("should load information about a user", () => {
        const slackId = "slack-id"
        const miteApiKey = "mite-api-key"
        const testDb = {
            [slackId]: { miteApiKey }
        }

        const user =  new Repository(testDb, "path", miteApiMock).loadUser(slackId)
        expect(user?.miteApiKey).toEqual(miteApiKey)
    })

    it("should return null if the user cannot be found", () => {
        const testDb = {}

        const user =  new Repository(testDb, "path", miteApiMock).loadUser("slack-id")
        expect(user).toBeNull()
    })

    it("should remove a user from the storage", async () => {
        const slackId = "slack-id"
        const miteApiKey = "mite-api-key"
        const path = "path"
        const testDb = {
            [slackId]: { miteApiKey }
        }

        await  new Repository(testDb, path, miteApiMock).unregisterUser(slackId)

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

        await  new Repository(testDb, "path", miteApiMock).unregisterUser("unknown-slack-id")
        expect(testDb).toEqual({ [slackId]: { miteApiKey } })
        expect(fs.writeFile).toHaveBeenCalledTimes(0)
    })
})