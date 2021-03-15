import { NextApiRequest, NextApiResponse } from "next"
import ClaimForwarderFactory from "../../src/claimForwarderFactory"
import { IClaimForwarder, NonExistentKycIdentityError } from "../../src/claimForwarder"
import { Identity } from "@polymathnetwork/polymesh-sdk/internal"

async function getKycProviderInfo(req: NextApiRequest): Promise<JSON> {
    const claimForwarder: IClaimForwarder = await ClaimForwarderFactory()
    const providerDid: Identity = await claimForwarder.getServiceProviderIdentity()
    return <JSON><unknown>{
        did: providerDid.did
    }
}

export default async function (req: NextApiRequest, res: NextApiResponse<object | JSON>): Promise<any> {
    try {
        switch (req.method) {
            case "GET":
                res.status(200).json(await getKycProviderInfo(req))
                break
            default:
                res.status(405).end()
        }
    } catch (e) {
        if (e instanceof NonExistentKycIdentityError) {
            res.status(500).json({ status: "kyc provider does not exist on this network" })
        } else {
            res.status(500).json({ status: "internal error" })
        }
    }
}
