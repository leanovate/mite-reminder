import { FileHandle } from "fs/promises"
import { Repository } from "../../src/db/user-repository"

jest.mock("../../src/config", () => ({}))

describe("User Repository", () => {
    const fileHandleMock = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        writeFile: jest.fn(() => { })
    } as unknown as FileHandle

    afterEach(() => {
        jest.clearAllMocks()
    })

    it("should save information about a user", async () => {
        const testDb = {}
        const slackId = "slack-id"
        const miteApiKey = "mite-api-key"
        await new Repository(testDb, fileHandleMock).registerUser(slackId, miteApiKey)

        expect(fileHandleMock.writeFile).toBeCalledTimes(1)
        expect(testDb).toEqual({ [slackId]: { miteApiKey } })
        expect(fileHandleMock.writeFile).toBeCalledWith(JSON.stringify(testDb), { encoding: "utf-8" })
    })

    it("should load information about a user", () => {
        const slackId = "slack-id"
        const miteApiKey = "mite-api-key"
        const testDb = {
            [slackId]: { miteApiKey }
        }

        const user =  new Repository(testDb, fileHandleMock).loadUser(slackId)
        expect(user?.miteApiKey).toEqual(miteApiKey)
    })

    it("should return null if the user cannot be found", () => {
        const testDb = {}

        const user =  new Repository(testDb, fileHandleMock).loadUser("slack-id")
        expect(user).toBeNull()
    })

    it("should remove a user from the storage", async () => {
        const slackId = "slack-id"
        const miteApiKey = "mite-api-key"
        const testDb = {
            [slackId]: { miteApiKey }
        }

        await  new Repository(testDb, fileHandleMock).unregisterUser(slackId)

        expect(testDb).toEqual({})
        expect(fileHandleMock.writeFile).toHaveBeenCalledTimes(1)
        expect(fileHandleMock.writeFile).toBeCalledWith(JSON.stringify(testDb), { encoding: "utf-8" })
    })

    it("should do nothing when user to be unregistered cannot be found", async () => {
        const slackId = "slack-id"
        const miteApiKey = "mite-api-key"
        const testDb = {
            [slackId]: { miteApiKey }
        }

        await  new Repository(testDb, fileHandleMock).unregisterUser("unknown-slack-id")
        expect(testDb).toEqual({ [slackId]: { miteApiKey } })
        expect(fileHandleMock.writeFile).toHaveBeenCalledTimes(0)
    })
})