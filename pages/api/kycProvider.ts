import { NextApiRequest, NextApiResponse } from "next"
import ClaimForwarderFactory from "../../src/claimForwarderFactory"

async function getKycProviderInfo(req: NextApiRequest): Promise<JSON> {
    const claimForwarder = await ClaimForwarderFactory()
    const providerDid = await claimForwarder.getServiceProviderIdentity()
    return <JSON><unknown>{
        "did": providerDid.did
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
    } catch(e) {
        res.status(500).json({"status": "internal error"})
    }
}