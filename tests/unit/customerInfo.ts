import { describe } from "mocha"
import { expect } from "chai"
import { CustomerInfo } from "../../src/customerInfo"

describe("CustomerInfo Unit Tests", () => {

    it("can construct from JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "name": "John Doe",
            "country": "UK",
            "passport": "12345",
            "valid": true,
            "jurisdiction": "IE",
            "polymeshId": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcdef"
        }
        const info = new CustomerInfo(bareInfo)

        expect(info.name).to.equal("John Doe")
        expect(info.country).to.equal("UK")
        expect(info.passport).to.equal("12345")
        expect(info.valid).to.be.true
        expect(info.jurisdiction).to.equal("IE")
        expect(info.polymeshId).to.equal("0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcdef")
    })

    it("can convert to JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "name": "John Doe",
            "country": "UK",
            "passport": "12345",
            "valid": true,
            "jurisdiction": "IE",
            "polymeshId": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcdef"
        }
        const info = new CustomerInfo(bareInfo)
        const back = info.toJSON()

        expect(back["name"]).to.equal("John Doe")
        expect(back["country"]).to.equal("UK")
        expect(back["passport"]).to.equal("12345")
        expect(back["valid"]).to.be.true
        expect(back["jurisdiction"]).to.equal("IE")
        expect(back["polymeshId"]).to.equal("0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcdef")
    })

    it("can patch name with single JSON info", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "name": "John Doe",
            "country": "UK",
            "passport": "12345",
            "valid": true,
            "jurisdiction": "IE",
            "polymeshId": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcdef"
        }
        const info = new CustomerInfo(bareInfo)

        info.patch(<JSON><unknown>{
            "name": "Jane Doe"
        })
        const back = info.toJSON()

        expect(back["name"]).to.equal("Jane Doe")
        expect(back["country"]).to.equal("UK")
        expect(back["passport"]).to.equal("12345")
        expect(back["valid"]).to.be.true
        expect(back["jurisdiction"]).to.equal("IE")
        expect(back["polymeshId"]).to.equal("0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcdef")
    })

    it("can patch name with partial JSON info", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "name": "John Doe",
            "country": "UK",
            "passport": "12345",
            "valid": true,
            "jurisdiction": "IE",
            "polymeshId": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcdef"
        }
        const info = new CustomerInfo(bareInfo)

        info.patch(<JSON><unknown>{
            "name": "Jane Doe",
            "valid": false,
            "polymeshId": "0x1234567890abcdef0123456789abcdef01234567890abcdef0123456789abcdef0"
        })
        const back = info.toJSON()

        expect(back["name"]).to.equal("Jane Doe")
        expect(back["country"]).to.equal("UK")
        expect(back["passport"]).to.equal("12345")
        expect(back["valid"]).to.be.false
        expect(back["jurisdiction"]).to.equal("IE")
        expect(back["polymeshId"]).to.equal("0x1234567890abcdef0123456789abcdef01234567890abcdef0123456789abcdef0")
    })

})