import getConfig from 'next/config'
import { ISettlementDb } from "./settlementDb"
import { SettlementDbFs } from "./settlementDbFs"

export default async function (): Promise<ISettlementDb> {
    const { serverRuntimeConfig: { settlementDbPath } } = getConfig() || {
        serverRuntimeConfig: {
            settlementDbPath: process.env.SETTLEMENT_DB_PATH
        }
    }
    return Promise.resolve(new SettlementDbFs(settlementDbPath))
}
