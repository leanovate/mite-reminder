import { MiteApi, TimeEntry, TimeEntries, User, Users } from "mite-api"
import moment from "moment"
import { createMiteApi, getTimeEntries, getMiteIdByEmail, addTimeEntry } from "../../src/mite/miteApiWrapper"
import { getRight, getValue, getLeft } from "../testUtils"
import { UnknownAppError } from "../../src/app/errors"

jest.mock("../../src/config", () => ({}))

describe("createMiteApi", () => {
    it("create a MiteApi that can 'getTimeEntries'", () => {
        const miteApi = createMiteApi("apiKey", "test")

        expect(miteApi.getTimeEntries).not.toBeUndefined
    })
})
describe("miteApi", () => {
    const emptyMock: MiteApi = {
        getTimeEntries: () => null,
        getUsers: () => null,
        addTimeEntry: () => null
    }

    describe("getTimeEntries", () => {
        it("returns a promise with the result", async () => {
            const testEntry: TimeEntry = <TimeEntry>{
                id: 1234,
                minutes: 30
            }

            const mite: MiteApi = {
                ...emptyMock,
                getTimeEntries: (_, callback) => callback(undefined, [{ time_entry: testEntry }])
            }

            const maybeEntries = await getTimeEntries(mite, "current", moment(), moment())()
            const entries = getRight(maybeEntries)

            expect(entries).toHaveLength(1)
            expect(entries[0].time_entry).toEqual(testEntry)
        })

        it("return an appError with the error when there is one", async () => {
            const error = new Error("Access denied. Please check your credentials.")
            const mite: MiteApi = {
                ...emptyMock,
                getTimeEntries: (_, callback) => callback(error, null as unknown as TimeEntries)
            }

            const result = await getTimeEntries(mite, "current", moment(), moment())()
            expect(getLeft(result)).toEqual(new UnknownAppError(error))
        })
    })

    describe("addTimeEntry", () => {
        it("returns a promise with the newly created time entry", async () => {
            const testEntry: TimeEntry = <TimeEntry>{
                id: 1234,
                minutes: 30
            }

            const mite: MiteApi = {
                ...emptyMock,
                addTimeEntry: (_, callback) => callback(undefined, { time_entry: testEntry })
            }

            const maybeEntry = await addTimeEntry(mite, { user_id: 333 })()
            const entry = getRight(maybeEntry)

            expect(entry).toEqual(testEntry)
        })

        it("return an appError with the error when there is one", async () => {
            const error = new Error("Access denied. Please check your credentials.")
            const mite: MiteApi = {
                ...emptyMock,
                addTimeEntry: (_, callback) => callback(error, null as unknown as { time_entry: TimeEntry})
            }

            const result = await addTimeEntry(mite, {})()
            expect(getLeft(result)).toEqual(new UnknownAppError(error))
        })
    })

    describe("getMiteIdByEmail", () => {
        it("returns a TaskEither with the result", async () => {
            const testEntry: User = <User>{
                id: 12,
                name: "name",
                email: "email@provider.com"
            }
            const mite: MiteApi = {
                ...emptyMock,
                getUsers: (_, callback) => callback(undefined, [{ user: testEntry }])
            }

            const either = await getMiteIdByEmail(mite, "email@provider.com")()

            expect(getValue(getRight(either))).toEqual(testEntry.id)
        })

        it("it only returns user with an exact email match", async () => {
            const emailToFind = "email@test.co"
            const expectedId = 1
            const testEntries: User[] = <User[]>[{
                id: expectedId,
                name: "match me",
                email: emailToFind
            }, {
                id: 2,
                name: "don't match me",
                email: "email@test.com"
            }
            ]
            const mite: MiteApi = {
                ...emptyMock,
                getUsers: (_, callback) => callback(undefined, testEntries.map(user => ({ user })))
            }

            const result = await getMiteIdByEmail(mite, emailToFind)()

            expect(getValue(getRight(result))).toEqual(expectedId)
        })

        it("returns an error when there is one", async () => {
            const errorFromMiteApi = new Error("Access denied. Please check your credentials.")
            const mite: MiteApi = {
                ...emptyMock,
                getUsers: (_, callback) => callback(errorFromMiteApi, null as unknown as Users)
            }

            const result = await getMiteIdByEmail(mite, "email")()
            expect(getLeft(result)).toEqual(new UnknownAppError(errorFromMiteApi))
        })
    })
})