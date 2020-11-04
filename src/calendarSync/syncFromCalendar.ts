import { taskEither as Te, array as A } from "fp-ts"
import { pipe } from "fp-ts/lib/pipeable"
import { taskEither, TaskEither } from "fp-ts/lib/TaskEither"
import { calendar_v3, google, Auth } from "googleapis"
import { AddTimeEntryOptions, MiteApi, TimeEntry } from "mite-api"
import moment from "moment"
import { Moment } from "moment"
import { AppError, GoogleApiAuthenticationError, UnknownAppError } from "../app/errors"
import { addTimeEntry } from "../mite/miteApiWrapper"
import { lastWeekThursdayToThursday } from "../mite/time"


export function addCalendarEntriesToMite(miteApi: MiteApi, calendarApi: calendar_v3.Calendar, userEmail: string, now: Moment): TaskEither<AppError, TimeEntry[]> {
    const { start, end } = lastWeekThursdayToThursday(now)

    const getEvents = (auth: Auth.OAuth2Client) => Te.tryCatch(
        () => calendarApi.events.list({
            auth,
            calendarId: userEmail,
            maxResults: 2, // TODO remove limit
            timeMin: start.toISOString(),
            timeMax: end.toISOString(),
            orderBy: "startTime",
            singleEvents: true
        }),
        error => new UnknownAppError(error))

    return pipe(
        getAuthorization(userEmail),
        Te.chain(getEvents),
        Te.map(response => response.data),
        Te.map(toMiteEntries),
        Te.chain(entries => pipe(
            entries,
            A.map(entry => addTimeEntry(miteApi, entry)),
            A.sequence(taskEither) // returns error when one of the tasks returns an error
        ))
    )

}

function toMiteEntries(calendarEvents: calendar_v3.Schema$Events): AddTimeEntryOptions[] {
    return pipe(
        calendarEvents.items ?? [],
        A.map(toMiteEntry)
    )
}

export function toMiteEntry(event: calendar_v3.Schema$Event): AddTimeEntryOptions {
    if (!event?.start?.dateTime
        || !event?.start
        || !event?.end
        || !event?.description) {
        throw new Error() // TODO do not throw
    } 
    const date = parseDayFrom(event.start.dateTime)
    const { projectId, serviceId } = findMiteInformation(event.description)

    return { // TODO: fill correctly
        date_at: date,
        project_id: projectId,
        service_id: serviceId,
        minutes: getDurationInMinutes(event.start, event.end),
        note: event.summary ?? "" // TODO test for default
    }
}

function findMiteInformation(description: string) {
    const regex = /#mite\s+(\d+)\/(\d+)/
    const regexResult = regex.exec(description)

    if (regexResult !== null && regexResult.length >= 3) {
        return {
            projectId: Number.parseInt(regexResult[1]),
            serviceId: Number.parseInt(regexResult[2])
        }
    }
    throw Error() // TODO don't throw
}

function getDurationInMinutes(startTime: calendar_v3.Schema$EventDateTime, endTime: calendar_v3.Schema$EventDateTime) {
    if (!startTime.dateTime
        || !endTime.dateTime) {
        throw new Error() // TODO don't throw
    }

    const start = moment.utc(startTime.dateTime)
    const end = moment.utc(endTime.dateTime)

    return end.diff(start, "minutes")
}

function parseDayFrom(dateTime: string): string {
    return moment.utc(dateTime).format("YYYY-MM-DD")
}

function getAuthorization(userEmail: string): TaskEither<GoogleApiAuthenticationError, Auth.JWT> {
    const auth = new google.auth.JWT(
        undefined,
        "./mite-reminder-service-secrets.json",
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
