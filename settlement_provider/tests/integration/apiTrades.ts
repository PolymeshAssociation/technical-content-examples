import { promises as fsPromises } from "fs"
import mockedEnv, { RestoreFn } from "mocked-env"
import { expect } from "chai"
import { createMocks } from "node-mocks-http"
import handleTraderId from "../../pages/api/trader/[id]"
import handleTrades from "../../pages/api/trades"

describe("/api/trades Integration Tests", () => {
    let dbPath: string
    let toRestore: RestoreFn

    beforeEach("mock env", async() => {
        dbPath = `${__dirname}/dbStore_${Math.random() * 1000000}`
        toRestore = mockedEnv({
            "EXCHANGE_DB_PATH": dbPath
        })
    })
    
    afterEach("restore env", async() => {
        toRestore()
        await fsPromises.unlink(dbPath)
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
            {
                const { req, res } = createMocks({
                    "method": "PUT",
                    "query": {
                        "id": "3",
                    },
                    "body": {
                        "isBuy": false,
                        "quantity": 12345,
                        "token": "ACME",
                        "price": 33,
                    }
                })
                await handleTraderId(req, res)
            }
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
            {
                const { req, res } = createMocks({
                    "method": "PUT",
                    "query": {
                        "id": "3",
                    },
                    "body": {
                        "isBuy": false,
                        "quantity": 12345,
                        "token": "ACME",
                        "price": 33,
                    }
                })
                await handleTraderId(req, res)
            }
            {
                const { req, res } = createMocks({
                    "method": "PUT",
                    "query": {
                        "id": "2",
                    },
                    "body": {
                        "isBuy": true,
                        "quantity": 543,
                        "token": "ACME",
                        "price": 30,
                    }
                })
                await handleTraderId(req, res)
            }
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
