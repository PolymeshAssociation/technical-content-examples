import { exists as existsAsync, promises as fsPromises } from "fs"
import { promisify } from "util"
import {
    AssignedOrderInfo,
    IAssignedOrderInfo,
    IOrderInfo,
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

    constructor(public dbPath: string) {
    }

    async getOrders(): Promise<IAssignedOrderInfo[]> {
        const db: ExchangeDbJson = (await getDb(this.dbPath))
        return Object.entries(db)
            .map(([id, trade]) => new AssignedOrderInfo({ ...trade, id }))
            .reduce(
                (list, tradeInfo) => [...list, tradeInfo],
                [])
    }

    async getOrderInfoById(id: string): Promise<IOrderInfo> {
        const info: OrderJson = (await getDb(this.dbPath))[id]
        if (typeof info === "undefined") throw new UnknownTraderError(id)
        return new OrderInfo(info)
    }

    async setOrderInfo(id: string, info: IOrderInfo): Promise<void> {
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
