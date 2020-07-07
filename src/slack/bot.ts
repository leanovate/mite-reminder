import moment from "moment";
import { getMissingTimeEntries } from "../reminder/reminder";
import config from "../config";

const miteUserId = "current"

const datesWithoutEntries = async (): Promise<string> => {

  const datesWithoutEntires = await getMissingTimeEntries(
    miteUserId,
    moment().subtract(40, "day"),
    moment())

  return "Your time entries for the following dates are missing or contain 0 minutes:\n"
    + datesWithoutEntires.map(date => `https://${config.miteAccountName}.mite.yo.lk/#${date.format("YYYY/MM/DD")}`)
      .join("\n")
}

export {
  datesWithoutEntries
}