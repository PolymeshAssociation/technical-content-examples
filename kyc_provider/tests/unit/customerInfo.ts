import { describe } from "mocha"
import { expect } from "chai"
import { CustomerInfo } from "../../src/customerInfo"

describe("CustomerInfo Unit Tests", () => {

    it("can construct from JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "name": "John Doe",
            "country": "Gb",
            "passport": "12345",
            "valid": true,
        }
        const info = new CustomerInfo(bareInfo)

        expect(info.name).to.equal("John Doe")
        expect(info.country).to.equal("Gb")
        expect(info.passport).to.equal("12345")
        expect(info.valid).to.be.true
    })

    it("can construct from incomplete JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "name": "John Doe",
            "country": "Gb",
            "valid": true,
        }
        const info = new CustomerInfo(bareInfo)

        expect(info.name).to.equal("John Doe")
        expect(info.country).to.equal("Gb")
        expect(info.passport).to.be.undefined
        expect(info.valid).to.be.true
    })

    it("can convert to JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "name": "John Doe",
            "country": "Gb",
            "passport": "12345",
            "valid": true,
        }
        const info = new CustomerInfo(bareInfo)
        const back = info.toJSON()

        expect(back["name"]).to.equal("John Doe")
        expect(back["country"]).to.equal("Gb")
        expect(back["passport"]).to.equal("12345")
        expect(back["valid"]).to.be.true
    })

    it("can patch name with single JSON info", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "name": "John Doe",
            "country": "Gb",
            "passport": "12345",
            "valid": true,
        }
        const info = new CustomerInfo(bareInfo)

        info.patch(<JSON><unknown>{
            "name": "Jane Doe"
        })
        const back = info.toJSON()

        expect(back["name"]).to.equal("Jane Doe")
        expect(back["country"]).to.equal("Gb")
        expect(back["passport"]).to.equal("12345")
        expect(back["valid"]).to.be.true
    })

    it("can patch name with partial JSON info", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "name": "John Doe",
            "country": "Gb",
            "passport": "12345",
            "valid": true,
        }
        const info = new CustomerInfo(bareInfo)

        info.patch(<JSON><unknown>{
            "name": "Jane Doe",
            "valid": false,
        })
        const back = info.toJSON()

        expect(back["name"]).to.equal("Jane Doe")
        expect(back["country"]).to.equal("Gb")
        expect(back["passport"]).to.equal("12345")
        expect(back["valid"]).to.be.false
    })

})