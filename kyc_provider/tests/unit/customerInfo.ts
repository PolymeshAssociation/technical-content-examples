import { describe } from "mocha"
import { expect } from "chai"
import { CustomerInfo, CustomerJson, ICustomerInfo, IncompleteInfoError } from "../../src/customerInfo"

describe("CustomerInfo Unit Tests", () => {

    it("can construct from JSON", () => {
        const bareInfo: CustomerJson = {
            name: "John Doe",
            country: "Gb",
            passport: "12345",
            valid: true,
            jurisdiction: "Ie",
        }
        const info: ICustomerInfo = new CustomerInfo(bareInfo)

        expect(info.name).to.equal("John Doe")
        expect(info.country).to.equal("Gb")
        expect(info.passport).to.equal("12345")
        expect(info.valid).to.be.true
        expect(info.jurisdiction).to.equal("Ie")
    })

    it("cannot construct from missing jurisdiction", () => {
        const bareInfo: CustomerJson = <CustomerJson>{
            name: "John Doe",
            country: "Gb",
            passport: "12345",
            valid: true,
        }
        expect(() => new CustomerInfo(bareInfo)).to.throw(IncompleteInfoError)
            .that.satisfies((e: IncompleteInfoError) => e.field === "jurisdiction")
    })

    it("can convert to JSON", () => {
        const bareInfo: CustomerJson = {
            name: "John Doe",
            country: "Gb",
            passport: "12345",
            valid: true,
            jurisdiction: "Ie",
        }
        const info: ICustomerInfo = new CustomerInfo(bareInfo)

        expect(info.toJSON()).to.deep.equal(bareInfo)
    })

    it("can patch name with single JSON info", () => {
        const bareInfo: CustomerJson = {
            name: "John Doe",
            country: "Gb",
            passport: "12345",
            valid: true,
            jurisdiction: "Ie",
        }
        const info: ICustomerInfo = new CustomerInfo(bareInfo)

        info.patch({
            name: "Jane Doe",
        })

        expect(info.toJSON()).to.deep.equal({
            ...bareInfo,
            name: "Jane Doe",
        })
    })

    it("can patch name with partial JSON info", () => {
        const bareInfo: CustomerJson = {
            name: "John Doe",
            country: "Gb",
            passport: "12345",
            valid: true,
            jurisdiction: "Ie",
        }
        const info: ICustomerInfo = new CustomerInfo(bareInfo)

        info.patch({
            name: "Jane Doe",
            valid: false,
        })

        expect(info.toJSON()).to.deep.equal({
            ...bareInfo,
            name: "Jane Doe",
            valid: false,
        })
    })

})
