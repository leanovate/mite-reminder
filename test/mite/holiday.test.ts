import moment from "moment"
import { isHoliday } from "../../src/mite/holidays"

describe("Holiday", () => {

    it("should detect that first of may is a holiday", () => {
        const day = moment({ year: 2020, month: 5, day: 1 })
        expect(isHoliday(day)).toBeTruthy()
    })

    it("should detect that second of may is not a holiday", () => {
        const day = moment({ year: 2020, month: 5, day: 2 })
        expect(isHoliday(day)).toBeFalsy()
    })
})