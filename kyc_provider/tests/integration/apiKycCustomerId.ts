import { promises as fsPromises } from "fs"
import mockedEnv, { RestoreFn } from "mocked-env"
import { expect } from "chai"
import { createMocks } from "node-mocks-http"
import handleKycCustomerId from "../../pages/api/kycCustomer/[id]"

describe("/api/kycCustomer/[id] Integration Tests", () => {
    let dbPath: string
    let toRestore: RestoreFn

    beforeEach("mock env", async() => {
        dbPath = `${__dirname}/dbStore_${Math.random() * 1000000}`
        toRestore = mockedEnv({
            "KYC_DB_PATH": dbPath
        })
    })
    
    afterEach("restore env", async() => {
        toRestore()
        await fsPromises.unlink(dbPath)
    })
    
    describe("GET", () => {
    
        it("returns 404 on get unknown", async () => {
            const { req, res } = createMocks({
                "method": "GET",
                "query": {
                    "id": "3",
                }
            })

            await handleKycCustomerId(req, res)

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
                        "name": "John Doe",
                        "country": "Gb",
                        "passport": "12345",
                        "valid": false,
                    }
                })
                await handleKycCustomerId(req, res)
            }
            const { req, res } = createMocks({
                "method": "GET",
                "query": {
                    "id": "3",
                }
            })

            await handleKycCustomerId(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal({
                "name": "John Doe",
                "country": "Gb",
                "passport": "12345",
                "valid": false,
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
                    "name": "John Doe",
                    "country": "Gb",
                    "passport": "12345",
                    "valid": true,
                }
            })

            await handleKycCustomerId(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal({"status": "ok"})
        })
    
        it("returns 200 on set info missing valid", async () => {
            {
                    const { req, res } = createMocks({
                    "method": "PUT",
                    "query": {
                        "id": "4",
                    },
                    "body": {
                        "name": "John Doe",
                        "country": "Gb",
                        "passport": "12345",
                    }
                })

                await handleKycCustomerId(req, res)

                expect(res._getStatusCode()).to.equal(200)
                expect(JSON.parse(res._getData())).to.deep.equal({"status": "ok"})
            }
            const { req, res } = createMocks({
                "method": "GET",
                "query": {
                    "id": "4",
                }
            })

            await handleKycCustomerId(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal({
                "name": "John Doe",
                "country": "Gb",
                "passport": "12345",
                "valid": false,
            })
        })

    })

    describe("PATCH", () => {
    
        it("returns 404 on patch unknown", async () => {
            const { req, res } = createMocks({
                "method": "PATCH",
                "query": {
                    "id": "3",
                },
                "body": {
                    "passport": "12346",
                    "valid": false,
                }
            })

            await handleKycCustomerId(req, res)

            expect(res._getStatusCode()).to.equal(404)
            expect(JSON.parse(res._getData())).to.deep.equal({"status": "not found"})
        })
    
        it("returns 200 on patch existing info", async () => {
            {
                const { req, res } = createMocks({
                    "method": "PUT",
                    "query": {
                        "id": "3",
                    },
                    "body": {
                        "name": "John Doe",
                        "country": "Gb",
                        "passport": "12345",
                        "valid": true,
                    }
                })
                await handleKycCustomerId(req, res)
            }
            {
                const { req, res } = createMocks({
                    "method": "PATCH",
                    "query": {
                        "id": "3",
                    },
                    "body": {
                        "passport": "12346",
                        "valid": false,
                    }
                })

                await handleKycCustomerId(req, res)

                expect(res._getStatusCode()).to.equal(200)
                expect(JSON.parse(res._getData())).to.deep.equal({"status": "ok"})
            }
            const { req, res } = createMocks({
                "method": "GET",
                "query": {
                    "id": "3",
                }
            })

            await handleKycCustomerId(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal({
                "name": "John Doe",
                "country": "Gb",
                "passport": "12346",
                "valid": false,
            })
        })

    })

})
