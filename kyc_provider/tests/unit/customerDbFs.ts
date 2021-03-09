import { promises as fsPromises } from "fs"
import { describe } from "mocha"
import { expect, use } from "chai"
import { CountryCode } from "@polymathnetwork/polymesh-sdk/generated/types"
import { CustomerInfo } from "../../src/customerInfo"
import { CustomerDbFs } from "../../src/customerDbFs"
use(require("chai-as-promised"))

describe("CustomerDbFs Unit Tests", () => {
    let dbPath

    beforeEach("prepare dbStore", async() => {
        dbPath = `${__dirname}/dbStore_${Math.random() * 1000000}`
    })

    afterEach("clear dbStore", async() => {
        await fsPromises.unlink(dbPath)
    })

    it("throws when missing id", async() => {
        const db: CustomerDbFs = new CustomerDbFs(dbPath)
        await expect(db.getCustomerInfoById("1"))
            .to.eventually.throw
    })

    it("can save customer info in an empty db", async() => {
        const db: CustomerDbFs = new CustomerDbFs(dbPath)
        const bareInfo: JSON = <JSON><unknown>{
            "name": "John Doe",
            "country": "Gb",
            "passport": "12345",
            "valid": true,
            "jurisdiction": "Ie",
            "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
        }
        const info = new CustomerInfo(bareInfo)
        await db.setCustomerInfo("1", info)
    })

    it("can get saved customer info", async() => {
        const db: CustomerDbFs = new CustomerDbFs(dbPath)
        const bareInfo: JSON = <JSON><unknown>{
            "name": "John Doe",
            "country": "Gb",
            "passport": "12345",
            "valid": true,
            "jurisdiction": "Ie",
            "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
        }
        const info = new CustomerInfo(bareInfo)
        await db.setCustomerInfo("1", info)
        const retrieved: CustomerInfo = await db.getCustomerInfoById("1")

        expect(retrieved.name).to.equal("John Doe")
        expect(retrieved.country).to.equal(CountryCode["Gb"])
        expect(retrieved.passport).to.equal("12345")
        expect(retrieved.valid).to.be.true
        expect(retrieved.jurisdiction).to.equal(CountryCode["Ie"])
        expect(retrieved.polymeshDid).to.equal("0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd")
    })

    it("can save and get 2 saved customer infos", async() => {
        const db: CustomerDbFs = new CustomerDbFs(dbPath)
        const bareInfo1: JSON = <JSON><unknown>{
            "name": "John Doe",
            "country": "Gb",
            "passport": "12345",
            "valid": true,
            "jurisdiction": "Ie",
            "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
        }
        const info1 = new CustomerInfo(bareInfo1)
        const bareInfo2: JSON = <JSON><unknown>{
            "name": "Jane Doe",
            "country": "Gb",
            "passport": "12346",
            "valid": false,
            "jurisdiction": "Fr",
            "polymeshDid": "0x1234567890abcdef0123456789abcdef01234567890abcdef0123456789abcde",
        }
        const info2 = new CustomerInfo(bareInfo2)
        await db.setCustomerInfo("1", info1)
        await db.setCustomerInfo("2", info2)
        const retrieved1: CustomerInfo = await db.getCustomerInfoById("1")
        const retrieved2: CustomerInfo = await db.getCustomerInfoById("2")

        expect(retrieved1.name).to.equal("John Doe")
        expect(retrieved1.country).to.equal(CountryCode["Gb"])
        expect(retrieved1.passport).to.equal("12345")
        expect(retrieved1.valid).to.be.true
        expect(retrieved1.jurisdiction).to.equal(CountryCode["Ie"])
        expect(retrieved1.polymeshDid).to.equal("0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd")

        expect(retrieved2.name).to.equal("Jane Doe")
        expect(retrieved2.country).to.equal(CountryCode["Gb"])
        expect(retrieved2.passport).to.equal("12346")
        expect(retrieved2.valid).to.be.false
        expect(retrieved2.jurisdiction).to.equal(CountryCode["Fr"])
        expect(retrieved2.polymeshDid).to.equal("0x1234567890abcdef0123456789abcdef01234567890abcdef0123456789abcde")
    })

})
