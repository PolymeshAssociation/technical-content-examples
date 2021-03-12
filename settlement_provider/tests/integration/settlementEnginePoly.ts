import { describe } from "mocha"
import { expect, use } from "chai"
import { Polymesh } from "@polymathnetwork/polymesh-sdk"
import { Venue } from "@polymathnetwork/polymesh-sdk/types"
import * as nextConfig from "../../next.config.js"
import { SettlementEnginePoly } from "../../src/settlementEnginePoly"
import { ISettlementEngine } from "../../src/settlementEngine"
import { PolymeshCreator } from "../../src/types.js"
use(require("chai-as-promised"))

describe("SettlementEnginePoly Integration Tests", () => {
    const {
        serverRuntimeConfig: { polymesh: {
            accountMnemonic,
            middlewareLink,
            middlewareKey
        } },
        publicRuntimeConfig: { polymesh: {
            nodeUrl,
            venueId,
            usdToken,
        } }
    } = nextConfig

    it("getVenue works for the configured account", async () => {
        const apiCreator: PolymeshCreator = async () => Polymesh.connect({
            nodeUrl,
            accountMnemonic,
            middleware: {
                link: middlewareLink,
                key: middlewareKey
            }
        })
        const settlementEngine: ISettlementEngine = new SettlementEnginePoly(
            apiCreator,
            venueId,
            usdToken)
        const preconfiguredVenue: Venue = (await settlementEngine.getVenue()).venue

        expect(preconfiguredVenue.id.toString(10)).to.equal(venueId)
    }).timeout(30000)

})
