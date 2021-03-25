import { NextApiRequest, NextApiResponse } from "next"
import { AssignedOrderJson, IAssignedOrderInfo } from "../../src/orderInfo"
import exchangeDbFactory from "../../src/exchangeDbFactory"

async function getOrders(): Promise<AssignedOrderJson[]> {
    return (await (await exchangeDbFactory()).getOrders())
        .map((order: IAssignedOrderInfo) => order.toJSON())
}

export default async function (req: NextApiRequest, res: NextApiResponse<object>): Promise<any> {
    try {
        switch (req.method) {
            case "GET":
                res.status(200).json(await getOrders())
                break
            default:
                res.status(405).end()
        }
    } catch (e) {
        console.log(e)
        res.status(500).json({ status: "internal error" })
    }
}