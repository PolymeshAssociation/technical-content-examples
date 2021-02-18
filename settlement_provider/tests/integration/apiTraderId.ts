import { promises as fsPromises } from "fs"
import mockedEnv, { RestoreFn } from "mocked-env"
import { expect } from "chai"
import { createMocks } from "node-mocks-http"
import handleTraderId from "../../pages/api/trader/[id]"

describe("/api/trader/[id] Integration Tests", () => {
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
        await fsPromises.unlink(dbPath).catch(e => {})
    })
    
    describe("GET", () => {
    
        it("returns 404 on get unknown", async () => {
            const { req, res } = createMocks({
                "method": "GET",
                "query": {
                    "id": "3",
                }
            })

            await handleTraderId(req, res)

            expect(res._getStatusCode()).to.equal(404)
            expect(JSON.parse(res._getData())).to.deep.equal({"status": "not found"})
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
                "method": "GET",
                "query": {
                    "id": "3",
                }
            })

            await handleTraderId(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal({
                "isBuy": false,
                "quantity": 12345,
                "token": "ACME",
                "price": 33,
            })
        })

    })

    describe("PUT", () => {
    
        it("returns 200 on set info", async () => {
            const { req, res } = createMocks({
                "method": "PUT",
                "query": {
                    "id": "4",
                },
                "body": {
                    "isBuy": false,
                    "quantity": 12345,
                    "token": "ACME",
                    "price": 33,
                }
            })

            await handleTraderId(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal({"status": "ok"})
        })
    
        it("returns 400 on set info missing isBuy", async () => {
            const { req, res } = createMocks({
                "method": "PUT",
                "query": {
                    "id": "4",
                },
                "body": {
                    "quantity": 12345,
                    "token": "ACME",
                    "price": 33,
                }
            })

            await handleTraderId(req, res)

            expect(res._getStatusCode()).to.equal(400)
            expect(JSON.parse(res._getData())).to.deep.equal({"status": "missing field isBuy"})
        })
    
        it("returns 400 on set info wrong type isBuy", async () => {
            const { req, res } = createMocks({
                "method": "PUT",
                "query": {
                    "id": "4",
                },
                "body": {
                    "isBuy": "true",
                    "quantity": 12345,
                    "token": "ACME",
                    "price": 33,
                    }
            })

            await handleTraderId(req, res)

            expect(res._getStatusCode()).to.equal(400)
            expect(JSON.parse(res._getData())).to.deep.equal({"status": "wrong type string on field isBuy"})
        })
    
        it("returns 400 on set 0 quantity", async () => {
            const { req, res } = createMocks({
                "method": "PUT",
                "query": {
                    "id": "4",
                },
                "body": {
                    "isBuy": true,
                    "quantity": 0,
                    "token": "ACME",
                    "price": 33,
                    }
            })

            await handleTraderId(req, res)

            expect(res._getStatusCode()).to.equal(400)
            expect(JSON.parse(res._getData())).to.deep.equal({"status": "cannot have 0 quantity"})
        })
    
        it("returns 400 on set 0 price", async () => {
            const { req, res } = createMocks({
                "method": "PUT",
                "query": {
                    "id": "4",
                },
                "body": {
                    "isBuy": true,
                    "quantity": 12345,
                    "token": "ACME",
                    "price": 0,
                    }
            })

            await handleTraderId(req, res)

            expect(res._getStatusCode()).to.equal(400)
            expect(JSON.parse(res._getData())).to.deep.equal({"status": "cannot have 0 price"})
        })

    })

    describe("DELETE", () => {
    
        it("returns 200 on delete existing info", async () => {
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
                "method": "DELETE",
                "query": {
                    "id": "3",
                }
            })

            await handleTraderId(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal({"status": "ok"})
        })
    
        it("info no longer accessible after delete", async () => {
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
                    "method": "DELETE",
                    "query": {
                        "id": "3",
                    }
                })
                await handleTraderId(req, res)
            }
            const { req, res } = createMocks({
                "method": "GET",
                "query": {
                    "id": "3",
                }
            })
            await handleTraderId(req, res)
            
            expect(res._getStatusCode()).to.equal(404)
            expect(JSON.parse(res._getData())).to.deep.equal({"status": "not found"})
        })
    
        it("returns 200 on delete missing info", async () => {
            const { req, res } = createMocks({
                "method": "DELETE",
                "query": {
                    "id": "4",
                }
            })

            await handleTraderId(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal({"status": "ok"})
        })

    })

})
