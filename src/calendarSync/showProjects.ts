import { taskEither as Te } from "fp-ts"
import { sequenceT } from "fp-ts/lib/Apply"
import { pipe } from "fp-ts/lib/pipeable"
import { taskEither, TaskEither } from "fp-ts/lib/TaskEither"
import { AppError } from "../app/errors"
import { getProjects, getServices } from "../mite/miteApiWrapper"
import { CheckContext } from "../slack/userContext"

export interface ShowProjectsResult {
    projects: Array<{name: string, projectId: number}>
    services: Array<{name: string, serviceId: number}>
}

export function showProjects(context: CheckContext, searchString?: string): TaskEither<AppError, ShowProjectsResult> {
    return pipe(
        sequenceT(taskEither)(getProjects(context.miteApi, { name: searchString }), getServices(context.miteApi, { name: searchString })),
        Te.map(([projects, services ]) => ({
            projects: projects.map(project => ({ name: project.name, projectId: project.id })),
            services: services.map(service => ({ name: service.name, serviceId: service.id })),
        })
        )
    )
}