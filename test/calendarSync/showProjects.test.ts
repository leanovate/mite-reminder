import { MiteApi, Project, Service } from "mite-api"
import { showProjects } from "../../src/calendarSync/showProjects"
import { CheckContext } from "../../src/slack/userContext"
import { getRight } from "../testUtils"

describe("showProjects", () => {
    it("should return projects and services from the mite api", async () => {
        const expectedProject = <Project> {
            name: "expected Project"
        }
        const expectedService = <Service> {
            name: "expected Service"
        }
        const miteApi = <MiteApi>{
            getProjects: (options, callback) => callback(undefined, [{ project: expectedProject }]),
            getServices: (options, callback) => callback(undefined, [{ service: expectedService }])
        }
        const checkContext: CheckContext = {
            config: { googleSecretsPath: "some_path.json" },
            miteApi,
            slackId: "slackId",
            repository: { loadUser: () => ({ miteId: 1234 }) }
        } as unknown as CheckContext

        const result = await showProjects(checkContext)()
        const projects = getRight(result)

        expect(projects).toEqual({ projects: [expectedProject], services: [expectedService] })
    })
})