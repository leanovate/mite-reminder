import { array as A, either, taskEither as Te } from "fp-ts"
import { sequenceT } from "fp-ts/lib/Apply"
import { rights } from "fp-ts/lib/Array"
import { Either } from "fp-ts/lib/Either"
import { isSome } from "fp-ts/lib/Option"
import { pipe } from "fp-ts/lib/pipeable"
import { taskEither, TaskEither } from "fp-ts/lib/TaskEither"
import { Auth, calendar_v3, GoogleApis } from "googleapis"
import { AddTimeEntryOptions, TimeEntries, TimeEntry } from "mite-api"
import moment, { Moment } from "moment"
import { AppError, GoogleApiAuthenticationError, UnknownAppError } from "../app/errors"
import { Config } from "../config"
import { makeCheckContext } from "../mite/makeCheckContext"
import { addTimeEntry, getTimeEntries } from "../mite/miteApiWrapper"
import { lastWeekThursdayToThursday } from "../mite/time"
import { UserContext } from "../slack/userContext"

export function addCalendarEntriesToMite(context: UserContext, googleApi: GoogleApis, userEmail: string, now: Moment): TaskEither<AppError, TimeEntry[]> {
    const checkContext = Te.fromEither(makeCheckContext(context))

    const { start, end } = lastWeekThursdayToThursday(now)

    const getEvents = (auth: Auth.OAuth2Client) => Te.tryCatch(
        () => googleApi.calendar("v3").events.list({
            auth,
            calendarId: userEmail,
            timeMin: start.toISOString(),
            timeMax: end.toISOString(),
            orderBy: "startTime",
            singleEvents: true
        }),
        error => new UnknownAppError(error))

    const miteEntriesLastWeek = pipe(checkContext,
        Te.chain(context => getTimeEntries(context.miteApi, context.miteUserId, start, end)),
    )

    return pipe(
        getAuthorization(googleApi, context.config, userEmail),
        Te.chain(getEvents),
        Te.map(response => response.data),
        Te.map(toMiteEntries),
        entriesToAdd => sequenceT(taskEither)(miteEntriesLastWeek, entriesToAdd),
        Te.map(([lastMiteEntries, entriesToAdd]) => pipe(
            entriesToAdd,
            A.filter(entry => !containsMiteEntry(entry, lastMiteEntries))
        )),
        Te.chain(entries => pipe(
            entries,
            A.map(entry => pipe(
                checkContext,
                Te.chain(
                    context => addTimeEntry(context.miteApi, {
                        ...entry,
                        user_id: context.miteUserId
                    }))
            )),
            A.sequence(taskEither) // returns error when one of the tasks returns an error
        ))
    )
}

export function containsMiteEntry(toContain: AddTimeEntryOptions, list: TimeEntries): boolean {
    return pipe(
        list,
        A.map(entry => entry.time_entry),
        A.findFirst(entry =>
            entry.date_at === toContain.date_at
            && entry.note === toContain.note
            && entry.project_id === toContain.project_id
            && entry.service_id === toContain.service_id
        ),
        isSome
    )
}

function toMiteEntries(calendarEvents: calendar_v3.Schema$Events): AddTimeEntryOptions[] {
    return pipe(
        calendarEvents.items ?? [],
        A.map(toMiteEntry),
        rights
    )
}

type EventConvertableToMiteEntry = calendar_v3.Schema$Event & {
    summary: string,
    description: string,
    start: SingleDayEventDateTime,
    end: SingleDayEventDateTime,
}
type SingleDayEventDateTime = calendar_v3.Schema$EventDateTime & {
    dateTime: string
}
function validateEvent(event: calendar_v3.Schema$Event): Either<MiteEntryFailure, EventConvertableToMiteEntry> {
    if (!event?.start || !event?.end) {
        console.warn("Received event without start or and date. Will ignore it and not sync to mite.", event)
        return either.left("start/end are missing")
    }
    if (!event.summary) {
        return either.left("summary is missing")
    }
    if (!event.start.dateTime || !event.end.dateTime) {
        return either.left("all-day-event")
    }
    if (!event.description) {
        return either.left("no #mite event")
    }
    return either.right(event as EventConvertableToMiteEntry)
}

export function toMiteEntry(event: calendar_v3.Schema$Event): Either<MiteEntryFailure, AddTimeEntryOptions> {
    return pipe(
        validateEvent(event),
        either.chain(event => pipe(
            findMiteInformation(event.description),
            either.map(info => ({
                date_at: parseDayFrom(event.start.dateTime),
                project_id: info.projectId,
                service_id: info.serviceId,
                minutes: getDurationInMinutes(event.start, event.end),
                note: event.summary
            }))
        ))
    )
}

function findMiteInformation(description: string): Either<MiteEntryFailure, { projectId: number, serviceId: number }> {
    const regex = /#mite\s+(\d+)\/(\d+)/
    const regexResult = regex.exec(description)

    if (regexResult !== null && regexResult.length >= 3) {
        return either.right({
            projectId: Number.parseInt(regexResult[1]),
            serviceId: Number.parseInt(regexResult[2])
        })
    }
    return either.left("no #mite event")
}

function getDurationInMinutes(startTime: SingleDayEventDateTime, endTime: SingleDayEventDateTime) {
    const start = moment.utc(startTime.dateTime)
    const end = moment.utc(endTime.dateTime)

    return end.diff(start, "minutes")
}

function parseDayFrom(dateTime: string): string {
    return moment.utc(dateTime).format("YYYY-MM-DD")
}

function getAuthorization(googleApi: GoogleApis, config: Config, userEmail: string): TaskEither<GoogleApiAuthenticationError, Auth.JWT> {
    const auth = new googleApi.auth.JWT(
        undefined,
        config.googleSecretsPath,
        undefined,
        ["https://www.googleapis.com/auth/calendar.readonly"],
        userEmail, // subject to impersonate
    )

    return pipe(
        Te.tryCatch(
            () => auth.authorize(), // Cannot be written without the lambda. Without the lambda, a 'this' binding will fail in 'google-auth-library/build/src/auth/jwtclient.js:135:25'
            error => new GoogleApiAuthenticationError(error)
        ),
        Te.map(() => auth)
    )
}

type MiteEntryFailure = "no #mite event" | "all-day-event" | "start/end are missing" | "summary is missing"
