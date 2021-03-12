import getConfig from "next/config"
import { Polymesh } from "@polymathnetwork/polymesh-sdk"
import { ISettlementEngine } from "./settlementEngine"
import { SettlementEnginePoly } from "./settlementEnginePoly"

export default async function (): Promise<ISettlementEngine> {
    const {
        serverRuntimeConfig: { polymesh: {
            accountMnemonic,
            middlewareLink,
            middlewareKey,
        }, },
        publicRuntimeConfig: { polymesh: {
            nodeUrl,
            venueId,
            usdToken,
        }, },
    } = getConfig() || {
        "serverRuntimeConfig": {
            polymesh: {
                "accountMnemonic": process.env.POLY_ACCOUNT_MNEMONIC,
                "middlewareLink": process.env.MIDDLEWARE_LINK,
                "middlewareKey": process.env.MIDDLEWARE_KEY,
            },
        },
        "publicRuntimeConfig": {
            polymesh: {
                "nodeUrl": process.env.POLY_NODE_URL,
                "venueId": process.env.POLY_VENUE_ID,
                "usdToken": process.env.POLY_USD_TOKEN,
            },
        },
    }
    return new SettlementEnginePoly(
        async () => Polymesh.connect({
            nodeUrl,
            accountMnemonic,
            middleware: {
                link: middlewareLink,
                key: middlewareKey,
            },
        }),
        venueId,
        usdToken)
}
