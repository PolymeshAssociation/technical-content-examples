import { describe } from "mocha"
import { expect, use } from "chai"
import { Polymesh } from "@polymathnetwork/polymesh-sdk"
import * as nextConfig from "../../next.config.js"
import { CustomerInfo } from "../../src/customerInfo"
import { ClaimForwarderPoly } from "../../src/claimForwarderPoly"
use(require("chai-as-promised"))

describe("ClaimForwarderPoly Integration Tests", () => {
    const { 
        serverRuntimeConfig: { polymesh: {
            accountMnemonic,
            middlewareLink,
            middlewareKey
        } },
        publicRuntimeConfig: { polymesh: {
            nodeUrl
        } }
    } = nextConfig

    beforeEach("prepare api", async() => {
    })

    it("getJurisdictionClaim throws if more than 1 identity returned", async() => {
        const api = await Polymesh.connect({
            nodeUrl,
            accountMnemonic,
            middleware: {
                link: middlewareLink,
                key: middlewareKey
            }
        })
        const claimForwarder = new ClaimForwarderPoly(api)
        const alice = await api.getCurrentIdentity()
        const bareInfo: JSON = <JSON><unknown>{
            "name": "John Doe",
            "country": "Gb",
            "passport": "12345",
            "valid": true,
            "jurisdiction": "Ie",
            "polymeshDid":  alice.did
        }
        const info = new CustomerInfo(bareInfo)

        await expect(claimForwarder.getJurisdictionClaim(info))
            .to.eventually.throw
    }).timeout(30000)

})
