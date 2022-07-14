import { exists as existsAsync, promises as fsPromises } from "fs"
import { promisify } from "util"
import { Polymesh } from "@polymathnetwork/polymesh-sdk"
import {
    Identity,
    NumberedPortfolio,
} from "@polymathnetwork/polymesh-sdk/types"
import { isNumberedPortfolio, PolymeshCreator } from "./types"
import {
    AssignedOrderInfo,
    IAssignedOrderInfo,
    InvalidPortfolioError,
    IOrderInfo,
    NonExistentCustomerPolymeshIdError,
    OrderInfo,
    OrderJson,
} from "./orderInfo"
import { IExchangeDb, UnknownTraderError } from "./exchangeDb"

const exists = promisify(existsAsync)

interface ExchangeDbJson {
    ["string"]: OrderJson
}

const getDb = async function (dbPath: string): Promise<ExchangeDbJson> {
    if (!(await exists(dbPath))) {
        await saveDb(dbPath, JSON.parse("{}"))
    }
    return JSON.parse((await fsPromises.readFile(dbPath)).toString())
}
const saveDb = async function (dbPath: string, db: ExchangeDbJson): Promise<void> {
    return fsPromises.writeFile(dbPath, JSON.stringify(db, null, 4))
}

export class ExchangeDbFs implements IExchangeDb {

    private api?: Polymesh | null = null

    constructor(public dbPath: string, public apiCreator: PolymeshCreator) {
    }

    async getOrders(): Promise<IAssignedOrderInfo[]> {
        const db: ExchangeDbJson = await getDb(this.dbPath)
        return Object.entries(db)
            .map(([id, trade]: [string, OrderJson]) => new AssignedOrderInfo({ ...trade, id }))
            .reduce(
                (list: IAssignedOrderInfo[], tradeInfo: IAssignedOrderInfo) => [...list, tradeInfo],
                [])
    }

    async getOrderInfoById(id: string): Promise<IOrderInfo> {
        const info: OrderJson = (await getDb(this.dbPath))[id]
        if (typeof info === "undefined") throw new UnknownTraderError(id)
        return new OrderInfo(info)
    }

    async setOrderInfo(id: string, info: IOrderInfo): Promise<void> {
        this.api = this.api || await this.apiCreator()
        if (!(await this.api.isIdentityValid({ identity: info.polymeshDid }))) {
            throw new NonExistentCustomerPolymeshIdError(info.polymeshDid)
        }
        if (info.portfolioId !== null) {
            const trader: Identity = await this.api.getIdentity({ did: info.polymeshDid })
            const found: NumberedPortfolio = (await trader.portfolios.getPortfolios())
                .filter(isNumberedPortfolio)
                .find((portfolio: NumberedPortfolio) => portfolio.id.isEqualTo(info.portfolioId))
            if (typeof found === "undefined" || found === null) {
                throw new InvalidPortfolioError(info.polymeshDid, info.portfolioId)
            }
        }
        const db: ExchangeDbJson = await getDb(this.dbPath)
        db[id] = info.toJSON()
        return saveDb(this.dbPath, db)
    }

    async deleteOrderInfoById(id: string): Promise<void> {
        const db: ExchangeDbJson = await getDb(this.dbPath)
        delete db[id]
        return saveDb(this.dbPath, db)
    }

}
