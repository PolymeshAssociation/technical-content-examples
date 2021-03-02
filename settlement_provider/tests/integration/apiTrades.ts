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
            "EXCHANGE_DB_PATH": dbPath
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
                "method": "GET"
            })

            await handleTrades(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal([])
        })
    
        it("returns the info on previously set info", async () => {
            await exchangeDb.setOrderInfo("3", new OrderInfo({
                "isBuy": false,
                "quantity": 12345,
                "token": "ACME",
                "price": 33,
            } as unknown as JSON))
            const { req, res } = createMocks({
                "method": "GET"
            })

            await handleTrades(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal([{
                "id": "3",
                "isBuy": false,
                "quantity": 12345,
                "token": "ACME",
                "price": 33,
            }])
        })
    
        it("returns the info on previously set double info", async () => {
            await exchangeDb.setOrderInfo("3", new OrderInfo({
                "isBuy": false,
                "quantity": 12345,
                "token": "ACME",
                "price": 33,
            } as unknown as JSON))
            await exchangeDb.setOrderInfo("2", new OrderInfo({
                "isBuy": true,
                "quantity": 543,
                "token": "ACME",
                "price": 30,
            } as unknown as JSON))
            const { req, res } = createMocks({
                "method": "GET"
            })

            await handleTrades(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal([
                {
                    "id": "2",
                    "isBuy": true,
                    "quantity": 543,
                    "token": "ACME",
                    "price": 30,
                },
                {
                    "id": "3",
                    "isBuy": false,
                    "quantity": 12345,
                    "token": "ACME",
                    "price": 33,
                }
            ])
        })

    })

})
