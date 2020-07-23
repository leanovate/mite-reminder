import { MiteApi, TimeEntry, TimeEntries, User, Users } from "mite-api"
import moment from "moment"
import { createMiteApi, getTimeEntries, getMiteIdByEmail } from "../../src/mite/mite-api-wrapper"
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
        getUsers: () => null
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

            const entries: TimeEntries = await getTimeEntries(mite, "current", moment(), moment())

            expect(entries).toHaveLength(1)
            expect(entries[0].time_entry).toEqual(testEntry)
        })

        it("throws an exception with the error when there is one", async () => {
            const error = { error: "Access denied. Please check your credentials." }
            const mite: MiteApi = {
                ...emptyMock,
                getTimeEntries: (_, callback) => callback(new Error(error.error), error as any) // TODO
            }

            try {
                await getTimeEntries(mite, "current", moment(), moment())
                fail()
            } catch (error) {
                expect(error).toEqual({ error: "Access denied. Please check your credentials." })
            }
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