import { exists as existsAsync, promises as fsPromises } from "fs"
import { promisify } from "util"
import { describe } from "mocha"
import { expect, use } from "chai"
import { BigNumber, Polymesh } from "@polymathnetwork/polymesh-sdk"
import { Portfolios } from "@polymathnetwork/polymesh-sdk/api/entities/Identity/Portfolios"
import { Context, DefaultPortfolio, NumberedPortfolio } from "@polymathnetwork/polymesh-sdk/internal"
import { Identity, } from "@polymathnetwork/polymesh-sdk/types"
import {
    IAssignedOrderInfo,
    InvalidPortfolioError,
    IOrderInfo,
    NonExistentCustomerPolymeshIdError,
    OrderInfo,
    OrderJson,
} from "../../src/orderInfo"
import { IExchangeDb, UnknownTraderError } from "../../src/exchangeDb"
import { ExchangeDbFs } from "../../src/exchangeDbFs"
use(require("chai-as-promised"))

const exists = promisify(existsAsync)

describe("ExchangeDbFs Unit Tests", () => {
    let dbPath: string
    let mockedApi: Polymesh
    let exchangeDb: IExchangeDb

    beforeEach("prepare dbStore", async function () {
        this.timeout(30000)
        dbPath = `${__dirname}/dbStore_${Math.random() * 1000000}`
        mockedApi = <Polymesh><unknown>{}
        exchangeDb = new ExchangeDbFs(dbPath, async () => mockedApi)
    })

    afterEach("clear dbStore", async () => {
        if (await exists(dbPath)) {
            await fsPromises.unlink(dbPath)
        }
    })

    interface MockedIdentity {
        did: string
        portfolios: string[]
    }

    const findMockedIdentity = (identities: MockedIdentity[], identity: string | Identity): MockedIdentity => {
        return identities
            .find((mockedIdentity: MockedIdentity) => mockedIdentity.did === (typeof identity === "string" ? identity : identity.did))
    }

    const createIdentity = (mockedIdentity: MockedIdentity): Identity => {
        const did: string = mockedIdentity.did
        return <Identity><unknown>{
            did: did,
            portfolios: <Portfolios><unknown>{
                getPortfolios: async () => {
                    const portfolios: [DefaultPortfolio, ...NumberedPortfolio[]] = [
                        new DefaultPortfolio({ did }, <Context><unknown>{})]
                    mockedIdentity.portfolios.forEach((portfolioId: string) => portfolios.push(new NumberedPortfolio(
                        { did, id: new BigNumber(portfolioId) },
                        <Context><unknown>{})))
                    return portfolios
                }
            }
        }
    }

    const buildMockedApi = (identities: MockedIdentity[]) => {
        mockedApi.isIdentityValid = ({ identity }) => Promise.resolve(typeof findMockedIdentity(identities, identity) !== "undefined")
        mockedApi.getIdentity = async ({ did }) => createIdentity(findMockedIdentity(identities, did))
    }

    it("throws when missing id", async () => {
        await expect(exchangeDb.getOrderInfoById("1")).to.eventually.be
            .rejectedWith(UnknownTraderError)
            .that.satisfies((error: UnknownTraderError) => error.id === "1")
    })

    it("can save order info in an empty db", async () => {
        buildMockedApi([{
            did: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
            portfolios: ["1", "2"],
        }])
        const bareInfo: OrderJson = {
            isBuy: true,
            quantity: "12345",
            token: "ACME",
            price: "33",
            polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
            portfolioId: "1",
        }
        await exchangeDb.setOrderInfo("1", new OrderInfo(bareInfo))
    })

    it("can save order info with default portfolio being the only one", async () => {
        buildMockedApi([{
            did: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
            portfolios: [],
        }])
        const bareInfo: OrderJson = <OrderJson><unknown>{
            isBuy: true,
            quantity: "12345",
            token: "ACME",
            price: "33",
            polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
        }
        await exchangeDb.setOrderInfo("1", new OrderInfo(bareInfo))
    })

    it("can save order info with default portfolio being one of them", async () => {
        buildMockedApi([{
            did: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
            portfolios: ["1"],
        }])
        const bareInfo: OrderJson = {
            isBuy: true,
            quantity: "12345",
            token: "ACME",
            price: "33",
            polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
            portfolioId: null,
        }
        await exchangeDb.setOrderInfo("1", new OrderInfo(bareInfo))
    })

    it("cannot save order info with non-existent identity", async () => {
        buildMockedApi([{
            did: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
            portfolios: ["1", "2"],
        }])
        const bareInfo: OrderJson = {
            isBuy: true,
            quantity: "12345",
            token: "ACME",
            price: "33",
            polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abce",
            portfolioId: "1",
        }
        await expect(exchangeDb.setOrderInfo("1", new OrderInfo(bareInfo))).to.be.eventually.rejected
            .that.satisfies((error: NonExistentCustomerPolymeshIdError) => error.polymeshDid === "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abce")
    })

    it("cannot save order info with non-existent portfolio", async () => {
        buildMockedApi([{
            did: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
            portfolios: ["1", "2"],
        }])
        const bareInfo: OrderJson = {
            isBuy: true,
            quantity: "12345",
            token: "ACME",
            price: "33",
            polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
            portfolioId: "3",
        }
        await expect(exchangeDb.setOrderInfo("1", new OrderInfo(bareInfo))).to.be.eventually.rejected
            .that.satisfies((error: InvalidPortfolioError) =>
                error.polymeshDid === "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd" &&
                error.portfolioId.toString(10) === "3")
    })

    it("can get saved order info", async () => {
        buildMockedApi([{
            did: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
            portfolios: ["1", "2"],
        }])
        const bareInfo: OrderJson = {
            isBuy: true,
            quantity: "12345",
            token: "ACME",
            price: "33",
            polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
            portfolioId: "1",
        }
        await exchangeDb.setOrderInfo("1", new OrderInfo(bareInfo))

        const retrieved: IOrderInfo = await exchangeDb.getOrderInfoById("1")
        expect(retrieved.toJSON()).to.deep.equal(bareInfo)
    })

    it("can save and get 2 saved order infos", async () => {
        buildMockedApi([
            {
                did: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                portfolios: ["1"],
            },
            {
                did: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abce",
                portfolios: ["1", "2"],
            },
        ])
        const bareInfo1: OrderJson = {
            isBuy: true,
            quantity: "12345",
            token: "ACME",
            price: "33",
            polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
            portfolioId: "1",
        }
        const bareInfo2: OrderJson = {
            isBuy: false,
            quantity: "667",
            token: "ACME",
            price: "30",
            polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abce",
            portfolioId: "2",
        }

        await exchangeDb.setOrderInfo("1", new OrderInfo(bareInfo1))
        await exchangeDb.setOrderInfo("2", new OrderInfo(bareInfo2))

        const retrieved1: IOrderInfo = await exchangeDb.getOrderInfoById("1")
        const retrieved2: IOrderInfo = await exchangeDb.getOrderInfoById("2")
        expect(retrieved1.toJSON()).to.deep.equal(bareInfo1)
        expect(retrieved2.toJSON()).to.deep.equal(bareInfo2)
    })

    it("can save and get the 2 saved order infos together", async () => {
        buildMockedApi([
            {
                did: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                portfolios: ["1"],
            },
            {
                did: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abce",
                portfolios: ["1", "2"],
            },
        ])
        const bareInfo1: OrderJson = {
            isBuy: true,
            quantity: "12345",
            token: "ACME",
            price: "33",
            polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
            portfolioId: '1',
        }
        const bareInfo2: OrderJson = {
            isBuy: false,
            quantity: "667",
            token: "ACME",
            price: "30",
            polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abce",
            portfolioId: "2",
        }

        await exchangeDb.setOrderInfo("1", new OrderInfo(bareInfo1))
        await exchangeDb.setOrderInfo("2", new OrderInfo(bareInfo2))

        const retrieved: IAssignedOrderInfo[] = await exchangeDb.getOrders()
        expect(retrieved[0].toJSON()).to.deep.equal({ ...bareInfo1, id: "1" })
        expect(retrieved[1].toJSON()).to.deep.equal({ ...bareInfo2, id: "2" })
    })

    it("can delete 1 of 2 saved order infos", async () => {
        buildMockedApi([
            {
                did: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                portfolios: ["1"],
            },
            {
                did: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
                portfolios: ["3", "2"],
            },
        ])
        const bareInfo1: OrderJson = {
            isBuy: true,
            quantity: "12345",
            token: "ACME",
            price: "33",
            polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
            portfolioId: "1",
        }
        const bareInfo2: OrderJson = {
            isBuy: false,
            quantity: "667",
            token: "ACME",
            price: "30",
            polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
            portfolioId: "3",
        }
        await exchangeDb.setOrderInfo("1", new OrderInfo(bareInfo1))
        await exchangeDb.setOrderInfo("2", new OrderInfo(bareInfo2))
        await exchangeDb.deleteOrderInfoById("2")

        const retrieved1: IOrderInfo = await exchangeDb.getOrderInfoById("1")
        expect(retrieved1.toJSON()).to.deep.equal(bareInfo1)

        await expect(exchangeDb.getOrderInfoById("2")).to.eventually.be
            .rejectedWith(UnknownTraderError)
            .that.satisfies((error: UnknownTraderError) => error.id === "2")
    })

})
