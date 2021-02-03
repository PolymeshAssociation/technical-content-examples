import { NextApiRequest, NextApiResponse } from "next"
import getConfig from 'next/config'
import { CustomerInfo, ICustomerInfo } from "../../../src/customerInfo"
import { UnknownCustomerError } from "../../../src/customerDb";
import { CustomerDbFs } from "../../../src/customerDbFs"

const { serverRuntimeConfig: { kycDbPath } } = getConfig() || {
    "serverRuntimeConfig": {
        "kycDbPath": process.env.KYC_DB_PATH
    }
}

async function getCustomerInfoById(req: NextApiRequest): Promise<ICustomerInfo> {
    return await new CustomerDbFs(kycDbPath).getCustomerInfoById(<string>req.query.id)
}

async function setCustomerInfo(req: NextApiRequest): Promise<void> {
    return await new CustomerDbFs(kycDbPath).setCustomerInfo(
        <string>req.query.id, 
        new CustomerInfo(
            typeof req.body === "string"
                ? JSON.parse(req.body)
                : req.body))
}

export default async function (req: NextApiRequest, res: NextApiResponse<object | ICustomerInfo>): Promise<any> {
    try {
        switch (req.method) {
            case 'GET':
                try {
                    res.status(200).json(await getCustomerInfoById(req))                
                } catch(getError) {
                    if (getError instanceof UnknownCustomerError) {
                        res.status(404).json({"status": "not found"})
                    } else {
                        throw getError
                    }
                }
                break
            case 'POST':
                await setCustomerInfo(req)
                res.status(200).json({"status": "ok"})
                break
            default:
                res.status(405).end()
        }
    } catch(e) {
        res.status(500).json({"status": "internal error"})
    }
}