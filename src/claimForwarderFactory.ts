import getConfig from "next/config"
import { IClaimForwarder } from "./claimForwarder"
import { ClaimForwarderPoly } from "./claimForwarderPoly"
import { Polymesh } from "@polymathnetwork/polymesh-sdk"

export default async function(): Promise<IClaimForwarder> {
    const { 
        serverRuntimeConfig: { polymesh: {
            accountUri,
            middlewareLink,
            middlewareKey
        } },
        publicRuntimeConfig: { polymesh: {
            nodeUrl
        } }
    } = getConfig() || {
        "serverRuntimeConfig": { polymesh: {
            "accountUri": process.env.POLY_ACCOUNT_URI,
            "middlewareLink": process.env.MIDDLEWARE_LINK,
            "middlewareKey": process.env.MIDDLEWARE_KEY
        } },
        "publicRuntimeConfig": { polymesh: {
            "nodeUrl": process.env.POLY_NODE_URL
        } }
    }
    const api = await Polymesh.connect({
        nodeUrl,
        accountUri,
        middleware: {
            link: middlewareLink,
            key: middlewareKey
        },
    })
    return new ClaimForwarderPoly(api)
}