import { describe } from "mocha"
import { expect, use } from "chai"
import { Polymesh } from "@polymathnetwork/polymesh-sdk"
import * as nextConfig from "../../next.config.js"
import { CustomerInfo } from "../../src/customerInfo"
import { ClaimForwarderPoly } from "../../src/claimForwarderPoly"
import { ClaimData, ClaimType, CountryCode, ScopedClaim, ScopeType } from "@polymathnetwork/polymesh-sdk/types"
use(require("chai-as-promised"))

describe("ClaimForwarderPoly Integration Tests", () => {
    const {
        serverRuntimeConfig: { polymesh: {
            accountMnemonic,
            middlewareLink,
            middlewareKey,
        }, },
        publicRuntimeConfig: { polymesh: {
            nodeUrl,
        }, },
    } = nextConfig
    const onTrustDid = "0x4b0be33fbd1d4ee719bd902e1ee5de6ad6faa1a2558f141488df53482b5c974e"
    let api: Polymesh

    beforeEach("prepare api", async function() {
        this.timeout(30000)
        api = await Polymesh.connect({
            nodeUrl,
            accountMnemonic,
            middleware: {
                link: middlewareLink,
                key: middlewareKey,
            },
        })
    })

    it("getJurisdictionClaim throws if more than 1 identity returned", async() => {
        const claimForwarder = new ClaimForwarderPoly(api)
        const alice = await api.getCurrentIdentity()
        const bareInfo: JSON = <JSON><unknown>{
            "name": "John Doe",
            "country": "Gb",
            "passport": "12345",
            "valid": true,
            "jurisdiction": "Ie",
            "polymeshDid":  alice.did,
        }
        const info = new CustomerInfo(bareInfo)

        await expect(claimForwarder.getJurisdictionClaim(info))
            .to.eventually.throw
    }).timeout(30000)

    it("can get claim on known identity", async() => {
        const claimForwarder = new ClaimForwarderPoly(api)
        const bareInfo: JSON = <JSON><unknown>{
            "name": "OnTrust",
            "country": "Gb",
            "passport": "12345",
            "valid": true,
            "jurisdiction": "Ge",
            "polymeshDid":  onTrustDid,
        }
        const info = new CustomerInfo(bareInfo)
        const found: ClaimData = await claimForwarder.getJurisdictionClaim(info)
        expect(found.claim).to.deep.equal({
            "type": ClaimType.Jurisdiction,
            "code": CountryCode.Ge,
            "scope": {
                "type": ScopeType.Identity,
                "value": onTrustDid
            }
        })
        expect(found.issuer.did).to.equal((await api.getCurrentIdentity()).did)
        expect(found.target.did).to.equal(onTrustDid)
    }).timeout(30000)

})
