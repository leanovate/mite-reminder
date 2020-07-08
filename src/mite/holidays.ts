import { Moment } from "moment"
import Holidays from "date-holidays"

const hd = new Holidays("DE","BE")

export const isHoliday = (moment: Moment): boolean => {
    const holiday = hd.isHoliday(moment.toDate())
    return holiday && holiday.type === "public"
}
