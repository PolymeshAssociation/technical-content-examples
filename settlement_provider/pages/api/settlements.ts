import { NextApiRequest, NextApiResponse } from "next"
import { IOrderInfo, OrderInfo } from "../../src/orderInfo"
import { IFullSettlementInfo, SettlementInfo, FullSettlementInfo } from "../../src/settlementInfo"
import { IExchangeDb, UnknownTraderError } from "../../src/exchangeDb"
import { IncompatibleOrderTypeError, ISettlementDb, WrongOrderTypeError } from "../../src/settlementDb"
import exchangeDbFactory from "../../src/exchangeDbFactory"
import settlementDbFactory from "../../src/settlementDbFactory"

async function getSettlements(req: NextApiRequest): Promise<IFullSettlementInfo[]> {
    const all: IFullSettlementInfo[] =  await (await settlementDbFactory()).getSettlements()
    const traderId: string = <string>req.query.traderId
    if (typeof traderId === "undefined") {
        return all
    }
    return all.filter((info: IFullSettlementInfo) => info.buyer.id === traderId || info.seller.id === traderId);
}

async function matchOrders(req: NextApiRequest): Promise<IFullSettlementInfo> {
    const buyerId: string = <string>req.query.buyerId
    const sellerId: string = <string>req.query.sellerId
    const exchangeDb: IExchangeDb = await exchangeDbFactory()
    const buyOrder: IOrderInfo = await exchangeDb.getOrderInfoById(buyerId)
    if (!buyOrder.isBuy) {
        throw new WrongOrderTypeError(true)
    }
    const sellOrder: IOrderInfo = await exchangeDb.getOrderInfoById(sellerId)
    if (sellOrder.isBuy) {
        throw new WrongOrderTypeError(false)
    }
    if (buyOrder.token !== sellOrder.token) {
        throw new IncompatibleOrderTypeError(buyOrder.token, sellOrder.token)
    }
    const quantity: number = Math.min(buyOrder.quantity, sellOrder.quantity)
    const price: number = (buyOrder.price + sellOrder.price) / 2
    const settlement: JSON = {
        "buyer": { "id": buyerId },
        "seller": { "id": sellerId },
        "quantity": quantity,
        "token": buyOrder.token,
        "price": price,
        "isPaid": false,
        "isTransferred": false,
    } as unknown as JSON
    const settlementId: string = Math.round(Math.random() * Number.MAX_SAFE_INTEGER).toString(10)
    const settlementDb: ISettlementDb = await settlementDbFactory()
    await settlementDb.setSettlementInfo(settlementId, new SettlementInfo(settlement))
    if (buyOrder.quantity === quantity) {
        await exchangeDb.deleteOrderInfoById(buyerId)
    } else {
        const orderJson: JSON = buyOrder.toJSON()
        orderJson["quantity"] -= quantity
        await exchangeDb.setOrderInfo(buyerId, new OrderInfo(orderJson))
    }
    if (sellOrder.quantity === quantity) {
        await exchangeDb.deleteOrderInfoById(sellerId)
    } else {
        const orderJson: JSON = sellOrder.toJSON()
        orderJson["quantity"] -= quantity
        await exchangeDb.setOrderInfo(sellerId, new OrderInfo(orderJson))
    }
    return new FullSettlementInfo({...settlement, "id": settlementId} as unknown as JSON)
}

export default async function (req: NextApiRequest, res: NextApiResponse<object>): Promise<any> {
    try {
        switch (req.method) {
            case "GET":
                res.status(200).json(await getSettlements(req))
                break
            case "POST":
                res.status(200).json(await matchOrders(req))
                break
            default:
                res.status(405).end()
        }
    } catch(e) {
        if (e instanceof UnknownTraderError) {
            res.status(404).json({"status": `Order not found ${e.id}`})
        } else if (e instanceof WrongOrderTypeError) {
            res.status(400).json({"status": `Order is of wrong type, expectedIsBuy: ${e.expectedIsBuy}`})
        } else if (e instanceof IncompatibleOrderTypeError) {
            res.status(400).json({"status": `Orders are not for same token, ${e.buyToken} / ${e.sellToken}`})
        } else {
            console.log(e)
            res.status(500).json({"status": "internal error"})
        }
    }
}
