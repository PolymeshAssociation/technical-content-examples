import { NextApiRequest, NextApiResponse } from "next"
import { OrderInfo, IOrderInfo, IncompleteOrderInfoError, WrongTypeOrderError, WrongZeroOrderError } from "../../../src/orderInfo"
import { UnknownTraderError } from "../../../src/exchangeDb"
import exchangeDbFactory from "../../../src/exchangeDbFactory"

async function getOrderInfoById(req: NextApiRequest): Promise<IOrderInfo> {
    return await (await exchangeDbFactory()).getOrderInfoById(<string>req.query.id)
}

async function setOrderInfo(req: NextApiRequest): Promise<void> {
    const id = <string>req.query.id
    const exchangeDb = await exchangeDbFactory()
    const orderInfo = new OrderInfo(typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body)
    await exchangeDb.setOrderInfo(id, orderInfo)
}

export default async function (req: NextApiRequest, res: NextApiResponse<object | IOrderInfo>): Promise<any> {
    try {
        switch (req.method) {
            case "GET":
                res.status(200).json(await getOrderInfoById(req))
                break
            case "PUT":
                await setOrderInfo(req)
                res.status(200).json({ "status": "ok" })
                break
            default:
                res.status(405).end()
        }
    } catch(e) {
        if (e instanceof UnknownTraderError) {
            res.status(404).json({"status": "not found"})
        } else if (e instanceof IncompleteOrderInfoError) {
            res.status(400).json({"status": `missing field ${e.field}`})
        } else if (e instanceof WrongTypeOrderError) {
            res.status(400).json({"status": `wrong type ${e.receivedType} on field ${e.field}`})
        } else if (e instanceof WrongZeroOrderError) {
            res.status(400).json({"status": `cannot have 0 ${e.field}`})
        } else {
            console.log(e)
            res.status(500).json({"status": "internal error"})
        }
    }
}