import { NextApiRequest, NextApiResponse } from "next"
import { CustomerInfo, ICustomerInfo } from "../../../src/customerInfo"
import { UnknownCustomerError } from "../../../src/customerDb"
import customerDbFactory from "../../../src/customerDbFactory"

async function getCustomerInfoById(req: NextApiRequest): Promise<ICustomerInfo> {
    return await (await customerDbFactory()).getCustomerInfoById(<string>req.query.id)
}

async function setCustomerInfo(req: NextApiRequest): Promise<void> {
    // TODO add validation on pre-existing polymesh id
    return await (await customerDbFactory()).setCustomerInfo(
        <string>req.query.id, 
        new CustomerInfo(
            typeof req.body === "string"
                ? JSON.parse(req.body)
                : req.body))
}

async function updateCustomerInfo(req: NextApiRequest): Promise<void> {
    const id = <string>req.query.id
    const customerDb = await customerDbFactory()
    const customerInfo = await customerDb.getCustomerInfoById(id)
    customerInfo.patch(typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body)
    // TODO add validation on pre-existing polymesh id
    await customerDb.setCustomerInfo(id, customerInfo)
}

export default async function (req: NextApiRequest, res: NextApiResponse<object | ICustomerInfo>): Promise<any> {
    try {
        switch (req.method) {
            case "GET":
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
            case "PUT":
                await setCustomerInfo(req)
                res.status(200).json({"status": "ok"})
                break
            case "PATCH":
                try {
                    await updateCustomerInfo(req)
                    res.status(200).json({"status": "ok"})
                } catch(getError) {
                    if (getError instanceof UnknownCustomerError) {
                        res.status(404).json({"status": "not found"})
                    } else {
                        throw getError
                    }
                }
                break
            default:
                res.status(405).end()
        }
    } catch(e) {
        res.status(500).json({"status": "internal error"})
    }
}