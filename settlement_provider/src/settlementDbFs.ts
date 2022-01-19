import { exists as existsAsync, promises as fsPromises } from "fs"
import { promisify } from "util"
import {
    FullSettlementInfo,
    IFullSettlementInfo,
    ISettlementInfo,
    SettlementInfo,
    SettlementJson,
} from "./settlementInfo"
import { ISettlementDb, UnknownSettlementError } from "./settlementDb"

const exists = promisify(existsAsync)

interface SettlementDbJson {
    ["string"]: SettlementJson
}

const getDb = async function (dbPath: string): Promise<SettlementDbJson> {
    if (!(await exists(dbPath))) {
        await saveDb(dbPath, JSON.parse("{}"))
    }
    return JSON.parse((await fsPromises.readFile(dbPath)).toString())
}
const saveDb = async function (dbPath: string, db: SettlementDbJson): Promise<void> {
    return fsPromises.writeFile(dbPath, JSON.stringify(db, null, 4))
}

export class SettlementDbFs implements ISettlementDb {

    constructor(public dbPath: string) {
    }

    async getSettlements(): Promise<IFullSettlementInfo[]> {
        const db: SettlementDbJson = await getDb(this.dbPath)
        return Object.entries(db)
            .map(([id, settlement]: [string, SettlementJson]) => new FullSettlementInfo({ ...settlement, id }))
            .reduce(
                (list: IFullSettlementInfo[], settlementInfo: IFullSettlementInfo) => [...list, settlementInfo],
                [])
    }

    async getSettlementInfoById(id: string): Promise<ISettlementInfo> {
        const info: SettlementJson = (await getDb(this.dbPath))[id]
        if (typeof info === "undefined") throw new UnknownSettlementError(id)
        return new SettlementInfo(info)
    }

    async setSettlementInfo(id: string, info: ISettlementInfo): Promise<void> {
        const db: SettlementDbJson = await getDb(this.dbPath)
        db[id] = info.toJSON()
        return saveDb(this.dbPath, db)
    }

    async deleteSettlementInfo(id: string): Promise<void> {
        const db: SettlementDbJson = await getDb(this.dbPath)
        delete db[id]
        return saveDb(this.dbPath, db)
    }

}
