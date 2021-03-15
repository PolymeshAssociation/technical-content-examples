import { describe } from "mocha"
import { expect, use } from "chai"
import { Polymesh } from "@polymathnetwork/polymesh-sdk"
import * as nextConfig from "../../next.config.js"
import { CustomerInfo, CustomerJson } from "../../src/customerInfo"
import { ClaimForwarderPoly, TooManyClaimsCustomerError } from "../../src/claimForwarderPoly"
import { ClaimData, ClaimType, CountryCode, ScopeType } from "@polymathnetwork/polymesh-sdk/types"
import { NonExistentCustomerPolymeshIdError } from "../../src/claimForwarder.js"
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

    beforeEach("prepare api", async function () {
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

    it("getJurisdictionClaim throws if more than 1 identity returned", async () => {
        const claimForwarder = new ClaimForwarderPoly(api)
        const alice = await api.getCurrentIdentity()
        const bareInfo: CustomerJson = {
            name: "John Doe",
            country: CountryCode.Gb,
            passport: "12345",
            valid: true,
            jurisdiction: CountryCode.Ie,
            polymeshDid: alice.did,
        }
        const info = new CustomerInfo(bareInfo)

        await expect(claimForwarder.getJurisdictionClaim(info)).to.be.eventually.rejected
            .that.satisfies((error: TooManyClaimsCustomerError) => error.count === 2)
    }).timeout(30000)

    it("throws when trying to add a claim on an unknown identity", async () => {
        const claimForwarder = new ClaimForwarderPoly(api)
        const bareInfo: CustomerJson = {
            name: "OnTrust",
            country: CountryCode.Gb,
            passport: "12345",
            valid: true,
            jurisdiction: CountryCode.Ie,
            polymeshDid: "0x".padEnd(66, "0"),
        }
        const info = new CustomerInfo(bareInfo)
        expect(await claimForwarder.hasValidIdentity(info)).to.be.false
        await expect(claimForwarder.addJurisdictionClaim(info)).to.be.eventually.rejected
            .that.satisfies((error: NonExistentCustomerPolymeshIdError) => error.customer.polymeshDid === "0x".padEnd(66, "0"))
    }).timeout(30000)

    it("can get claim on known identity", async () => {
        const claimForwarder = new ClaimForwarderPoly(api)
        const bareInfo: CustomerJson = {
            name: "OnTrust",
            country: CountryCode.Gb,
            passport: "12345",
            valid: true,
            jurisdiction: CountryCode.Ge,
            polymeshDid: onTrustDid,
        }
        const info = new CustomerInfo(bareInfo)
        const found: ClaimData = await claimForwarder.getJurisdictionClaim(info)
        expect(found.claim).to.deep.equal({
            type: ClaimType.Jurisdiction,
            code: CountryCode.Ge,
            scope: {
                type: ScopeType.Identity,
                value: onTrustDid
            }
        })
        expect(found.issuer.did).to.equal((await api.getCurrentIdentity()).did)
        expect(found.target.did).to.equal(onTrustDid)
    }).timeout(30000)

})
