import { exists as existsAsync, promises as fsPromises } from "fs"
import { promisify } from "util"
import mockedEnv, { RestoreFn } from "mocked-env"
import { expect } from "chai"
import { createMocks } from "node-mocks-http"
import { OrderInfo } from "../../src/orderInfo"
import { IExchangeDb } from "../../src/exchangeDb"
import exchangeDbFactory from "../../src/exchangeDbFactory"
import handleTrades from "../../pages/api/trades"

const exists = promisify(existsAsync)

describe("/api/trades Integration Tests", () => {
    let dbPath: string
    let exchangeDb: IExchangeDb
    let toRestore: RestoreFn

    beforeEach("mock env", async() => {
        dbPath = `${__dirname}/dbStore_${Math.random() * 1000000}`
        toRestore = mockedEnv({
            "EXCHANGE_DB_PATH": dbPath,
        })
        exchangeDb = await exchangeDbFactory()
    })

    afterEach("restore env", async() => {
        toRestore()
        if (await exists(dbPath)) {
            await fsPromises.unlink(dbPath)
        }
    })

    describe("GET", () => {

        it("returns empty on get without anything", async () => {
            const { req, res } = createMocks({
                "method": "GET",
            })

            await handleTrades(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal([])
        })

        it("returns the info on previously set info", async () => {
            const bareInfo: JSON = <JSON><unknown>{
                "isBuy": false,
                "quantity": 12345,
                "token": "ACME",
                "price": 33,
                "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                "portfolioId": "1",
            }
            await exchangeDb.setOrderInfo("3", new OrderInfo(bareInfo))
            const { req, res } = createMocks({
                "method": "GET",
            })

            await handleTrades(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal([{
                "id": "3",
                ...bareInfo,
            }])
        })

        it("returns the info on previously set double info", async () => {
            const bareInfo1: JSON = <JSON><unknown>{
                "isBuy": false,
                "quantity": 12345,
                "token": "ACME",
                "price": 33,
                "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                "portfolioId": "1",
            }
            const bareInfo2: JSON = <JSON><unknown>{
                "isBuy": true,
                "quantity": 543,
                "token": "ACME",
                "price": 30,
                "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abce",
            }
            await exchangeDb.setOrderInfo("3", new OrderInfo(bareInfo1))
            await exchangeDb.setOrderInfo("2", new OrderInfo(bareInfo2))
            const { req, res } = createMocks({
                "method": "GET",
            })

            await handleTrades(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal([
                {
                    "id": "2",
                    ...bareInfo2,
                },
                {
                    "id": "3",
                    ...bareInfo1,
                },
            ])
        })

    })

})
