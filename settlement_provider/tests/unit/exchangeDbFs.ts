import { promises as fsPromises } from "fs"
import { describe } from "mocha"
import { expect, use } from "chai"
import { AssignedOrderInfo, OrderInfo } from "../../src/orderInfo"
import { ExchangeDbFs } from "../../src/exchangeDbFs"
use(require("chai-as-promised"))

describe("ExchangeDbFs Unit Tests", () => {
    let dbPath

    beforeEach("prepare dbStore", async() => {
        dbPath = `${__dirname}/dbStore_${Math.random() * 1000000}`
    })

    afterEach("clear dbStore", async() => {
        await fsPromises.unlink(dbPath)
    })

    it("throws when missing id", async() => {
        const db: ExchangeDbFs = new ExchangeDbFs(dbPath)
        await expect(db.getOrderInfoById("1"))
            .to.eventually.throw
    })

    it("can save trade info in an empty db", async() => {
        const db: ExchangeDbFs = new ExchangeDbFs(dbPath)
        const bareInfo: JSON = <JSON><unknown>{
            "isBuy": true,
            "quantity": 12345,
            "token": "ACME",
            "price": 33,
        }
        const info = new OrderInfo(bareInfo)
        await db.setOrderInfo("1", info)
    })

    it("can get saved customer info", async() => {
        const db: ExchangeDbFs = new ExchangeDbFs(dbPath)
        const bareInfo: JSON = <JSON><unknown>{
            "isBuy": true,
            "quantity": 12345,
            "token": "ACME",
            "price": 33,
        }
        const info = new OrderInfo(bareInfo)
        await db.setOrderInfo("1", info)
        const retrieved: OrderInfo = await db.getOrderInfoById("1")

        expect(retrieved.isBuy).to.be.true
        expect(retrieved.quantity).to.equal(12345)
        expect(retrieved.token).to.equal("ACME")
        expect(retrieved.price).to.equal(33)
    })

    it("can save and get 2 saved customer infos", async() => {
        const db: ExchangeDbFs = new ExchangeDbFs(dbPath)
        const bareInfo1: JSON = <JSON><unknown>{
            "isBuy": true,
            "quantity": 12345,
            "token": "ACME",
            "price": 33,
        }
        const info1 = new OrderInfo(bareInfo1)
        const bareInfo2: JSON = <JSON><unknown>{
            "isBuy": false,
            "quantity": 667,
            "token": "ACME",
            "price": 30,
        }
        const info2 = new OrderInfo(bareInfo2)
        await db.setOrderInfo("1", info1)
        await db.setOrderInfo("2", info2)
        const retrieved1: OrderInfo = await db.getOrderInfoById("1")
        const retrieved2: OrderInfo = await db.getOrderInfoById("2")

        expect(retrieved1.isBuy).to.be.true
        expect(retrieved1.quantity).to.equal(12345)
        expect(retrieved1.token).to.equal("ACME")
        expect(retrieved1.price).to.equal(33)

        expect(retrieved2.isBuy).to.be.false
        expect(retrieved2.quantity).to.equal(667)
        expect(retrieved2.token).to.equal("ACME")
        expect(retrieved2.price).to.equal(30)
    })

    it("can save and get the 2 saved customer infos together", async() => {
        const db: ExchangeDbFs = new ExchangeDbFs(dbPath)
        const bareInfo1: JSON = <JSON><unknown>{
            "isBuy": true,
            "quantity": 12345,
            "token": "ACME",
            "price": 33,
        }
        const info1 = new OrderInfo(bareInfo1)
        const bareInfo2: JSON = <JSON><unknown>{
            "isBuy": false,
            "quantity": 667,
            "token": "ACME",
            "price": 30,
        }
        const info2 = new OrderInfo(bareInfo2)
        await db.setOrderInfo("1", info1)
        await db.setOrderInfo("2", info2)
        const retrieved: AssignedOrderInfo[] = await db.getOrders()

        expect(retrieved[0].id).to.equal("1")
        expect(retrieved[0].isBuy).to.be.true
        expect(retrieved[0].quantity).to.equal(12345)
        expect(retrieved[0].token).to.equal("ACME")
        expect(retrieved[0].price).to.equal(33)

        expect(retrieved[1].id).to.equal("2")
        expect(retrieved[1].isBuy).to.be.false
        expect(retrieved[1].quantity).to.equal(667)
        expect(retrieved[1].token).to.equal("ACME")
        expect(retrieved[1].price).to.equal(30)
    })

})
