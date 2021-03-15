import mockedEnv, { RestoreFn } from "mocked-env"
import { expect } from "chai"
import { createMocks } from "node-mocks-http"
import * as nextConfig from "../../next.config.js"
import handleKycProvider from "../../pages/api/kycProvider"

describe("/api/kycProvider Integration Tests", () => {
    const {
        serverRuntimeConfig: { polymesh: {
            accountMnemonic,
        }, },
        publicRuntimeConfig: { polymesh: {
            nodeUrl,
            middlewareLink,
            middlewareKey,
        }, },
    } = nextConfig
    let toRestore: RestoreFn

    beforeEach("mock env", async() => {
        toRestore = mockedEnv({
            POLY_NODE_URL: nodeUrl,
            POLY_ACCOUNT_MNEMONIC: accountMnemonic,
            MIDDLEWARE_LINK: middlewareLink,
            MIDDLEWARE_KEY: middlewareKey,
        })
    })

    afterEach("restore env", async() => {
        toRestore()
    })

    describe("GET", () => {

        it("returns 200", async () => {
            const { req, res } = createMocks({ method: "GET" })

            await handleKycProvider(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData()).did).to.match(/^0x[0-9a-fA-F]{64}$/)
        }).timeout(20000)

    })

})
