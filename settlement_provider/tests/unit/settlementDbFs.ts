import { exists as existsAsync, promises as fsPromises } from "fs"
import { promisify } from "util"
import { describe } from "mocha"
import { expect, use } from "chai"
import {
    IFullSettlementInfo,
    ISettlementInfo,
    SettlementInfo,
    SettlementJson,
} from "../../src/settlementInfo"
import { SettlementDbFs } from "../../src/settlementDbFs"
import { ISettlementDb } from "../../src/settlementDb"
use(require("chai-as-promised"))

const exists = promisify(existsAsync)

describe("SettlementDbFs Unit Tests", () => {
    let dbPath: string
    let settlementDb: ISettlementDb

    beforeEach("prepare dbStore", async () => {
        dbPath = `${__dirname}/dbStore_${Math.random() * 1000000}`
        settlementDb = new SettlementDbFs(dbPath)
    })

    afterEach("clear dbStore", async () => {
        if (await exists(dbPath)) {
            await fsPromises.unlink(dbPath)
        }
    })

    it("throws when missing id", async () => {
        await expect(settlementDb.getSettlementInfoById("1"))
            .to.eventually.throw
    })

    it("can save settlement info in an empty db", async () => {
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

        await settlementDb.setSettlementInfo("1", new SettlementInfo(bareInfo))
    })

    it("can get saved settlement info", async () => {
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

        await settlementDb.setSettlementInfo("1", new SettlementInfo(bareInfo))

        const retrieved: SettlementInfo = await settlementDb.getSettlementInfoById("1")
        expect(retrieved.toJSON()).to.deep.equal(bareInfo)
    })

    it("can save and get 2 saved settlement infos", async () => {
        const bareInfo1: SettlementJson = {
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
        const bareInfo2: SettlementJson = {
            buyer: {
                id: "3",
            },
            seller: {
                id: "2",
            },
            quantity: "667",
            token: "ACME",
            price: "30",
            isPaid: false,
            isTransferred: false,
        }

        await settlementDb.setSettlementInfo("1", new SettlementInfo(bareInfo1))
        await settlementDb.setSettlementInfo("2", new SettlementInfo(bareInfo2))

        const retrieved1: ISettlementInfo = await settlementDb.getSettlementInfoById("1")
        const retrieved2: ISettlementInfo = await settlementDb.getSettlementInfoById("2")
        expect(retrieved1.toJSON()).to.deep.equal(bareInfo1)
        expect(retrieved2.toJSON()).to.deep.equal(bareInfo2)
    })

    it("can save and get the 2 saved settlement infos together", async () => {
        const bareInfo1: SettlementJson = {
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
        const bareInfo2: SettlementJson = {
            buyer: {
                id: "3",
            },
            seller: {
                id: "2",
            },
            quantity: "667",
            token: "ACME",
            price: "30",
            isPaid: false,
            isTransferred: false,
        }

        await settlementDb.setSettlementInfo("1", new SettlementInfo(bareInfo1))
        await settlementDb.setSettlementInfo("2", new SettlementInfo(bareInfo2))

        const retrieved: IFullSettlementInfo[] = await settlementDb.getSettlements()
        expect(retrieved[0].toJSON()).to.deep.equal({ ...bareInfo1, id: "1" })
        expect(retrieved[1].toJSON()).to.deep.equal({ ...bareInfo2, id: "2" })
    })

})
