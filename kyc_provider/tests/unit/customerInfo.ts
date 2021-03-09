import { describe } from "mocha"
import { expect } from "chai"
import { CountryCode } from "@polymathnetwork/polymesh-sdk/generated/types"
import { CustomerInfo } from "../../src/customerInfo"

describe("CustomerInfo Unit Tests", () => {

    it("can construct from JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "name": "John Doe",
            "country": CountryCode.Gb,
            "passport": "12345",
            "valid": true,
            "jurisdiction": CountryCode.Ie,
            "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
        }
        const info = new CustomerInfo(bareInfo)

        expect(info.name).to.equal("John Doe")
        expect(info.country).to.equal("Gb")
        expect(info.passport).to.equal("12345")
        expect(info.valid).to.be.true
        expect(info.jurisdiction).to.equal("Ie")
        expect(info.polymeshDid).to.equal("0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd")
    })

    it("can construct from incomplete JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "name": "John Doe",
            "country": CountryCode.Gb,
            "passport": "12345",
            "valid": true,
            "jurisdiction": CountryCode.Ie,
        }
        const info = new CustomerInfo(bareInfo)

        expect(info.name).to.equal("John Doe")
        expect(info.country).to.equal(CountryCode["Gb"])
        expect(info.passport).to.equal("12345")
        expect(info.valid).to.be.true
        expect(info.jurisdiction).to.equal(CountryCode["Ie"])
        expect(info.polymeshDid).to.be.null
    })

    it("can construct from incomplete JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "name": "John Doe",
            "country": CountryCode.Gb,
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
            "country": CountryCode.Gb,
            "passport": "12345",
            "valid": true,
            "jurisdiction": CountryCode.Ie,
            "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
        }
        const info = new CustomerInfo(bareInfo)

        expect(info.toJSON()).to.deep.equal(bareInfo)
    })

    it("can patch name with single JSON info", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "name": "John Doe",
            "country": CountryCode.Gb,
            "passport": "12345",
            "valid": true,
            "jurisdiction": CountryCode.Ie,
            "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
        }
        const info = new CustomerInfo(bareInfo)

        info.patch(<JSON><unknown>{
            "name": "Jane Doe",
        })

        expect(info.toJSON()).to.deep.equal({
            ...bareInfo,
            "name": "Jane Doe",
        })
    })

    it("can patch name with partial JSON info", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "name": "John Doe",
            "country": CountryCode.Gb,
            "passport": "12345",
            "valid": true,
            "jurisdiction": CountryCode.Ie,
            "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
        }
        const info = new CustomerInfo(bareInfo)

        info.patch(<JSON><unknown>{
            "name": "Jane Doe",
            "valid": false,
            "polymeshDid": "0x1234567890abcdef0123456789abcdef01234567890abcdef0123456789abcde",
        })

        expect(info.toJSON()).to.deep.equal({
            ...bareInfo,
            "name": "Jane Doe",
            "valid": false,
            "polymeshDid": "0x1234567890abcdef0123456789abcdef01234567890abcdef0123456789abcde",
        })
    })

    it("can patch name with partial JSON info", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "name": "John Doe",
            "country": CountryCode.Gb,
            "passport": "12345",
            "valid": true,
            "jurisdiction": CountryCode.Ie,
            "polymeshDid": null,
        }
        const info = new CustomerInfo(bareInfo)

        info.patch(<JSON><unknown>{
            "name": "Jane Doe",
            "valid": false,
        })

        expect(info.toJSON()).to.deep.equal({
            ...bareInfo,
            "name": "Jane Doe",
            "valid": false,
        })
    })

})
