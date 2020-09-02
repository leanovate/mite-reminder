const getTimeEntriesMock = jest.fn()
const getMiteIdMock = jest.fn()
jest.mock("../../src/mite/miteApiWrapper", () => ({
    getTimeEntries: getTimeEntriesMock,
    getMiteIdByEmail: getMiteIdMock
}))

import { option, taskEither } from "fp-ts"
import { MiteApi, TimeEntries, TimeEntry } from "mite-api"
import moment from "moment"
import { UserIsUnknown } from "../../src/app/errors"
import { RegisterCommand } from "../../src/commands/commandParser"
import { CheckUsersReport, doCheck, doCheckUsers, doRegister, doUnregister, CheckUserResult } from "../../src/commands/commands"
import { Config } from "../../src/config"
import { Repository } from "../../src/db/userRepository"
import { UserContext } from "../../src/slack/userContext"
import { getLeft, getRight } from "../testUtils"
import { taskEither as T } from "fp-ts"

describe("Commands", () => {
    const loadUserMock = jest.fn()

    const registerUserWithMiteIdMock = jest.fn()
    const registerUserWithMiteApiKeyMock = jest.fn()

    const userRepository: Repository = {
        /* eslint-disable @typescript-eslint/no-empty-function */
        registerUserWithMiteApiKey: registerUserWithMiteApiKeyMock,
        registerUserWithMiteId: registerUserWithMiteIdMock,
        unregisterUser: jest.fn(() => { }),
        loadUser: loadUserMock
        /* eslint-enable @typescript-eslint/no-empty-function */
    } as unknown as Repository

    const miteApiMock = {} as unknown as MiteApi

    const defaultUserContext: UserContext = {
        repository: userRepository,
        config: {
            miteApiKey: "mite-api-key"
        } as unknown as Config,
        miteApi: miteApiMock,
        slackId: "slack-id"
    }
    const createTimeEntries = (numberOfTieEntries: number): TimeEntries => {
        return [...Array(numberOfTieEntries).keys()]
            .map((daysToSubstract) => ({
                time_entry: { date_at: moment().subtract(daysToSubstract + 1, "day").format("YYYY-MM-DD") } as unknown as TimeEntry
            })) as TimeEntries
    }

    afterEach(() => {
        jest.clearAllMocks()
    })

    it("should register a user without api key in the database", async () => {
        const registerCommand: RegisterCommand = { name: "register" }
        const miteId = 4711
        getMiteIdMock.mockReturnValue(taskEither.right(option.of(miteId)))
        registerUserWithMiteIdMock.mockReturnValue(taskEither.right(null))

        await doRegister(registerCommand, defaultUserContext, () => taskEither.right({ email: "test@email.com" }))()

        expect(userRepository.registerUserWithMiteId).toBeCalledTimes(1)
        expect(userRepository.registerUserWithMiteId).toBeCalledWith(defaultUserContext.slackId, miteId)
    })

    it("should register a user with api key in the database", async () => {
        const miteApiKey = "mite-api-key"
        const registerCommand: RegisterCommand = { name: "register", miteApiKey }
        registerUserWithMiteApiKeyMock.mockReturnValue(taskEither.right(null))

        await doRegister(registerCommand, defaultUserContext, () => taskEither.right({ email: "test@email.com" }))()

        expect(userRepository.registerUserWithMiteApiKey).toBeCalledTimes(1)
        expect(userRepository.registerUserWithMiteApiKey).toBeCalledWith(defaultUserContext.slackId, miteApiKey)
    })

    it("should unregister a user", async () => {
        await doUnregister(defaultUserContext)

        expect(userRepository.unregisterUser).toHaveBeenCalledTimes(1)
        expect(userRepository.unregisterUser).toHaveBeenCalledWith(defaultUserContext.slackId)
    })

    it("should detect missing time entries for the current user", async () => {
        getTimeEntriesMock.mockReturnValue([])
        loadUserMock.mockReturnValue({ miteApiKey: "mite-api-key" })

        await doCheck(defaultUserContext)

        expect(userRepository.loadUser).toHaveBeenCalledTimes(1)
        expect(userRepository.loadUser).toHaveBeenCalledWith(defaultUserContext.slackId)
        expect(getTimeEntriesMock).toHaveBeenCalledTimes(1)
        expect(getTimeEntriesMock).toHaveBeenLastCalledWith(miteApiMock, "current", expect.anything(), expect.anything())
    })

    it("should detect missing time entries for a user without a personal api key", async () => {
        const slackId = "slack-id"
        const miteId = "mite-id"

        getTimeEntriesMock.mockReturnValue([])
        loadUserMock.mockReturnValue({ miteId })

        await doCheck(defaultUserContext)

        expect(userRepository.loadUser).toHaveBeenCalledTimes(1)
        expect(userRepository.loadUser).toHaveBeenCalledWith(slackId)
        expect(getTimeEntriesMock).toHaveBeenCalledTimes(1)
        expect(getTimeEntriesMock).toHaveBeenLastCalledWith(miteApiMock, miteId, expect.anything(), expect.anything())
    })

    it("should return an appError if the user has no api key and is unknown", async () => {
        getTimeEntriesMock.mockReturnValue([])
        loadUserMock.mockReturnValue(null)

        const result = await doCheck(defaultUserContext)()

        expect(getLeft(result)).toEqual(new UserIsUnknown(defaultUserContext.slackId))
    })

    it("should show all users are missing times when all users are missing times", async () => {
        getTimeEntriesMock.mockReturnValue(T.right([]))
        loadUserMock.mockReturnValue({ miteApiKey: "mite-api-key" })

        const users: string[] = ["test-user 1", "test-user 2"]

        const usersThatAreMissingTimes: CheckUsersReport = getRight(await doCheckUsers(defaultUserContext, users)())

        expect(usersThatAreMissingTimes).toEqual({
            "test-user 1": CheckUserResult.IS_MISSING_TIMES,
            "test-user 2": CheckUserResult.IS_MISSING_TIMES
        })
    })

    it("should show all users have completed times when all users have completed their entries", async () => {
        getTimeEntriesMock.mockReturnValue(T.right(createTimeEntries(40)))
        loadUserMock.mockImplementation(slackId => ({ miteId: "mite" + slackId }))

        const users: string[] = ["user completed times", "another user with completed times"]
        const reportWIthCompletedTimes: CheckUsersReport = getRight(await doCheckUsers(defaultUserContext, users)())

        expect(reportWIthCompletedTimes).toEqual({
            "user completed times": CheckUserResult.COMPLETED_ALL_ENTRIES,
            "another user with completed times": CheckUserResult.COMPLETED_ALL_ENTRIES
        })
    })

    it("should report users with missing times and users that completed their entries", async () => {
        getTimeEntriesMock.mockReturnValueOnce(T.right(createTimeEntries(40)))
        getTimeEntriesMock.mockReturnValueOnce(T.right([]))
        loadUserMock.mockImplementation(slackId => ({ miteId: "mite" + slackId }))

        const users: string[] = ["user completed times", "user with missing times"]
        const reportWIthCompletedTimes: CheckUsersReport = getRight(await doCheckUsers(defaultUserContext, users)())

        expect(reportWIthCompletedTimes).toEqual({
            "user completed times": CheckUserResult.COMPLETED_ALL_ENTRIES,
            "user with missing times": CheckUserResult.IS_MISSING_TIMES
        })
    })
})