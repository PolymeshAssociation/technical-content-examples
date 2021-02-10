import { promises as fsPromises } from "fs"
import mockedEnv, { RestoreFn } from "mocked-env"
import { expect } from "chai"
import { createMocks } from "node-mocks-http"
import * as nextConfig from "../../next.config.js"
import handleKycProvider from "../../pages/api/kycProvider"

describe("/api/kycProvider Integration Tests", () => {
    const { 
        serverRuntimeConfig: { polymesh: {
            accountUri,
            middlewareLink,
            middlewareKey
        } },
        publicRuntimeConfig: { polymesh: {
            nodeUrl
        } }
    } = nextConfig
    let toRestore: RestoreFn

    beforeEach("mock env", async() => {
        toRestore = mockedEnv({
            "POLY_NODE_URL": nodeUrl,
            "POLY_ACCOUNT_URI": accountUri,
            "MIDDLEWARE_LINK": middlewareLink,
            "MIDDLEWARE_KEY": middlewareKey
        })
    })
    
    afterEach("restore env", async() => {
        toRestore()
    })
    
    describe("GET", () => {
    
        it("returns 200", async () => {
            const { req, res } = createMocks({ "method": "GET" })

            await handleKycProvider(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal({
                "did": "0x0600000000000000000000000000000000000000000000000000000000000000"
            })
        }).timeout(10000)
    
    })

})
