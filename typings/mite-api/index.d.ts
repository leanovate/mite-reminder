declare module "mite-api" {
    export interface TimeEntry {
        billable: boolean,
        created_at: string,
        date_at: string, // in format YYYY-MM-DD
        id: number,
        locked: boolean,
        minutes: number,
        project_id: number,
        revenue: number,
        hourly_rate: number,
        service_id: number,
        updated_at: string,
        user_id: number,
        note: string,
        user_name: string,
        customer_id: number,
        customer_name: string,
        project_name: string,
        service_name: string
    }

    export interface User {
        id: number,
        name: string,
        email: string,
        note: string,
        created_at: string,
        updated_at: string,
        archived: boolean,
        language: string,
        role: string
    }

    export type TimeEntries = Array<{ time_entry: TimeEntry }>
    export type Users = Array<{ user: User }>

    export interface Project {
        id: number
        name: string
        note: string
        customer_id: number,
        customer_name: string
        budget: number
        budget_type: "minutes" | "minutes_per_month" | "cents" | "cents_per_month"
        hourly_rate: number
        archived: boolean
        active_hourly_rate: "hourly_rate" | "hourly_rates_per_service"
        hourly_rates_per_service: {
                service_id: number,
                hourly_rate: number
            }[],
        created_at: string // e.g. "2011-08-17T12:06:57+02:00",
        updated_at: string // e.g. "2015-02-19T10:53:10+01:00"
     }

    export interface AddTimeEntryOptions {
        date_at?: string // in format YYYY-MM-DD, default: today
        minutes?: number //default: 0
        note?: string // default: "" (empty string)
        user_id?: number // requires admin access to be set, default: current user id
        project_id?: number // default: null (no project association)
        service_id?: number // default: null (no service association)
        locked?: boolean // requires admin access to be set, default: false (false means the time entry can still be edited)
    }

    export interface MiteApi {
        getTimeEntries: GetTimeEntries
        getUsers: GetUsers
        addTimeEntry: AddTimeEntry
        getProjects: GetProjects
    }

    export type MiteApiError = { error: string }

    export type GetTimeEntries = (
        { from: string, to: string, user_id: string },
        callback: MiteCallback<TimeEntries>) => void

    export type GetUsers = (
        options: {
            email?: string,
            name?: string,
            limit?: number,
            page?: number
        },
        callback: MiteCallback<Users>) => void

    export type GetProjects = (options: GetProjectsOptions, callback: MiteCallback<{projects: Project[]}>) => void
    export interface GetProjectsOptions {
        name?: string // only return projects containing this string in the name, ignoring capitalization
        customer_id?: number
        limit?: number
        page?: number
    }
    
    export type AddTimeEntry = (options: AddTimeEntryOptions, callback: MiteCallback<{ time_entry: TimeEntry }>) => void

    export type MiteCallback<T> = (error: Error | undefined, result: T) => void

    type MiteApiConstructorParams = { account: string, apiKey: string, applicationName: string }
    export = (params: MiteApiConstructorParams): MiteApi => MiteApi;
}