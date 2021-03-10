import { exists as existsAsync, promises as fsPromises } from "fs"
import { promisify } from "util"
import { describe } from "mocha"
import { expect, use } from "chai"
import {
    IAssignedOrderInfo,
    IOrderInfo,
    OrderInfo,
} from "../../src/orderInfo"
import { IExchangeDb, UnknownTraderError } from "../../src/exchangeDb"
import { ExchangeDbFs } from "../../src/exchangeDbFs"
use(require("chai-as-promised"))

const exists = promisify(existsAsync)

describe("ExchangeDbFs Unit Tests", () => {
    let dbPath: string
    let exchangeDb: IExchangeDb

    beforeEach("prepare dbStore", async() => {
        dbPath = `${__dirname}/dbStore_${Math.random() * 1000000}`
        exchangeDb = new ExchangeDbFs(dbPath)
    })

    afterEach("clear dbStore", async() => {
        if (await exists(dbPath)) {
            await fsPromises.unlink(dbPath)
        }
    })

    it("throws when missing id", async() => {
        await expect(exchangeDb.getOrderInfoById("1")).to.eventually.be
            .rejectedWith(UnknownTraderError)
            .that.satisfies((error: UnknownTraderError) => error.id === "1")
    })

    it("can save order info in an empty db", async() => {
        const bareInfo: JSON = <JSON><unknown>{
            "isBuy": true,
            "quantity": 12345,
            "token": "ACME",
            "price": 33,
        }
        await exchangeDb.setOrderInfo("1", new OrderInfo(bareInfo))
    })

    it("can get saved order info", async() => {
        const bareInfo: JSON = <JSON><unknown>{
            "isBuy": true,
            "quantity": 12345,
            "token": "ACME",
            "price": 33,
        }
        await exchangeDb.setOrderInfo("1", new OrderInfo(bareInfo))

        const retrieved: IOrderInfo = await exchangeDb.getOrderInfoById("1")
        expect(retrieved.toJSON()).to.deep.equal(bareInfo)
    })

    it("can save and get 2 saved order infos", async() => {
        const bareInfo1: JSON = <JSON><unknown>{
            "isBuy": true,
            "quantity": 12345,
            "token": "ACME",
            "price": 33,
        }
        const bareInfo2: JSON = <JSON><unknown>{
            "isBuy": false,
            "quantity": 667,
            "token": "ACME",
            "price": 30,
        }

        await exchangeDb.setOrderInfo("1", new OrderInfo(bareInfo1))
        await exchangeDb.setOrderInfo("2", new OrderInfo(bareInfo2))

        const retrieved1: IOrderInfo = await exchangeDb.getOrderInfoById("1")
        const retrieved2: IOrderInfo = await exchangeDb.getOrderInfoById("2")
        expect(retrieved1.toJSON()).to.deep.equal(bareInfo1)
        expect(retrieved2.toJSON()).to.deep.equal(bareInfo2)
    })

    it("can save and get the 2 saved order infos together", async() => {
        const bareInfo1: JSON = <JSON><unknown>{
            "isBuy": true,
            "quantity": 12345,
            "token": "ACME",
            "price": 33,
        }
        const bareInfo2: JSON = <JSON><unknown>{
            "isBuy": false,
            "quantity": 667,
            "token": "ACME",
            "price": 30,
        }

        await exchangeDb.setOrderInfo("1", new OrderInfo(bareInfo1))
        await exchangeDb.setOrderInfo("2", new OrderInfo(bareInfo2))

        const retrieved: IAssignedOrderInfo[] = await exchangeDb.getOrders()
        expect(retrieved[0].toJSON()).to.deep.equal({...bareInfo1, "id": "1"})
        expect(retrieved[1].toJSON()).to.deep.equal({...bareInfo2, "id": "2"})
    })

    it("can delete 1 of 2 saved order infos", async() => {
        const bareInfo1: JSON = <JSON><unknown>{
            "isBuy": true,
            "quantity": 12345,
            "token": "ACME",
            "price": 33,
        }
        const bareInfo2: JSON = <JSON><unknown>{
            "isBuy": false,
            "quantity": 667,
            "token": "ACME",
            "price": 30,
        }
        await exchangeDb.setOrderInfo("1", new OrderInfo(bareInfo1))
        await exchangeDb.setOrderInfo("2", new OrderInfo(bareInfo2))
        await exchangeDb.deleteOrderInfoById("2")

        const retrieved1: IOrderInfo = await exchangeDb.getOrderInfoById("1")
        expect(retrieved1.toJSON()).to.deep.equal(bareInfo1)

        await expect(exchangeDb.getOrderInfoById("2")).to.eventually.be
            .rejectedWith(UnknownTraderError)
            .that.satisfies((error: UnknownTraderError) => error.id === "2")
    })

})
