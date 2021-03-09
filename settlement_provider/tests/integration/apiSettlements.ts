import { exists as existsAsync, promises as fsPromises } from "fs"
import { promisify } from "util"
import mockedEnv, { RestoreFn } from "mocked-env"
import { expect, use } from "chai"
import { createMocks } from "node-mocks-http"
import * as nextConfig from "../../next.config.js"
import { Polymesh } from "@polymathnetwork/polymesh-sdk"
import { IAssignedOrderInfo, IOrderInfo, OrderInfo } from "../../src/orderInfo"
import { IFullSettlementInfo, PublishedSettlementInfo, } from "../../src/settlementInfo"
import { IExchangeDb, UnknownTraderError } from "../../src/exchangeDb"
import { ISettlementDb } from "../../src/settlementDb"
import exchangeDbFactory from "../../src/exchangeDbFactory"
import settlementDbFactory from "../../src/settlementDbFactory"
import handleSettlements from "../../pages/api/settlements"
use(require("chai-as-promised"))

const exists = promisify(existsAsync)

describe("/api/settlements Integration Tests", () => {
    const {
        serverRuntimeConfig: { polymesh: {
            accountMnemonic,
        }, },
        publicRuntimeConfig: { polymesh: {
            nodeUrl, venueId, usdToken,
        }, },
    } = nextConfig

    let exchangeDbPath: string, settlementDbPath: string
    let exchangeDb: IExchangeDb, settlementDb: ISettlementDb
    let toRestore: RestoreFn
    let venueOwner: string

    beforeEach("mock env", async function() {
        this.timeout(20000)
        exchangeDbPath = `${__dirname}/dbStore_${Math.random() * 1000000}`
        settlementDbPath = `${__dirname}/dbStore_${Math.random() * 1000000}`
        toRestore = mockedEnv({
            "EXCHANGE_DB_PATH": exchangeDbPath,
            "SETTLEMENT_DB_PATH": settlementDbPath,
            "POLY_ACCOUNT_MNEMONIC": accountMnemonic,
            "POLY_NODE_URL": nodeUrl,
            "POLY_VENUE_ID": venueId,
            "POLY_USD_TOKEN": usdToken,
        })
        exchangeDb = await exchangeDbFactory()
        settlementDb = await settlementDbFactory()
        const api = await Polymesh.connect({
            nodeUrl,
            accountMnemonic,
        })
        venueOwner = (await api.getCurrentIdentity()).did
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
                "method": "GET",
            })

            await handleSettlements(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal({
                "settlements": [],
                "venue": {
                    "ownerDid": venueOwner,
                    "venueId": venueId,
                },
            })
        }).timeout(20000)

        it("returns the info on previously set info", async () => {
            const bareInfo: JSON = <JSON><unknown>{
                "buyer": {
                    "id": "1",
                    "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                    "portfolioId": "1",
                },
                "seller": {
                    "id": "2",
                    "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abce",
                },
                "quantity": 12345,
                "token": "ACME",
                "price": 33,
                "instructionId": "445",
                "isPaid": true,
                "isTransferred": false,
            }
            await settlementDb.setSettlementInfo("3", new PublishedSettlementInfo(bareInfo))
            const { req, res } = createMocks({
                "method": "GET",
            })

            await handleSettlements(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal({
                "settlements": [{
                    ...bareInfo,
                    "id": "3",
                }],
                "venue": {
                    "ownerDid": venueOwner,
                    "venueId": venueId,
                },
            })
        }).timeout(20000)

        it("returns the info on previously set double info", async () => {
            const bareInfo1: JSON = <JSON><unknown>{
                "buyer": {
                    "id": "1",
                    "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                    "portfolioId": "1",
                },
                "seller": {
                    "id": "2",
                    "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abce",
                },
                "quantity": 12345,
                "token": "ACME",
                "price": 33,
                "instructionId": "445",
                "isPaid": true,
                "isTransferred": false,
            }
            const bareInfo2: JSON = <JSON><unknown>{
                "buyer": {
                    "id": "3",
                    "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcf",
                    "portfolioId": "2",
                },
                "seller": {
                    "id": "2",
                    "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abce",
                },
                "quantity": 543,
                "token": "ACME",
                "price": 30,
                "instructionId": "446",
                "isPaid": false,
                "isTransferred": false,
            }
            await settlementDb.setSettlementInfo("3", new PublishedSettlementInfo(bareInfo1))
            await settlementDb.setSettlementInfo("2", new PublishedSettlementInfo(bareInfo2))
            const { req, res } = createMocks({
                "method": "GET",
            })

            await handleSettlements(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal({
                "settlements": [
                    {...bareInfo2, "id": "2"},
                    {...bareInfo1, "id": "3"},
                ],
                "venue": {
                    "ownerDid": venueOwner,
                    "venueId": venueId,
                },
            })
        }).timeout(20000)

        it("returns the filtered info on previously set double info", async () => {
            const bareInfo1: JSON = <JSON><unknown>{
                "buyer": {
                    "id": "1",
                    "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                    "portfolioId": "1",
                },
                "seller": {
                    "id": "2",
                    "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abce",
                },
                "quantity": 12345,
                "token": "ACME",
                "price": 33,
                "instructionId": "445",
                "isPaid": true,
                "isTransferred": false,
            }
            const bareInfo2: JSON = <JSON><unknown>{
                "buyer": {
                    "id": "3",
                    "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcf",
                    "portfolioId": "2",
                },
                "seller": {
                    "id": "2",
                    "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abce",
                },
                "quantity": 543,
                "token": "ACME",
                "price": 30,
                "instructionId": "446",
                "isPaid": false,
                "isTransferred": false,
            }
            await settlementDb.setSettlementInfo("3", new PublishedSettlementInfo(bareInfo1))
            await settlementDb.setSettlementInfo("2", new PublishedSettlementInfo(bareInfo2))
            const { req, res } = createMocks({
                "method": "GET",
                "query": {
                    "traderId": "1",
                },
            })

            await handleSettlements(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal({
                "settlements": [
                    {...bareInfo1, "id": "3"},
                ],
                "venue": {
                    "ownerDid": venueOwner,
                    "venueId": venueId,
                },
            })
        }).timeout(20000)

    })

    describe("GET for traderId", () => {

        it("returns empty on get without anything", async () => {
            const { req, res } = createMocks({
                "method": "GET",
            })

            await handleSettlements(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal({
                "settlements": [],
                "venue": {
                    "ownerDid": venueOwner,
                    "venueId": venueId,
                },
            })
        }).timeout(20000)

        it("returns the info on previously set info", async () => {
            const bareInfo: JSON = <JSON><unknown>{
                "buyer": {
                    "id": "1",
                    "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                    "portfolioId": "1",
                },
                "seller": {
                    "id": "2",
                    "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abce",
                },
                "quantity": 12345,
                "token": "ACME",
                "price": 33,
                "instructionId": "445",
                "isPaid": true,
                "isTransferred": false,
            }
            await settlementDb.setSettlementInfo("3", new PublishedSettlementInfo(bareInfo))
            const { req, res } = createMocks({
                "method": "GET",
            })

            await handleSettlements(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal({
                "settlements": [{
                    ...bareInfo,
                    "id": "3",
                }],
                "venue": {
                    "ownerDid": venueOwner,
                    "venueId": venueId,
                },
            })
        }).timeout(20000)

        it("returns the info on previously set double info", async () => {
            const bareInfo1: JSON = <JSON><unknown>{
                "buyer": {
                    "id": "1",
                    "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                    "portfolioId": "1",
                },
                "seller": {
                    "id": "2",
                    "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abce",
                },
                "quantity": 12345,
                "token": "ACME",
                "price": 33,
                "instructionId": "445",
                "isPaid": true,
                "isTransferred": false,
            }
            const bareInfo2: JSON = <JSON><unknown>{
                "buyer": {
                    "id": "3",
                    "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcf",
                    "portfolioId": "2",
                },
                "seller": {
                    "id": "2",
                    "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abce",
                },
                "quantity": 543,
                "token": "ACME",
                "price": 30,
                "instructionId": "446",
                "isPaid": false,
                "isTransferred": false,
            }
            await settlementDb.setSettlementInfo("3", new PublishedSettlementInfo(bareInfo1))
            await settlementDb.setSettlementInfo("2", new PublishedSettlementInfo(bareInfo2))
            const { req, res } = createMocks({
                "method": "GET",
            })

            await handleSettlements(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal({
                "settlements": [
                    {...bareInfo2, "id": "2"},
                    {...bareInfo1, "id": "3"},
                ],
                "venue": {
                    "ownerDid": venueOwner,
                    "venueId": venueId,
                },
            })
        }).timeout(20000)

    })

    describe("POST", () => {

        it("returns 404 on missing buy order", async () => {
            await exchangeDb.setOrderInfo("2", new OrderInfo({
                "isBuy": false,
                "quantity": 10,
                "token": "ACME",
                "price": 33,
                "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                "portfolioId": "1",
            } as unknown as JSON))
            const { req, res } = createMocks({
                "method": "POST",
                "query": {
                    "buyerId": "1",
                    "sellerId": "2",
                },
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
                "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                "portfolioId": "1",
            } as unknown as JSON))
            const { req, res } = createMocks({
                "method": "POST",
                "query": {
                    "buyerId": "1",
                    "sellerId": "2",
                },
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
                "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                "portfolioId": "1",
            } as unknown as JSON))
            await exchangeDb.setOrderInfo("2", new OrderInfo({
                "isBuy": true,
                "quantity": 15,
                "token": "ACME",
                "price": 40,
                "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
            } as unknown as JSON))
            const { req, res } = createMocks({
                "method": "POST",
                "query": {
                    "buyerId": "1",
                    "sellerId": "2",
                },
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
                "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                "portfolioId": "1",
            } as unknown as JSON))
            await exchangeDb.setOrderInfo("2", new OrderInfo({
                "isBuy": false,
                "quantity": 15,
                "token": "ECMN",
                "price": 40,
                "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abce",
            } as unknown as JSON))
            const { req, res } = createMocks({
                "method": "POST",
                "query": {
                    "buyerId": "1",
                    "sellerId": "2",
                },
            })

            await handleSettlements(req, res)

            expect(res._getStatusCode()).to.equal(400)
            expect(JSON.parse(res._getData())).to.deep.equal({"status": "Orders are not for same token, ACME / ECMN"})
        })

        it.skip("returns 200 when got a match, and got correct data, seller has more", async () => {
            await exchangeDb.setOrderInfo("1", new OrderInfo(<JSON><unknown>{
                "isBuy": true,
                "quantity": 10,
                "token": "ACME",
                "price": 33,
                "polymeshDid": "0x83b568242707705274952d4ccaf30b1e3f066bd9ad2b93cb9c82e9da5245fb78",
                "portfolioId": "1",
            }))
            const bareSellOrder: JSON = <JSON><unknown>{
                "isBuy": false,
                "quantity": 15,
                "token": "ACME",
                "price": 35,
                "polymeshDid": "0x4b0be33fbd1d4ee719bd902e1ee5de6ad6faa1a2558f141488df53482b5c974e",
            }
            await exchangeDb.setOrderInfo("2", new OrderInfo(bareSellOrder))
            const { req, res } = createMocks({
                "method": "POST",
                "query": {
                    "buyerId": "1",
                    "sellerId": "2",
                },
            })

            await handleSettlements(req, res)

            expect(res._getStatusCode()).to.equal(200)
            const settlements: IFullSettlementInfo[] = await settlementDb.getSettlements()
            expect(settlements.length).to.equal(1)
            expect(JSON.parse(res._getData())).to.deep.equal({
                "id": settlements[0].id,
                "buyer": {
                    "id": "1",
                    "polymeshDid": "0x83b568242707705274952d4ccaf30b1e3f066bd9ad2b93cb9c82e9da5245fb78",
                    "portfolioId": "1",
                },
                "seller": {
                    "id": "2",
                    "polymeshDid": "0x4b0be33fbd1d4ee719bd902e1ee5de6ad6faa1a2558f141488df53482b5c974e",
                },
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
        }).timeout(20000)

        it.skip("returns 200 when got a match, and got correct data, buyer has more", async () => {
            const bareBuyOrder: JSON = <JSON><unknown>{
                "isBuy": true,
                "quantity": 15,
                "token": "ACME",
                "price": 33,
                "polymeshDid": "0x83b568242707705274952d4ccaf30b1e3f066bd9ad2b93cb9c82e9da5245fb78",
                "portfolioId": "1",
            }
            await exchangeDb.setOrderInfo("1", new OrderInfo(bareBuyOrder))
            await exchangeDb.setOrderInfo("2", new OrderInfo(<JSON><unknown>{
                "isBuy": false,
                "quantity": 10,
                "token": "ACME",
                "price": 35,
                "polymeshDid": "0x4b0be33fbd1d4ee719bd902e1ee5de6ad6faa1a2558f141488df53482b5c974e",
            }))
            const { req, res } = createMocks({
                "method": "POST",
                "query": {
                    "buyerId": "1",
                    "sellerId": "2",
                },
            })

            await handleSettlements(req, res)

            expect(res._getStatusCode()).to.equal(200)
            const settlements: IFullSettlementInfo[] = await settlementDb.getSettlements()
            expect(settlements.length).to.equal(1)
            expect(JSON.parse(res._getData())).to.deep.equal({
                "id": settlements[0].id,
                "buyer": {
                    "id": "1",
                    "polymeshDid": "0x83b568242707705274952d4ccaf30b1e3f066bd9ad2b93cb9c82e9da5245fb78",
                    "portfolioId": "1",
                },
                "seller": {
                    "id": "2",
                    "polymeshDid": "0x4b0be33fbd1d4ee719bd902e1ee5de6ad6faa1a2558f141488df53482b5c974e",
                },
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
        }).timeout(20000)

    })

})
