import { exists as existsAsync, promises as fsPromises } from "fs"
import { promisify } from "util"
import mockedEnv, { RestoreFn } from "mocked-env"
import { expect } from "chai"
import { createMocks } from "node-mocks-http"
import * as nextConfig from "../../next.config.js"
import { OrderInfo, OrderJson } from "../../src/orderInfo"
import { IExchangeDb } from "../../src/exchangeDb"
import exchangeDbFactory from "../../src/exchangeDbFactory"
import handleTrades from "../../pages/api/trades"

const exists = promisify(existsAsync)

describe("/api/trades Integration Tests", () => {
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

        it("returns empty on get without anything", async () => {
            const { req, res } = createMocks({
                method: "GET",
            })

            await handleTrades(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal([])
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
            })

            await handleTrades(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal([{
                id: "3",
                ...bareInfo,
            }])
        }).timeout(30000)

        it("returns the info on previously set double info", async () => {
            const bareInfo1: OrderJson = {
                isBuy: false,
                quantity: "12345",
                token: "ACME",
                price: "33",
                polymeshDid: safeHandsDid,
                portfolioId: "1",
            }
            const bareInfo2: OrderJson = {
                isBuy: true,
                quantity: "543",
                token: "ACME",
                price: "30",
                polymeshDid: onTrustDid,
                portfolioId: null,
            }
            await exchangeDb.setOrderInfo("3", new OrderInfo(bareInfo1))
            await exchangeDb.setOrderInfo("2", new OrderInfo(bareInfo2))
            const { req, res } = createMocks({
                method: "GET",
            })

            await handleTrades(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal([
                {
                    id: "2",
                    ...bareInfo2,
                },
                {
                    id: "3",
                    ...bareInfo1,
                },
            ])
        }).timeout(30000)

    })

})
