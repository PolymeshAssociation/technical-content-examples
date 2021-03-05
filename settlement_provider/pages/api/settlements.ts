import { NextApiRequest, NextApiResponse } from "next"
import { IOrderInfo, OrderInfo } from "../../src/orderInfo"
import {
    DuplicatePartiesSettlementError,
    DuplicatePolymeshDidSettlementError,
    FullSettlementInfo,
    IFullSettlementInfo,
    IncompleteSettlementInfoError,
    WrongTypeSettlementError,
    createByMatchingOrders,
    IncompatibleOrderTypeError,
    ISettlementInfo,
    WrongOrderTypeError,
} from "../../src/settlementInfo"
import { IExchangeDb, UnknownTraderError } from "../../src/exchangeDb"
import { ISettlementDb } from "../../src/settlementDb"
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
    const sellOrder: IOrderInfo = await exchangeDb.getOrderInfoById(sellerId)
    const settlement: ISettlementInfo = createByMatchingOrders(
        buyerId, buyOrder,
        sellerId, sellOrder)
    const settlementId: string = Math.round(Math.random() * Number.MAX_SAFE_INTEGER).toString(10)
    const settlementDb: ISettlementDb = await settlementDbFactory()
    await settlementDb.setSettlementInfo(settlementId, settlement)
    if (buyOrder.quantity === settlement.quantity) {
        await exchangeDb.deleteOrderInfoById(buyerId)
    } else {
        const orderJson: JSON = buyOrder.toJSON()
        orderJson["quantity"] -= settlement.quantity
        await exchangeDb.setOrderInfo(buyerId, new OrderInfo(orderJson))
    }
    if (sellOrder.quantity === settlement.quantity) {
        await exchangeDb.deleteOrderInfoById(sellerId)
    } else {
        const orderJson: JSON = sellOrder.toJSON()
        orderJson["quantity"] -= settlement.quantity
        await exchangeDb.setOrderInfo(sellerId, new OrderInfo(orderJson))
    }
    return new FullSettlementInfo({
        "id": settlementId,
        ...settlement.toJSON(),
    } as unknown as JSON)
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
        } else if (e instanceof IncompleteSettlementInfoError) {
            res.status(400).json({"status": `missing field ${e.field}`})
        } else if (e instanceof WrongTypeSettlementError) {
            res.status(400).json({"status": `wrong type ${e.receivedType} on field ${e.field}`})
        } else if (e instanceof DuplicatePartiesSettlementError) {
            res.status(400).json({"status": `same buyer and seller: ${e.partyId}`})
        } else if (e instanceof DuplicatePolymeshDidSettlementError) {
            res.status(400).json({"status": `same buyer and seller: ${e.polymeshDid}`})
        } else {
            console.log(e)
            res.status(500).json({"status": "internal error"})
        }
    }
}
