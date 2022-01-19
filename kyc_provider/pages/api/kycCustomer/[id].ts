import { NextApiRequest, NextApiResponse } from "next"
import { CustomerInfo, ICustomerInfo } from "../../../src/customerInfo"
import { ICustomerDb, UnknownCustomerError } from "../../../src/customerDb"
import customerDbFactory from "../../../src/customerDbFactory"

async function getCustomerInfoById(req: NextApiRequest): Promise<ICustomerInfo> {
    return await (await customerDbFactory()).getCustomerInfoById(<string>req.query.id)
}

async function setCustomerInfo(req: NextApiRequest): Promise<void> {
    const id: string = <string>req.query.id
    const customerDb: ICustomerDb = await customerDbFactory()
    const customerInfo: ICustomerInfo = new CustomerInfo(typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body)
    await customerDb.setCustomerInfo(id, customerInfo)
}

async function updateCustomerInfo(req: NextApiRequest): Promise<void> {
    const id: string = <string>req.query.id
    const customerDb: ICustomerDb = await customerDbFactory()
    const customerInfo: ICustomerInfo = await customerDb.getCustomerInfoById(id)
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
                res.status(200).json({
                    status: "ok",
                })
                break
            case "PATCH":
                await updateCustomerInfo(req)
                res.status(200).json({
                    status: "ok",
                })
                break
            default:
                res.status(405).end()
        }
    } catch (e) {
        if (e instanceof UnknownCustomerError) {
            res.status(404).json({ status: "not found" })
        } else {
            console.log(e)
            res.status(500).json({ status: "internal error" })
        }
    }
}
