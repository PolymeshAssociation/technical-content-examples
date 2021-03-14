import { exists as existsAsync, promises as fsPromises } from "fs"
import { promisify } from "util"
import mockedEnv, { RestoreFn } from "mocked-env"
import { expect } from "chai"
import { createMocks } from "node-mocks-http"
import {
    IFullSettlementInfo,
    ISettlementInfo,
    SettlementInfo,
    SettlementJson,
} from "../../src/settlementInfo"
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
            const bareInfo: SettlementJson = {
                buyer: {
                    id: "1",
                },
                seller: {
                    id: "2",
                },
                quantity: "12345",
                token: "ACME",
                price: "33",
                isPaid: true,
                isTransferred: false,
            }
            await settlementDb.setSettlementInfo("3", new SettlementInfo(bareInfo))
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

    describe("DELETE", () => {

        it("returns 200 on delete the only info and has saved", async () => {
            const bareInfo: SettlementJson = {
                buyer: {
                    id: "1",
                },
                seller: {
                    id: "2",
                },
                quantity: "12345",
                token: "ACME",
                price: "33",
                isPaid: true,
                isTransferred: false,
            }
            await settlementDb.setSettlementInfo("4", new SettlementInfo(bareInfo))
            const { req, res } = createMocks({
                method: "DELETE",
                query: {
                    id: "4",
                },
            })

            await handleSettlementId(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal({ status: "ok" })
            const retrieved: IFullSettlementInfo[] = await settlementDb.getSettlements()
             expect(retrieved).to.deep.equal([])
        })

        it("returns 200 on delete non-existent info and has unchanged", async () => {
            const bareInfo: SettlementJson = {
                buyer: {
                    id: "1",
                },
                seller: {
                    id: "2",
                },
                quantity: "12345",
                 token: "ACME",
                 price: "33",
                 isPaid: true,
                 isTransferred: false,
             }
             await settlementDb.setSettlementInfo("4", new SettlementInfo(bareInfo))
            const { req, res } = createMocks({
                method: "DELETE",
                query: {
                    id: "3",
                },
            })

            await handleSettlementId(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal({ status: "ok" })
            const retrieved: IFullSettlementInfo[] = await settlementDb.getSettlements()
            expect(retrieved.length).to.equal(1)
            expect(retrieved[0].toJSON()).to.deep.equal({
                id: "4",
                ...bareInfo,
            })
        })

        it("returns 200 on delete one info out of two", async () => {
            const bareInfo4: SettlementJson = {
                buyer: {
                    id: "1",
                },
                seller: {
                    id: "2",
                },
                quantity: "12345",
                token: "ACME",
                price: "33",
                isPaid: true,
                isTransferred: false,
            }
            const bareInfo3: SettlementJson = {
                buyer: {
                    id: "1",
                },
                seller: {
                    id: "3",
                },
                quantity: "12346",
                token: "ACME",
                price: "34",
                isPaid: false,
                isTransferred: false,
            }
            await settlementDb.setSettlementInfo("4", new SettlementInfo(bareInfo4))
            await settlementDb.setSettlementInfo("3", new SettlementInfo(bareInfo3))
            const { req, res } = createMocks({
                method: "DELETE",
                query: {
                    id: "4",
                },
            })

            await handleSettlementId(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal({ status: "ok" })
            const retrieved: IFullSettlementInfo[] = await settlementDb.getSettlements()
            expect(retrieved.length).to.equal(1)
            expect(retrieved[0].toJSON()).to.deep.equal({
                id: "3",
                ...bareInfo3,
            })
        })

    })

    describe("PATCH", () => {

        it("returns 200 on update isPaid and has saved", async () => {
            const bareInfo: SettlementJson = {
                buyer: {
                    id: "1",
                },
                seller: {
                    id: "2",
                },
                quantity: "12345",
                token: "ACME",
                price: "33",
                isPaid: false,
                isTransferred: false,
            }
            await settlementDb.setSettlementInfo("3", new SettlementInfo(bareInfo))
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
            const retrieved: ISettlementInfo = await settlementDb.getSettlementInfoById("3")
            expect(retrieved.toJSON()).to.deep.equal({ ...bareInfo, isPaid: true })
        })

        it("returns 200 on update isTransferred and has saved", async () => {
            const bareInfo: SettlementJson = {
                buyer: {
                    id: "1",
                },
                seller: {
                    id: "2",
                },
                quantity: "12345",
                token: "ACME",
                price: "33",
                isPaid: false,
                isTransferred: false,
            }
            await settlementDb.setSettlementInfo("3", new SettlementInfo(bareInfo))
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
            const retrieved: ISettlementInfo = await settlementDb.getSettlementInfoById("3")
            expect(retrieved.toJSON()).to.deep.equal({ ...bareInfo, isTransferred: true })
        })

        it("returns 200 on update isPaid and isTransferred and has saved", async () => {
            const bareInfo: SettlementJson = {
                buyer: {
                    id: "1",
                },
                seller: {
                    id: "2",
                },
                quantity: "12345",
                token: "ACME",
                price: "33",
                isPaid: false,
                isTransferred: false,
            }
            await settlementDb.setSettlementInfo("3", new SettlementInfo(bareInfo))
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
            const retrieved: ISettlementInfo = await settlementDb.getSettlementInfoById("3")
            expect(retrieved.toJSON()).to.deep.equal({ ...bareInfo, isPaid: true, isTransferred: true })
        })

        it("returns 400 on update nothing to do", async () => {
            const bareInfo: SettlementJson = {
                buyer: {
                    id: "1",
                },
                seller: {
                    id: "2",
                },
                quantity: "12345",
                token: "ACME",
                price: "33",
                isPaid: true,
                isTransferred: false,
            }
            await settlementDb.setSettlementInfo("3", new SettlementInfo(bareInfo))
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
            const bareInfo: SettlementJson = {
                buyer: {
                    id: "1",
                },
                seller: {
                    id: "2",
                },
                quantity: "12345",
                token: "ACME",
                price: "33",
                isPaid: true,
                isTransferred: false,
            }
            await settlementDb.setSettlementInfo("3", new SettlementInfo(bareInfo))
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
