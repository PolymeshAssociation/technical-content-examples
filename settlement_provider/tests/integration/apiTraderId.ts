import { exists as existsAsync, promises as fsPromises } from "fs"
import { promisify } from "util"
import mockedEnv, { RestoreFn } from "mocked-env"
import { expect } from "chai"
import { createMocks } from "node-mocks-http"
import * as nextConfig from "../../next.config.js"
import { OrderInfo, OrderJson } from "../../src/orderInfo"
import { IExchangeDb } from "../../src/exchangeDb"
import exchangeDbFactory from "../../src/exchangeDbFactory"
import handleTraderId from "../../pages/api/trader/[id]"

const exists = promisify(existsAsync)

describe("/api/trader/[id] Integration Tests", () => {
    const onTrustDid = "0x4b0be33fbd1d4ee719bd902e1ee5de6ad6faa1a2558f141488df53482b5c974e"
    const safeHandsDid = "0x83b568242707705274952d4ccaf30b1e3f066bd9ad2b93cb9c82e9da5245fb78"
    const {
        serverRuntimeConfig: { polymesh: {
            accountMnemonic,
        }, },
        publicRuntimeConfig: { polymesh: {
            nodeUrl,
        }, },
    } = nextConfig
    let dbPath: string
    let exchangeDb: IExchangeDb
    let toRestore: RestoreFn

    beforeEach("mock env", async function () {
        this.timeout(30000)
        dbPath = `${__dirname}/dbStore_${Math.random() * 1000000}`
        toRestore = mockedEnv({
            EXCHANGE_DB_PATH: dbPath,
            POLY_NODE_URL: nodeUrl,
            POLY_ACCOUNT_MNEMONIC: accountMnemonic,
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
        }).timeout(30000)

        it("returns the info on previously set info", async () => {
            const bareInfo: OrderJson = {
                isBuy: false,
                quantity: "12345",
                token: "ACME",
                price: "33",
                polymeshDid: safeHandsDid,
                portfolioId: "1",
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
        }).timeout(30000)

    })

    describe("PUT", () => {

        it("returns 200 on set info and has saved", async () => {
            const bareInfo: OrderJson = {
                isBuy: false,
                quantity: "12345",
                token: "ACME",
                price: "33",
                polymeshDid: safeHandsDid,
                portfolioId: "1",
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
        }).timeout(30000)

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
                    polymeshDid: safeHandsDid,
                    portfolioId: "1",
                },
            })

            await handleTraderId(req, res)

            expect(res._getStatusCode()).to.equal(400)
            expect(JSON.parse(res._getData())).to.deep.equal({ status: "missing field isBuy" })
        }).timeout(30000)

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
                    polymeshDid: onTrustDid,
                },
            })

            await handleTraderId(req, res)

            expect(res._getStatusCode()).to.equal(400)
            expect(JSON.parse(res._getData())).to.deep.equal({ status: "wrong type string on field isBuy" })
        }).timeout(30000)

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
                    polymeshDid: safeHandsDid,
                    portfolioId: "1",
                },
            })

            await handleTraderId(req, res)

            expect(res._getStatusCode()).to.equal(400)
            expect(JSON.parse(res._getData())).to.deep.equal({ status: "cannot have 0 quantity" })
        }).timeout(30000)

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
                    polymeshDid: safeHandsDid,
                    portfolioId: "1",
                },
            })

            await handleTraderId(req, res)

            expect(res._getStatusCode()).to.equal(400)
            expect(JSON.parse(res._getData())).to.deep.equal({ status: "cannot have 0 price" })
        }).timeout(30000)

        it("returns 400 on set bad polymeshId", async () => {
            const wrongId = "0x".padEnd(65, "0")
            const { req, res } = createMocks({
                method: "PUT",
                query: {
                    id: "4",
                },
                body: {
                    isBuy: true,
                    quantity: "12345",
                    token: "ACME",
                    price: "33",
                    polymeshDid: wrongId,
                    portfolioId: "1",
                }
            })

            await handleTraderId(req, res)

            expect(res._getStatusCode()).to.equal(400)
            expect(JSON.parse(res._getData()))
                .to.deep.equal({ status: `wrong polymeshId ${wrongId}` })
        }).timeout(30000)

        it("returns 400 on set non-existent polymeshId", async () => {
            const wrongId = "0x".padEnd(66, "0")
            const { req, res } = createMocks({
                method: "PUT",
                query: {
                    id: "4",
                },
                body: {
                    isBuy: true,
                    quantity: "12345",
                    token: "ACME",
                    price: "33",
                    polymeshDid: wrongId,
                    portfolioId: "1",
                }
            })

            await handleTraderId(req, res)

            expect(res._getStatusCode()).to.equal(400)
            expect(JSON.parse(res._getData()))
                .to.deep.equal({ status: `non-existent polymeshId ${wrongId}` })
        }).timeout(30000)

        it("returns 400 on set non-existent portfolio", async () => {
            const { req, res } = createMocks({
                method: "PUT",
                query: {
                    id: "4",
                },
                body: {
                    isBuy: true,
                    quantity: "12345",
                    token: "ACME",
                    price: "33",
                    polymeshDid: onTrustDid,
                    portfolioId: "1",
                }
            })

            await handleTraderId(req, res)

            expect(res._getStatusCode()).to.equal(400)
            expect(JSON.parse(res._getData()))
                .to.deep.equal({ status: `non-existent portfolio ${onTrustDid}-1` })
        }).timeout(30000)

        it("returns 200 on set info and missing portfolio", async () => {
            const bareInfo: OrderJson = {
                isBuy: false,
                quantity: "12345",
                token: "ACME",
                price: "33",
                polymeshDid: onTrustDid,
                portfolioId: null,
            }
            const { req, res } = createMocks({
                method: "PUT",
                query: {
                    id: "4",
                },
                body: bareInfo
            })

            await handleTraderId(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal({ status: "ok" })
            const order = await exchangeDb.getOrderInfoById("4")
            expect(order.toJSON()).to.deep.equal(bareInfo)
        }).timeout(30000)

    })

    describe("DELETE", () => {

        it("returns 200 on delete existing info and no longer accessible", async () => {
            await exchangeDb.setOrderInfo("3", new OrderInfo({
                isBuy: false,
                quantity: "12345",
                token: "ACME",
                price: "33",
                polymeshDid: safeHandsDid,
                portfolioId: "1",
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
        }).timeout(30000)

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
        }).timeout(30000)

    })

})
