import { exists as existsAsync, promises as fsPromises } from "fs"
import { promisify } from "util"
import mockedEnv, { RestoreFn } from "mocked-env"
import { expect } from "chai"
import { createMocks } from "node-mocks-http"
import { OrderInfo, OrderJson } from "../../src/orderInfo"
import { IExchangeDb } from "../../src/exchangeDb"
import exchangeDbFactory from "../../src/exchangeDbFactory"
import handleTraderId from "../../pages/api/trader/[id]"

const exists = promisify(existsAsync)

describe("/api/trader/[id] Integration Tests", () => {
    let dbPath: string
    let exchangeDb: IExchangeDb
    let toRestore: RestoreFn

    beforeEach("mock env", async () => {
        dbPath = `${__dirname}/dbStore_${Math.random() * 1000000}`
        toRestore = mockedEnv({
            EXCHANGE_DB_PATH: dbPath,
        })
        exchangeDb = await exchangeDbFactory()
    })

    afterEach("restore env", async () => {
        toRestore()
        if (await exists(dbPath)) {
            await fsPromises.unlink(dbPath)
        }
    })

    describe("GET", () => {

        it("returns 404 on get unknown", async () => {
            const { req, res } = createMocks({
                method: "GET",
                query: {
                    id: "3",
                },
            })

            await handleTraderId(req, res)

            expect(res._getStatusCode()).to.equal(404)
            expect(JSON.parse(res._getData())).to.deep.equal({ status: "not found" })
        })

        it("returns the info on previously set info", async () => {
            const bareInfo: OrderJson = {
                isBuy: false,
                quantity: "12345",
                token: "ACME",
                price: "33",
            }
            await exchangeDb.setOrderInfo("3", new OrderInfo(bareInfo))
            const { req, res } = createMocks({
                method: "GET",
                query: {
                    id: "3",
                },
            })

            await handleTraderId(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal(bareInfo)
        })

    })

    describe("PUT", () => {

        it("returns 200 on set info and has saved", async () => {
            const bareInfo: OrderJson = {
                isBuy: false,
                quantity: "12345",
                token: "ACME",
                price: "33",
            }
            const { req, res } = createMocks({
                method: "PUT",
                query: {
                    id: "4",
                },
                body: bareInfo,
            })

            await handleTraderId(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal({ status: "ok" })
            const order = await exchangeDb.getOrderInfoById("4")
            expect(order.toJSON()).to.deep.equal(bareInfo)
        })

        it("returns 400 on set info missing isBuy", async () => {
            const { req, res } = createMocks({
                method: "PUT",
                query: {
                    id: "4",
                },
                body: {
                    quantity: "12345",
                    token: "ACME",
                    price: "33",
                },
            })

            await handleTraderId(req, res)

            expect(res._getStatusCode()).to.equal(400)
            expect(JSON.parse(res._getData())).to.deep.equal({ status: "missing field isBuy" })
        })

        it("returns 400 on set info wrong type isBuy", async () => {
            const { req, res } = createMocks({
                method: "PUT",
                query: {
                    id: "4",
                },
                body: {
                    isBuy: "true",
                    quantity: "12345",
                    token: "ACME",
                    price: "33",
                },
            })

            await handleTraderId(req, res)

            expect(res._getStatusCode()).to.equal(400)
            expect(JSON.parse(res._getData())).to.deep.equal({ status: "wrong type string on field isBuy" })
        })

        it("returns 400 on set 0 quantity", async () => {
            const { req, res } = createMocks({
                method: "PUT",
                query: {
                    id: "4",
                },
                body: {
                    isBuy: true,
                    quantity: "0",
                    token: "ACME",
                    price: "33",
                },
            })

            await handleTraderId(req, res)

            expect(res._getStatusCode()).to.equal(400)
            expect(JSON.parse(res._getData())).to.deep.equal({ status: "cannot have 0 quantity" })
        })

        it("returns 400 on set 0 price", async () => {
            const { req, res } = createMocks({
                method: "PUT",
                query: {
                    id: "4",
                },
                body: {
                    isBuy: true,
                    quantity: "12345",
                    token: "ACME",
                    price: "0",
                },
            })

            await handleTraderId(req, res)

            expect(res._getStatusCode()).to.equal(400)
            expect(JSON.parse(res._getData())).to.deep.equal({ status: "cannot have 0 price" })
        })

    })

    describe("DELETE", () => {

        it("returns 200 on delete existing info and no longer accessible", async () => {
            await exchangeDb.setOrderInfo("3", new OrderInfo({
                isBuy: false,
                quantity: "12345",
                token: "ACME",
                price: "33",
            }))
            const { req, res } = createMocks({
                method: "DELETE",
                query: {
                    id: "3",
                },
            })

            await handleTraderId(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal({ status: "ok" })
            expect(await exchangeDb.getOrders()).to.be.empty
        })

        it("returns 200 on delete missing info", async () => {
            const { req, res } = createMocks({
                method: "DELETE",
                query: {
                    id: "4",
                },
            })

            await handleTraderId(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal({ status: "ok" })
        })

    })

})
