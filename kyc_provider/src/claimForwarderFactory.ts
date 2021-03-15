import getConfig from "next/config"
import { IClaimForwarder } from "./claimForwarder"
import { ClaimForwarderPoly } from "./claimForwarderPoly"
import { Polymesh } from "@polymathnetwork/polymesh-sdk"

export default async function(): Promise<IClaimForwarder> {
    const {
        serverRuntimeConfig: { polymesh: {
            accountMnemonic,
        }, },
        publicRuntimeConfig: { polymesh: {
            nodeUrl,
            middlewareLink,
            middlewareKey,
        }, },
    } = getConfig() || {
        serverRuntimeConfig: { polymesh: {
            accountMnemonic: process.env.POLY_ACCOUNT_MNEMONIC,
        }, },
        publicRuntimeConfig: { polymesh: {
            nodeUrl: process.env.POLY_NODE_URL,
            middlewareLink: process.env.MIDDLEWARE_LINK,
            middlewareKey: process.env.MIDDLEWARE_KEY,
        }, },
    }
    const api = await Polymesh.connect({
        nodeUrl,
        accountMnemonic,
        middleware: {
            link: middlewareLink,
            key: middlewareKey,
        },
    })
    return new ClaimForwarderPoly(api)
}
