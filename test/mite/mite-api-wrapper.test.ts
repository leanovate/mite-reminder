import { MiteApi, TimeEntry, TimeEntries, User } from "mite-api"
import moment from "moment"
import { createMiteApi, getTimeEntries, getMiteIdByEmail } from "../../src/mite/mite-api-wrapper"

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
                minutes: 30,
            }

            const mite: MiteApi = {
                ...emptyMock,
                getTimeEntries: (_, callback) => callback(null, [{ time_entry: testEntry }])
            }

            const entries: TimeEntries = await getTimeEntries(mite, "current", moment(), moment())

            expect(entries).toHaveLength(1)
            expect(entries[0].time_entry).toEqual(testEntry)
        })

        it("throws an exception with the error when there is one", async () => {
            const error = { error: "Access denied. Please check your credentials." }
            const mite: MiteApi = {
                ...emptyMock,
                getTimeEntries: (_, callback) => callback(new Error(), error)
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
        it("returns a promise with the result", async () => {
            const testEntry: User = <User>{
                id: 12,
                name: "name",
                email: "email@provider.com"
            }
            const mite: MiteApi = {
                ...emptyMock,
                getUsers: (_, callback) => callback(null, [{ user: testEntry }])
            }

            const id = await getMiteIdByEmail(mite, "email@provider.com")

            expect(id).toEqual(testEntry.id)
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
                getUsers: (_, callback) => callback(null, testEntries.map(user => ({ user })))
            }

            const id = await getMiteIdByEmail(mite, emailToFind)

            expect(id).not.toBeNull()
            expect(id).toEqual(expectedId)
        })

        it("throws an exception with the error when there is one", async () => {
            const error = { error: "Access denied. Please check your credentials." }
            const mite: MiteApi = {
                ...emptyMock,
                getUsers: (_, callback) => callback(new Error(), error)
            }

            try {
                await getMiteIdByEmail(mite, "email")
                fail()
            } catch (error) {
                expect(error).toEqual({ error: "Access denied. Please check your credentials." })
            }
        })
    })
})