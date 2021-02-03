import { exists as existsAsync, promises as fsPromises } from "fs"
import { promisify } from "util"
import { ICustomerInfo, CustomerInfo } from "./customerInfo"
import { ICustomerDb } from "./customerDb"

const exists = promisify(existsAsync)

const getDb = async function(dbPath: string): Promise<JSON> {
    if (!(await exists(dbPath))) {
        await saveDb(dbPath, JSON.parse("{}"))
    }
    return JSON.parse((await fsPromises.readFile(dbPath)).toString())
}
const saveDb = async function(dbPath: string,db: JSON): Promise<void> {
    return fsPromises.writeFile(dbPath, JSON.stringify(db))
}

export class CustomerDbFs implements ICustomerDb {

    private dbPath: string

    constructor(dbPath: string) {
        this.dbPath = dbPath
    }

    async getCustomerInfoById(id: string): Promise<CustomerInfo> {
        return new CustomerInfo((await getDb(this.dbPath))[id])
    }

    async setCustomerInfo(id: string, info: ICustomerInfo): Promise<void> {
        const db = await getDb(this.dbPath)
        db[id] = info.toJSON()
        return saveDb(this.dbPath, db)
    }

}