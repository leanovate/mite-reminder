declare module "mite-api" {
    export interface TimeEntry {
        billable: boolean,
        created_at: string,
        date_at: string,
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

    export interface MiteApi {
        getTimeEntries: GetTimeEntries;
        getUsers: GetUsers;
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

    export type GetTimeEntriesCallBack = (error: Error | undefined, result: TimeEntries) => void
    export type GetUserCallback = (error: Error | undefined, result: Users) => void

    type MiteApiConstructorParams = { account: string, apiKey: string, applicationName: string }
    export = (params: MiteApiConstructorParams): MiteApi => MiteApi;
}