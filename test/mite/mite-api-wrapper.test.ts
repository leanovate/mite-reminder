import { createMiteApi, getTimeEntries, getUser } from "../../src/mite/mite-api-wrapper"
import moment from "moment";
import { TimeEntry, TimeEntries, User, Users } from "../../src/mite/types";
import { MiteApi } from "mite-api";

jest.mock("../../src/config", () => ({}))

describe("createMiteApi", () => {
  it("create a MiteApi that can 'getTimeEntries'", () => {
    const miteApi = createMiteApi("apiKey");

    expect(miteApi.getTimeEntries).not.toBeUndefined;
  })
})
describe("miteApi", () => {
  const emptyMock: MiteApi = {
    getTimeEntries: () => null,
    getUser: () => null
  }

  describe("getTimeEntries", () => {
    it("returns a promise with the result", async () => {
      const testEntry: TimeEntry = <any>{
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

  describe("getUser", () => {
    it("returns a promise with the result", async () => {
      const testEntry: User = <any>{
        name: "name",
        email: "email"
      }
      const mite: MiteApi = {
        ...emptyMock,
        getUser: (_, callback) => callback(null, [{ user: testEntry }])
      }

      const entries: Users = await getUser(mite, "userId")

      expect(entries).toHaveLength(1)
      expect(entries[0].user).toEqual(testEntry)
    })

    it("throws an exception with the error when there is one", async () => {
      const error = { error: "Access denied. Please check your credentials." }
      const mite: MiteApi = {
        ...emptyMock,
        getUser: (_, callback) => callback(new Error(), error)
      }

      try {
        await getUser(mite, "userId")
        fail()
      } catch (error) {
        expect(error).toEqual({ error: "Access denied. Please check your credentials." })
      }
    })
  })
})