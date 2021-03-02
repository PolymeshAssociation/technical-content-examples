import getConfig from 'next/config'
import { IExchangeDb } from "./exchangeDb"
import { ExchangeDbFs } from "./exchangeDbFs"

export default async function(): Promise<IExchangeDb> {
    const { serverRuntimeConfig: { exchangeDbPath } } = getConfig() || {
        "serverRuntimeConfig": {
            "exchangeDbPath": process.env.EXCHANGE_DB_PATH
        }
    }
    return Promise.resolve(new ExchangeDbFs(exchangeDbPath))
}