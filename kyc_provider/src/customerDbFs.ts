import { exists as existsAsync, promises as fsPromises } from "fs"
import { promisify } from "util"
import { ICustomerInfo, CustomerInfo, CustomerJson, } from "./customerInfo"
import { ICustomerDb, UnknownCustomerError } from "./customerDb"

const exists = promisify(existsAsync)

interface ExchangeDbJson {
    ["string"]: CustomerJson
}

const getDb = async function (dbPath: string): Promise<CustomerJson> {
    if (!(await exists(dbPath))) {
        await saveDb(dbPath, JSON.parse("{}"))
    }
    return JSON.parse((await fsPromises.readFile(dbPath)).toString())
}
const saveDb = async function (dbPath: string, db: CustomerJson): Promise<void> {
    return fsPromises.writeFile(dbPath, JSON.stringify(db, null, 4))
}

export class CustomerDbFs implements ICustomerDb {

    constructor(public dbPath: string) {
    }

    async getCustomerInfoById(id: string): Promise<CustomerInfo> {
        const info: CustomerJson = (await getDb(this.dbPath))[id]
        if (typeof info === "undefined") throw new UnknownCustomerError(id)
        return new CustomerInfo(info)
    }

    async setCustomerInfo(id: string, info: ICustomerInfo): Promise<void> {
        const db: CustomerJson = await getDb(this.dbPath)
        db[id] = info.toJSON()
        return saveDb(this.dbPath, db)
    }

}
