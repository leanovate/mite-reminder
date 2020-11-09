import { taskEither as Te, array as A } from "fp-ts"
import { fromNullable, Option } from "fp-ts/lib/Option"
import { pipe } from "fp-ts/lib/pipeable"
import { TaskEither } from "fp-ts/lib/TaskEither"
import miteApi, { GetProjectsOptions, GetServicesOptions, MiteApi, Project, Service, TimeEntries, TimeEntry } from "mite-api"
import { Moment } from "moment"
import { AppError, UnknownAppError } from "../app/errors"

export const createMiteApi: (apiKey: string, miteAccountName: string) => MiteApi = (apiKey, miteAccountName) => miteApi({
    account: miteAccountName,
    apiKey: apiKey,
    applicationName: `${miteAccountName}-mite-reminder`
})

export function getTimeEntries(mite: MiteApi, userId: number | "current", from: Moment, to: Moment): TaskEither<AppError, TimeEntries> {
    const params = {
        from: from.format("YYYY-MM-DD"),
        to: to.format("YYYY-MM-DD"),
        user_id: userId
    }

    return pipe(
        Te.taskify(mite.getTimeEntries)(params),
        Te.mapLeft(error => new UnknownAppError(error))
    )
}

export function getProjects(mite: MiteApi, options: GetProjectsOptions): TaskEither<AppError, Project[]> {
    return pipe(
        Te.taskify(mite.getProjects)(options),
        Te.map(A.map(entry => entry.project)),
        Te.mapLeft(error => new UnknownAppError(error))
    )
}
export function getServices(mite: MiteApi, options: GetServicesOptions): TaskEither<AppError, Service[]> {
    return pipe(
        Te.taskify(mite.getServices)(options),
        Te.map(A.map(entry => entry.service)),
        Te.mapLeft(error => new UnknownAppError(error))
    )
}

interface AddTimeEntryOptionsForUser {
    date_at?: string
    minutes?: number
    note?: string
    // requiring user_id so that the current user can only be used if it is explicitly stated
    // the current user will ofter be the one who provided the mite admin key, not the user triggering the action
    user_id: number | "current" 
    project_id?: number
    service_id?: number
    locked?: boolean
}

export function addTimeEntry(mite: MiteApi, timeEntry: AddTimeEntryOptionsForUser): TaskEither<AppError, TimeEntry> {
    return pipe(
        Te.taskify(mite.addTimeEntry)({
            ...timeEntry,
            user_id: timeEntry.user_id === "current" ? undefined : timeEntry.user_id
        }),
        Te.map(entry => entry.time_entry),
        Te.mapLeft(error => new UnknownAppError(error))
    )
}

export const getMiteIdByEmail = (mite: MiteApi, email: string): TaskEither<AppError, Option<number>> => pipe(
    Te.taskify(mite.getUsers)({ email }),
    Te.mapLeft(error => new UnknownAppError(error)),
    Te.map(users => fromNullable(users
        .map(user => user.user)
        .find(user => user.email === email)?.id)
    ))
