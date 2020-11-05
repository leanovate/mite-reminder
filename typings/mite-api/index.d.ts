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
    }

    export type MiteApiError = { error: string }

    export type GetTimeEntries = (
        { from: string, to: string, user_id: string },
        callback: GetTimeEntriesCallBack) => void

    export type GetUsers = (
        options: {
            email?: string,
            name?: string,
            limit?: number,
            page?: number
        },
        callback: GetUserCallback) => void
    
    export type AddTimeEntry = (options: AddTimeEntryOptions, callback: AddTimeEntryCallback) => void

    export type GetTimeEntriesCallBack = (error: Error | undefined, result: TimeEntries) => void
    export type GetUserCallback = (error: Error | undefined, result: Users) => void
    export type AddTimeEntryCallback = (error: Error | undefined, result: { time_entry: TimeEntry }) => void

    type MiteApiConstructorParams = { account: string, apiKey: string, applicationName: string }
    export = (params: MiteApiConstructorParams): MiteApi => MiteApi;
}