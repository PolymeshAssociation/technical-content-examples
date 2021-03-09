import { promises as fsPromises } from "fs"
import { describe } from "mocha"
import { expect, use } from "chai"
import { CustomerInfo } from "../../src/customerInfo"
import { CustomerDbFs } from "../../src/customerDbFs"
import { UnknownCustomerError } from "../../src/customerDb"
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
        await expect(db.getCustomerInfoById("1")).to.be.eventually.rejected
            .that.satisfies((error: UnknownCustomerError) => error.id === "1")
    })

    it("can save customer info in an empty db", async() => {
        const db: CustomerDbFs = new CustomerDbFs(dbPath)
        const bareInfo: JSON = <JSON><unknown>{
            "name": "John Doe",
            "country": "Gb",
            "passport": "12345",
            "valid": true,
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
        }
        const info = new CustomerInfo(bareInfo)
        await db.setCustomerInfo("1", info)
        const retrieved: CustomerInfo = await db.getCustomerInfoById("1")

        expect(retrieved.name).to.equal("John Doe")
        expect(retrieved.country).to.equal("Gb")
        expect(retrieved.passport).to.equal("12345")
        expect(retrieved.valid).to.be.true
    })

    it("can save and get 2 saved customer infos", async() => {
        const db: CustomerDbFs = new CustomerDbFs(dbPath)
        const bareInfo1: JSON = <JSON><unknown>{
            "name": "John Doe",
            "country": "Gb",
            "passport": "12345",
            "valid": true,
        }
        const info1 = new CustomerInfo(bareInfo1)
        const bareInfo2: JSON = <JSON><unknown>{
            "name": "Jane Doe",
            "country": "Gb",
            "passport": "12346",
            "valid": false,
        }
        const info2 = new CustomerInfo(bareInfo2)
        await db.setCustomerInfo("1", info1)
        await db.setCustomerInfo("2", info2)
        const retrieved1: CustomerInfo = await db.getCustomerInfoById("1")
        const retrieved2: CustomerInfo = await db.getCustomerInfoById("2")

        expect(retrieved1.toJSON()).to.deep.equal(bareInfo1)
        expect(retrieved2.toJSON()).to.deep.equal(bareInfo2)
    })

})
