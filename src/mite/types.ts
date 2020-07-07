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