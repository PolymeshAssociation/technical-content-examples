import { exists as existsAsync, promises as fsPromises } from "fs"
import { promisify } from "util"
import mockedEnv, { RestoreFn } from "mocked-env"
import { expect, use } from "chai"
import { createMocks } from "node-mocks-http"
import { IAssignedOrderInfo, IOrderInfo, OrderInfo } from "../../src/orderInfo"
import { IFullSettlementInfo, SettlementInfo } from "../../src/settlementInfo"
import { IExchangeDb, UnknownTraderError } from "../../src/exchangeDb"
import { ISettlementDb } from "../../src/settlementDb"
import exchangeDbFactory from "../../src/exchangeDbFactory"
import settlementDbFactory from "../../src/settlementDbFactory"
import handleSettlements from "../../pages/api/settlements"
use(require("chai-as-promised"))

const exists = promisify(existsAsync)

describe("/api/settlements Integration Tests", () => {
    let exchangeDbPath: string, settlementDbPath: string
    let exchangeDb: IExchangeDb, settlementDb: ISettlementDb
    let toRestore: RestoreFn

    beforeEach("mock env", async() => {
        exchangeDbPath = `${__dirname}/dbStore_${Math.random() * 1000000}`
        settlementDbPath = `${__dirname}/dbStore_${Math.random() * 1000000}`
        toRestore = mockedEnv({
            "EXCHANGE_DB_PATH": exchangeDbPath,
            "SETTLEMENT_DB_PATH": settlementDbPath,
        })
        exchangeDb = await exchangeDbFactory()
        settlementDb = await settlementDbFactory()
    })

    afterEach("restore env", async() => {
        toRestore()
        if (await exists(exchangeDbPath)) {
            await fsPromises.unlink(exchangeDbPath)
        }
        if (await exists(settlementDbPath)) {
            await fsPromises.unlink(settlementDbPath)
        }
    })

    describe("GET", () => {

        it("returns empty on get without anything", async () => {
            const { req, res } = createMocks({
                "method": "GET"
            })

            await handleSettlements(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal([])
        })

        it("returns the info on previously set info", async () => {
            const bareInfo: JSON = <JSON><unknown>{
                "buyer": { "id": "1" },
                "seller": { "id": "2" },
                "quantity": 12345,
                "token": "ACME",
                "price": 33,
                "isPaid": true,
                "isTransferred": false,
            }
            await settlementDb.setSettlementInfo("3", new SettlementInfo(bareInfo))
            const { req, res } = createMocks({
                "method": "GET"
            })

            await handleSettlements(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal([{
                ...bareInfo,
                "id": "3",
            }])
        })

        it("returns the info on previously set double info", async () => {
            const bareInfo1: JSON = <JSON><unknown>{
                "buyer": { "id": "1" },
                "seller": { "id": "2" },
                "quantity": 12345,
                "token": "ACME",
                "price": 33,
                "isPaid": true,
                "isTransferred": false,
            }
            const bareInfo2: JSON = <JSON><unknown>{
                "buyer": { "id": "3" },
                "seller": { "id": "2" },
                "quantity": 543,
                "token": "ACME",
                "price": 30,
                "isPaid": false,
                "isTransferred": false,
            }
            await settlementDb.setSettlementInfo("3", new SettlementInfo(bareInfo1))
            await settlementDb.setSettlementInfo("2", new SettlementInfo(bareInfo2))
            const { req, res } = createMocks({
                "method": "GET"
            })

            await handleSettlements(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal([
                {...bareInfo2, "id": "2"},
                {...bareInfo1, "id": "3"}
            ])
        })

        it("returns the filtered info on previously set double info", async () => {
            const bareInfo1: JSON = <JSON><unknown>{
                "buyer": { "id": "1" },
                "seller": { "id": "2" },
                "quantity": 12345,
                "token": "ACME",
                "price": 33,
                "isPaid": true,
                "isTransferred": false,
            }
            const bareInfo2: JSON = <JSON><unknown>{
                "buyer": { "id": "3" },
                "seller": { "id": "2" },
                "quantity": 543,
                "token": "ACME",
                "price": 30,
                "isPaid": false,
                "isTransferred": false,
            }
            await settlementDb.setSettlementInfo("3", new SettlementInfo(bareInfo1))
            await settlementDb.setSettlementInfo("2", new SettlementInfo(bareInfo2))
            const { req, res } = createMocks({
                "method": "GET",
                "query": {
                    "traderId": "1"
                }
            })

            await handleSettlements(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal([
                {...bareInfo1, "id": "3"}
            ])
        })

    })

    describe("GET for traderId", () => {

        it("returns empty on get without anything", async () => {
            const { req, res } = createMocks({
                "method": "GET"
            })

            await handleSettlements(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal([])
        })

        it("returns the info on previously set info", async () => {
            const bareInfo: JSON = <JSON><unknown>{
                "buyer": { "id": "1" },
                "seller": { "id": "2" },
                "quantity": 12345,
                "token": "ACME",
                "price": 33,
                "isPaid": true,
                "isTransferred": false,
            }
            await settlementDb.setSettlementInfo("3", new SettlementInfo(bareInfo))
            const { req, res } = createMocks({
                "method": "GET"
            })

            await handleSettlements(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal([{
                ...bareInfo,
                "id": "3",
            }])
        })

        it("returns the info on previously set double info", async () => {
            const bareInfo1: JSON = <JSON><unknown>{
                "buyer": { "id": "1" },
                "seller": { "id": "2" },
                "quantity": 12345,
                "token": "ACME",
                "price": 33,
                "isPaid": true,
                "isTransferred": false,
            }
            const bareInfo2: JSON = <JSON><unknown>{
                "buyer": { "id": "3" },
                "seller": { "id": "2" },
                "quantity": 543,
                "token": "ACME",
                "price": 30,
                "isPaid": false,
                "isTransferred": false,
            }
            await settlementDb.setSettlementInfo("3", new SettlementInfo(bareInfo1))
            await settlementDb.setSettlementInfo("2", new SettlementInfo(bareInfo2))
            const { req, res } = createMocks({
                "method": "GET"
            })

            await handleSettlements(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal([
                {...bareInfo2, "id": "2"},
                {...bareInfo1, "id": "3"}
            ])
        })

    })

    describe("POST", () => {

        it("returns 404 on missing buy order", async () => {
            await exchangeDb.setOrderInfo("2", new OrderInfo({
                "isBuy": false,
                "quantity": 10,
                "token": "ACME",
                "price": 33,
            } as unknown as JSON))
            const { req, res } = createMocks({
                "method": "POST",
                "query": {
                    "buyerId": "1",
                    "sellerId": "2",
                }
            })

            await handleSettlements(req, res)

            expect(res._getStatusCode()).to.equal(404)
            expect(JSON.parse(res._getData())).to.deep.equal({"status": "Order not found 1"})
        })

        it("returns 404 on missing sell order", async () => {
            await exchangeDb.setOrderInfo("1", new OrderInfo({
                "isBuy": true,
                "quantity": 10,
                "token": "ACME",
                "price": 33,
            } as unknown as JSON))
            const { req, res } = createMocks({
                "method": "POST",
                "query": {
                    "buyerId": "1",
                    "sellerId": "2",
                }
            })

            await handleSettlements(req, res)

            expect(res._getStatusCode()).to.equal(404)
            expect(JSON.parse(res._getData())).to.deep.equal({"status": "Order not found 2"})
        })

        it("returns 400 if isBuy are not correct", async () => {
            await exchangeDb.setOrderInfo("1", new OrderInfo({
                "isBuy": true,
                "quantity": 10,
                "token": "ACME",
                "price": 33,
            } as unknown as JSON))
            await exchangeDb.setOrderInfo("2", new OrderInfo({
                "isBuy": true,
                "quantity": 15,
                "token": "ACME",
                "price": 40,
            } as unknown as JSON))
            const { req, res } = createMocks({
                "method": "POST",
                "query": {
                    "buyerId": "1",
                    "sellerId": "2",
                }
            })

            await handleSettlements(req, res)

            expect(res._getStatusCode()).to.equal(400)
            expect(JSON.parse(res._getData())).to.deep.equal({"status": "Order is of wrong type, expectedIsBuy: false"})
        })

        it("returns 400 when tokens not matching", async () => {
            await exchangeDb.setOrderInfo("1", new OrderInfo({
                "isBuy": true,
                "quantity": 10,
                "token": "ACME",
                "price": 33,
            } as unknown as JSON))
            await exchangeDb.setOrderInfo("2", new OrderInfo({
                "isBuy": false,
                "quantity": 15,
                "token": "ECMN",
                "price": 40,
            } as unknown as JSON))
            const { req, res } = createMocks({
                "method": "POST",
                "query": {
                    "buyerId": "1",
                    "sellerId": "2",
                }
            })

            await handleSettlements(req, res)

            expect(res._getStatusCode()).to.equal(400)
            expect(JSON.parse(res._getData())).to.deep.equal({"status": "Orders are not for same token, ACME / ECMN"})
        })

        it("returns 200 when got a match, and got correct data, seller has more", async () => {
            await exchangeDb.setOrderInfo("1", new OrderInfo(<JSON><unknown>{
                "isBuy": true,
                "quantity": 10,
                "token": "ACME",
                "price": 33,
            }))
            const bareSellOrder: JSON = <JSON><unknown>{
                "isBuy": false,
                "quantity": 15,
                "token": "ACME",
                "price": 35,
            }
            await exchangeDb.setOrderInfo("2", new OrderInfo(bareSellOrder))
            const { req, res } = createMocks({
                "method": "POST",
                "query": {
                    "buyerId": "1",
                    "sellerId": "2",
                }
            })

            await handleSettlements(req, res)

            expect(res._getStatusCode()).to.equal(200)
            const settlements: IFullSettlementInfo[] = await settlementDb.getSettlements()
            expect(settlements.length).to.equal(1)
            expect(JSON.parse(res._getData())).to.deep.equal({
                "id": settlements[0].id,
                "buyer": { "id": "1" },
                "seller": { "id": "2" },
                "quantity": 10,
                "token": "ACME",
                "price": 34,
                "isPaid": false,
                "isTransferred": false,
            })
            const remainingOrder: IOrderInfo = await exchangeDb.getOrderInfoById("2")
            expect(remainingOrder.toJSON()).to.deep.equal({
                ...bareSellOrder,
                "quantity": 5,
            })
            expect(exchangeDb.getOrderInfoById("1")).to.eventually.throw(UnknownTraderError)
                .that.satisfies((error: UnknownTraderError) => error.id === "1")
            const remainingOrders: IAssignedOrderInfo[] = await exchangeDb.getOrders()
            expect(remainingOrders.length).to.equal(1)
            expect(remainingOrders[0].toJSON()).to.deep.equal({
                ...bareSellOrder,
                "id": "2",
                "quantity": 5,
            })
        })

        it("returns 200 when got a match, and got correct data, buyer has more", async () => {
            const bareBuyOrder: JSON = <JSON><unknown>{
                "isBuy": true,
                "quantity": 15,
                "token": "ACME",
                "price": 33,
            }
            await exchangeDb.setOrderInfo("1", new OrderInfo(bareBuyOrder))
            await exchangeDb.setOrderInfo("2", new OrderInfo(<JSON><unknown>{
                "isBuy": false,
                "quantity": 10,
                "token": "ACME",
                "price": 35,
            }))
            const { req, res } = createMocks({
                "method": "POST",
                "query": {
                    "buyerId": "1",
                    "sellerId": "2",
                }
            })

            await handleSettlements(req, res)

            expect(res._getStatusCode()).to.equal(200)
            const settlements: IFullSettlementInfo[] = await settlementDb.getSettlements()
            expect(settlements.length).to.equal(1)
            expect(JSON.parse(res._getData())).to.deep.equal({
                "id": settlements[0].id,
                "buyer": { "id": "1" },
                "seller": { "id": "2" },
                "quantity": 10,
                "token": "ACME",
                "price": 34,
                "isPaid": false,
                "isTransferred": false,
            })
            const remainingOrder: IOrderInfo = await exchangeDb.getOrderInfoById("1")
            expect(remainingOrder.toJSON()).to.deep.equal({
                ...bareBuyOrder,
                "quantity": 5,
            })
            expect(exchangeDb.getOrderInfoById("2")).to.eventually.throw(UnknownTraderError)
                .that.satisfies((error: UnknownTraderError) => error.id === "2")
            const remainingOrders: IAssignedOrderInfo[] = await exchangeDb.getOrders()
            expect(remainingOrders.length).to.equal(1)
            expect(remainingOrders[0].toJSON()).to.deep.equal({
                ...bareBuyOrder,
                "id": "1",
                "quantity": 5,
            })
        })

    })

})
