import getConfig from 'next/config'
import { Polymesh } from '@polymathnetwork/polymesh-sdk'
import { IExchangeDb } from "./exchangeDb"
import { ExchangeDbFs } from "./exchangeDbFs"

export default async function (): Promise<IExchangeDb> {
    const {
        serverRuntimeConfig: {
            exchangeDbPath,
            polymesh: { accountMnemonic, },
        },
        publicRuntimeConfig: { polymesh: {
            nodeUrl,
        }, },
    } = getConfig() || {
        "serverRuntimeConfig": {
            "exchangeDbPath": process.env.EXCHANGE_DB_PATH,
            polymesh: {
                "accountMnemonic": process.env.POLY_ACCOUNT_MNEMONIC,
            },
        },
        "publicRuntimeConfig": {
            polymesh: {
                "nodeUrl": process.env.POLY_NODE_URL,
            },
        },
    }
    return new ExchangeDbFs(
        exchangeDbPath,
        async () => Polymesh.connect({
            nodeUrl,
            accountMnemonic,
        })
    )
}
