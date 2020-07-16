const miteApiMock = {}
const getTimeEntriesMock = jest.fn()
const mockCreateMiteApi = jest.fn(() => miteApiMock)
jest.mock("../../src/mite/mite-api-wrapper", () => ({
    createMiteApi: mockCreateMiteApi,
    getTimeEntries: getTimeEntriesMock
}))

import { RegisterCommand, UnregisterCommand, CheckCommand } from "../../src/commands/commandParser"
import { CommandRunner } from "../../src/commands/commands"
import { Repository } from "../../src/db/user-repository"
import { Config } from "../../src/config"

describe("Commands", () => {

    const getMiteIdMock = jest.fn()
    const loadUserMock = jest.fn()

    const userRepository: Repository = {
        /* eslint-disable @typescript-eslint/no-empty-function */
        registerUser: jest.fn(() => { }),
        unregisterUser: jest.fn(() => { }),
        loadUser: loadUserMock,
        getMiteId: getMiteIdMock
        /* eslint-enable @typescript-eslint/no-empty-function */
    } as unknown as Repository

    afterEach(() => {
        jest.clearAllMocks()
    })

    it("should register a user without api key in the database", async () => {
        const registerCommand: RegisterCommand = { name: "register" }
        const slackId = "abc"
        const config = {
            miteApiKey: "mite-api-key"
        } as unknown as Config

        await new CommandRunner({ slackId }, userRepository, config as Config).runMiteCommand(registerCommand)

        expect(userRepository.registerUser).toBeCalledTimes(1)
        expect(userRepository.registerUser).toBeCalledWith(slackId, undefined)
    })

    it("should register a user with api key in the database", async () => {
        const slackId = "slack-id"
        const miteApiKey = "mite-api-key"
        const registerCommand: RegisterCommand = { name: "register", miteApiKey }
        const config = {
            miteApiKey: "mite-api-key"
        } as unknown as Config

        await new CommandRunner({ slackId }, userRepository, config).runMiteCommand(registerCommand)

        expect(userRepository.registerUser).toBeCalledTimes(1)
        expect(userRepository.registerUser).toBeCalledWith(slackId, miteApiKey)
    })

    it("should unregister a user", async () => {
        const slackId = "slack-id"
        const unregisterCommand: UnregisterCommand = { name: "unregister" }
        const config = {
            miteApiKey: "mite-api-key"
        } as unknown as Config

        await new CommandRunner({ slackId }, userRepository, config).runMiteCommand(unregisterCommand)

        expect(userRepository.unregisterUser).toHaveBeenCalledTimes(1)
        expect(userRepository.unregisterUser).toHaveBeenCalledWith(slackId)
    })

    it("should detect missing time entries for the current user", async () => {
        const slackId = "slack-id"
        const checkCommand: CheckCommand = { name: "check" }
        const config = {
            miteApiKey: "mite-api-key"
        } as unknown as Config

        getTimeEntriesMock.mockReturnValue([])
        loadUserMock.mockReturnValue({ miteApiKey: "mite-api-key" })

        await new CommandRunner({ slackId }, userRepository, config).runMiteCommand(checkCommand)

        expect(userRepository.loadUser).toHaveBeenCalledTimes(1)
        expect(userRepository.loadUser).toHaveBeenCalledWith(slackId)
        expect(getTimeEntriesMock).toHaveBeenCalledTimes(1)
        expect(getTimeEntriesMock).toHaveBeenLastCalledWith(miteApiMock, "current", expect.anything(), expect.anything())
    })

    it("should users the users personal api key if present instead of the config api key", async () => {
        const slackId = "slack-id"
        const checkCommand: CheckCommand = { name: "check" }
        const config = {
            miteApiKey: "admin-mite-api-key"
        } as unknown as Config

        getTimeEntriesMock.mockReturnValue([])
        loadUserMock.mockReturnValue({ miteApiKey: "personal-mite-api-key" })

        await new CommandRunner({ slackId }, userRepository, config).runMiteCommand(checkCommand)

        expect(getTimeEntriesMock).toHaveBeenCalledTimes(1)
        expect(mockCreateMiteApi).toHaveBeenLastCalledWith("personal-mite-api-key")
        expect(getTimeEntriesMock).toHaveBeenLastCalledWith(miteApiMock, "current", expect.anything(), expect.anything())
    })

    it("should detect missing time entries for a user without a personal api key", async () => {
        const slackId = "slack-id"
        const miteId = "mite-id"
        const checkCommand: CheckCommand = { name: "check" }
        const config = {
            miteApiKey: "mite-api-key"
        } as unknown as Config

        getTimeEntriesMock.mockReturnValue([])
        loadUserMock.mockReturnValue({})
        getMiteIdMock.mockReturnValue(miteId)

        await new CommandRunner({ slackId }, userRepository, config).runMiteCommand(checkCommand)

        expect(userRepository.loadUser).toHaveBeenCalledTimes(1)
        expect(userRepository.loadUser).toHaveBeenCalledWith(slackId)
        expect(getTimeEntriesMock).toHaveBeenCalledTimes(1)
        expect(getTimeEntriesMock).toHaveBeenLastCalledWith(miteApiMock, miteId, expect.anything(), expect.anything())
    })

    it("should throw an error if the user has no api key and is unknown", async () => {
        expect.assertions(1)
        const slackId = "slack-id"
        const checkCommand: CheckCommand = { name: "check" }
        const config = {
            miteApiKey: "mite-api-key"
        } as unknown as Config

        getTimeEntriesMock.mockReturnValue([])
        loadUserMock.mockReturnValue({})
        getMiteIdMock.mockReturnValue(null)

        try {
            await new CommandRunner({ slackId }, userRepository, config).runMiteCommand(checkCommand)
        } catch (e) {
            expect(e).toEqual(new Error("User is unknown and needs to register with his/her own api key."))
        }
    })

    it("should throw an error if no api key is present", async () => {
        expect.assertions(1)
        const config = {} as unknown as Config
        const checkCommand: CheckCommand = { name: "check" }

        loadUserMock.mockReturnValue({})
        getMiteIdMock.mockReturnValue("mite-id")

        try {
            await new CommandRunner({ slackId: "slackId" }, userRepository, config).runMiteCommand(checkCommand)
        } catch (e) {
            expect(e).toEqual(new Error("Unable to find api key. Please register as a user or provide an admin api key."))
        }
    })
})