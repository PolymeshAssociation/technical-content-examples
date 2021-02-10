import { NextApiRequest, NextApiResponse } from "next"
import { CustomerInfo, ICustomerInfo, InvalidCountryCodeError, InvalidPolymeshDidError } from "../../../src/customerInfo"
import { UnknownCustomerError } from "../../../src/customerDb"
import customerDbFactory from "../../../src/customerDbFactory"

async function getCustomerInfoById(req: NextApiRequest): Promise<ICustomerInfo> {
    return await (await customerDbFactory()).getCustomerInfoById(<string>req.query.id)
}

async function setCustomerInfo(req: NextApiRequest): Promise<void> {
    const id = <string>req.query.id
    const customerDb = await customerDbFactory()
    const customerInfo = new CustomerInfo(typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body)
    await customerDb.setCustomerInfo(id, customerInfo)
}

async function updateCustomerInfo(req: NextApiRequest): Promise<void> {
    const id = <string>req.query.id
    const customerDb = await customerDbFactory()
    const customerInfo = await customerDb.getCustomerInfoById(id)
    customerInfo.patch(typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body)
    await customerDb.setCustomerInfo(id, customerInfo)
}

export default async function (req: NextApiRequest, res: NextApiResponse<object | ICustomerInfo>): Promise<any> {
    try {
        switch (req.method) {
            case "GET":
                res.status(200).json(await getCustomerInfoById(req))
                break
            case "PUT":
                await setCustomerInfo(req)
                res.status(200).json({"status": "ok"})
                break
            case "PATCH":
                await updateCustomerInfo(req)
                res.status(200).json({"status": "ok"})
                break
            default:
                res.status(405).end()
        }
    } catch(e) {
        if (e instanceof UnknownCustomerError) {
            res.status(404).json({"status": "not found"})
        } else if (e instanceof InvalidCountryCodeError) {
            res.status(400).json({"status": `invalid country code ${e.countryCode}`})
        } else if (e instanceof InvalidPolymeshDidError) {
            res.status(400).json({"status": `invalid Polymesh Did ${e.polymeshDid}`})
        } else {
            res.status(500).json({"status": "internal error"})
        }
    }
}