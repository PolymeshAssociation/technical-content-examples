import { describe } from "mocha"
import { expect } from "chai"
import { CustomerInfo } from "../../src/customerInfo"

describe("CustomerInfo Unit Tests", () => {

    it("can construct from JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "name": "John Doe",
            "country": "UK",
            "passport": "12345",
            "valid": true
        }
        const info = new CustomerInfo(bareInfo)

        expect(info.name).to.equal("John Doe")
        expect(info.country).to.equal("UK")
        expect(info.passport).to.equal("12345")
        expect(info.valid).to.be.true
    })

    it("can convert to JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "name": "John Doe",
            "country": "UK",
            "passport": "12345",
            "valid": true
        }
        const info = new CustomerInfo(bareInfo)
        const back = info.toJSON()

        expect(back["name"]).to.equal("John Doe")
        expect(back["country"]).to.equal("UK")
        expect(back["passport"]).to.equal("12345")
        expect(back["valid"]).to.be.true
    })

})