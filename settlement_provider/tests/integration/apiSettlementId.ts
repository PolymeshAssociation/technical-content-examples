import { exists as existsAsync, promises as fsPromises } from "fs"
import { promisify } from "util"
import mockedEnv, { RestoreFn } from "mocked-env"
import { expect } from "chai"
import { createMocks } from "node-mocks-http"
import { IPublishedSettlementInfo, PublishedSettlementInfo, PublishedSettlementJson, } from "../../src/settlementInfo"
import { ISettlementDb } from "../../src/settlementDb"
import settlementDbFactory from "../../src/settlementDbFactory"
import handleSettlementId from "../../pages/api/settlement/[id]"

const exists = promisify(existsAsync)

describe("/api/settlement/[id] Integration Tests", () => {
    let dbPath: string
    let settlementDb: ISettlementDb
    let toRestore: RestoreFn

    beforeEach("mock env", async () => {
        dbPath = `${__dirname}/dbStore_${Math.random() * 1000000}`
        toRestore = mockedEnv({
            SETTLEMENT_DB_PATH: dbPath,
        })
        settlementDb = await settlementDbFactory()
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

            await handleSettlementId(req, res)

            expect(res._getStatusCode()).to.equal(404)
            expect(JSON.parse(res._getData())).to.deep.equal({ status: "not found" })
        })

        it("returns the info on previously set info", async () => {
            const bareInfo: PublishedSettlementJson = {
                buyer: {
                    id: "1",
                    polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                    portfolioId: "1",
                },
                seller: {
                    id: "2",
                    polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
                    portfolioId: null,
                },
                quantity: "12345",
                token: "ACME",
                price: "33",
                instructionId: "445",
                isPaid: true,
                isTransferred: false,
            }
            await settlementDb.setSettlementInfo("3", new PublishedSettlementInfo(bareInfo))
            const { req, res } = createMocks({
                method: "GET",
                query: {
                    id: "3",
                },
            })

            await handleSettlementId(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal(bareInfo)
        })

    })

    describe("PUT", () => {

        it("returns 200 on set info and has saved", async () => {
            const bareInfo: PublishedSettlementJson = {
                buyer: {
                    id: "1",
                    polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                    portfolioId: "1",
                },
                seller: {
                    id: "2",
                    polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
                    portfolioId: null,
                },
                quantity: "12345",
                token: "ACME",
                price: "33",
                instructionId: "445",
                isPaid: true,
                isTransferred: false,
            }
            const { req, res } = createMocks({
                method: "PUT",
                query: {
                    id: "4",
                },
                body: bareInfo,
            })

            await handleSettlementId(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal({ status: "ok" })
            const retrieved: IPublishedSettlementInfo = await settlementDb.getSettlementInfoById("4")
            expect(retrieved.toJSON()).to.deep.equal(bareInfo)
        })

        it("returns 400 on set info missing seller", async () => {
            const { req, res } = createMocks({
                method: "PUT",
                query: {
                    id: "4",
                },
                body: {
                    buyer: {
                        id: "1",
                        polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                        portfolioId: "1",
                    },
                    quantity: "12345",
                    token: "ACME",
                    price: "33",
                    instructionId: "445",
                    isPaid: true,
                    isTransferred: false,
                },
            })

            await handleSettlementId(req, res)

            expect(res._getStatusCode()).to.equal(400)
            expect(JSON.parse(res._getData())).to.deep.equal({ status: "missing field seller" })
        })

        it("returns 400 on set info wrong type seller", async () => {
            const { req, res } = createMocks({
                method: "PUT",
                query: {
                    id: "4",
                },
                body: {
                    buyer: {
                        id: "1",
                        polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                        portfolioId: "1",
                    },
                    seller: "2",
                    quantity: "12345",
                    token: "ACME",
                    price: "33",
                    instructionId: "445",
                    isPaid: true,
                    isTransferred: false,
                },
            })

            await handleSettlementId(req, res)

            expect(res._getStatusCode()).to.equal(400)
            expect(JSON.parse(res._getData())).to.deep.equal({ status: "wrong type string on field seller" })
        })

        it("returns 400 on set info same buyer and seller id", async () => {
            const { req, res } = createMocks({
                method: "PUT",
                query: {
                    id: "4",
                },
                body: {
                    buyer: {
                        id: "1",
                        polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                        portfolioId: "1",
                    },
                    seller: {
                        id: "1",
                        polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
                        portfolioId: null,
                    },
                    quantity: "12345",
                    token: "ACME",
                    price: "33",
                    instructionId: "445",
                    isPaid: true,
                    isTransferred: false,
                },
            })

            await handleSettlementId(req, res)

            expect(res._getStatusCode()).to.equal(400)
            expect(JSON.parse(res._getData())).to.deep.equal({ status: "same buyer and seller: 1" })
        })

        it("returns 400 on set info same buyer and seller polymeshDid", async () => {
            const { req, res } = createMocks({
                method: "PUT",
                query: {
                    id: "4",
                },
                body: {
                    buyer: {
                        id: "1",
                        polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                        portfolioId: "1",
                    },
                    seller: {
                        id: "2",
                        polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                        portfolioId: null,
                    },
                    quantity: "12345",
                    token: "ACME",
                    price: "33",
                    instructionId: "445",
                    isPaid: true,
                    isTransferred: false,
                }
            })

            await handleSettlementId(req, res)

            expect(res._getStatusCode()).to.equal(400)
            expect(JSON.parse(res._getData())).to.deep.equal({
                status: "same buyer and seller: 0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd"
            })
        })

    })

    describe("PATCH", () => {

        it("returns 200 on update isPaid and has saved", async () => {
            const bareInfo: PublishedSettlementJson = {
                buyer: {
                    id: "1",
                    polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                    portfolioId: "1",
                },
                seller: {
                    id: "2",
                    polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
                    portfolioId: null,
                },
                quantity: "12345",
                token: "ACME",
                price: "33",
                instructionId: "445",
                isPaid: false,
                isTransferred: false,
            }
            await settlementDb.setSettlementInfo("3", new PublishedSettlementInfo(bareInfo))
            const { req, res } = createMocks({
                method: "PATCH",
                query: {
                    id: "3",
                    isPaid: "",
                },
            })

            await handleSettlementId(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal({ status: "ok" })
            const retrieved: IPublishedSettlementInfo = await settlementDb.getSettlementInfoById("3")
            expect(retrieved.toJSON()).to.deep.equal({
                ...bareInfo,
                isPaid: true
            })
        })

        it("returns 200 on update isTransferred and has saved", async () => {
            const bareInfo: PublishedSettlementJson = {
                buyer: {
                    id: "1",
                    polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                    portfolioId: "1",
                },
                seller: {
                    id: "2",
                    polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
                    portfolioId: null,
                },
                quantity: "12345",
                token: "ACME",
                price: "33",
                instructionId: "445",
                isPaid: false,
                isTransferred: false,
            }
            await settlementDb.setSettlementInfo("3", new PublishedSettlementInfo(bareInfo))
            const { req, res } = createMocks({
                method: "PATCH",
                query: {
                    id: "3",
                    isTransferred: "",
                },
            })

            await handleSettlementId(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal({ status: "ok" })
            const retrieved: IPublishedSettlementInfo = await settlementDb.getSettlementInfoById("3")
            expect(retrieved.toJSON()).to.deep.equal({
                ...bareInfo,
                isTransferred: true
            })
        })

        it("returns 200 on update isPaid and isTransferred and has saved", async () => {
            const bareInfo: PublishedSettlementJson = {
                buyer: {
                    id: "1",
                    polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                    portfolioId: "1",
                },
                seller: {
                    id: "2",
                    polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
                    portfolioId: null,
                },
                quantity: "12345",
                token: "ACME",
                price: "33",
                instructionId: "445",
                isPaid: false,
                isTransferred: false,
            }
            await settlementDb.setSettlementInfo("3", new PublishedSettlementInfo(bareInfo))
            const { req, res } = createMocks({
                method: "PATCH",
                query: {
                    id: "3",
                    isTransferred: "",
                    isPaid: "",
                },
            })

            await handleSettlementId(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal({ status: "ok" })
            const retrieved: IPublishedSettlementInfo = await settlementDb.getSettlementInfoById("3")
            expect(retrieved.toJSON()).to.deep.equal({
                ...bareInfo,
                isPaid: true,
                isTransferred: true
            })
        })

        it("returns 400 on update nothing to do", async () => {
            const bareInfo: PublishedSettlementJson = {
                buyer: {
                    id: "1",
                    polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                    portfolioId: "1",
                },
                seller: {
                    id: "2",
                    polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
                    portfolioId: null,
                },
                quantity: "12345",
                token: "ACME",
                price: "33",
                instructionId: "445",
                isPaid: true,
                isTransferred: false,
            }
            await settlementDb.setSettlementInfo("3", new PublishedSettlementInfo(bareInfo))
            const { req, res } = createMocks({
                method: "PATCH",
                query: {
                    id: "3",
                },
            })
            await handleSettlementId(req, res)

            expect(res._getStatusCode()).to.equal(400)
            expect(JSON.parse(res._getData())).to.deep.equal({ status: "no action found for 3" })
        })

        it("returns 404 on unknown settlement", async () => {
            const bareInfo: PublishedSettlementJson = {
                buyer: {
                    id: "1",
                    polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                    portfolioId: "1",
                },
                seller: {
                    id: "2",
                    polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
                    portfolioId: null,
                },
                quantity: "12345",
                token: "ACME",
                price: "33",
                instructionId: "445",
                isPaid: true,
                isTransferred: false,
            }
            await settlementDb.setSettlementInfo("3", new PublishedSettlementInfo(bareInfo))
            const { req, res } = createMocks({
                method: "PATCH",
                query: {
                    id: "4",
                    isPaid: "",
                },
            })

            await handleSettlementId(req, res)

            expect(res._getStatusCode()).to.equal(404)
            expect(JSON.parse(res._getData())).to.deep.equal({ status: "not found" })
        })

    })

})
