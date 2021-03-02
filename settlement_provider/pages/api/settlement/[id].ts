import { NextApiRequest, NextApiResponse } from "next"
import {
    SettlementInfo,
    ISettlementInfo,
    IncompleteSettlementInfoError,
    WrongTypeSettlementError,
    DuplicatePartiesSettlementError,
    NoActionToDoSettlementError,
} from "../../../src/settlementInfo"
import { ISettlementDb, UnknownSettlementError } from "../../../src/settlementDb"
import settlementDbFactory from "../../../src/settlementDbFactory"

async function getSettlementInfoById(req: NextApiRequest): Promise<ISettlementInfo> {
    return await (await settlementDbFactory()).getSettlementInfoById(<string>req.query.id)
}

async function setSettlementInfo(req: NextApiRequest): Promise<void> {
    const id = <string>req.query.id
    const settlementDb: ISettlementDb = await settlementDbFactory()
    const settlement: ISettlementInfo = new SettlementInfo(typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body)
    await settlementDb.setSettlementInfo(id, settlement)
}

async function updateSettlementInfo(req: NextApiRequest): Promise<void> {
    const id = <string>req.query.id
    const settlementDb: ISettlementDb = await settlementDbFactory()
    const settlement = await settlementDb.getSettlementInfoById(id)
    const isPaid: boolean = typeof req.query.isPaid !== "undefined"
    const isTransferred: boolean = typeof req.query.isTransferred !== "undefined"
    if (!isPaid && !isTransferred) {
        throw new NoActionToDoSettlementError(id)
    }
    if (isPaid) {
        settlement.isPaid = true
    }
    if (isTransferred) {
        settlement.isTransferred = true
    }
    await settlementDb.setSettlementInfo(id, settlement)
}

export default async function (req: NextApiRequest, res: NextApiResponse<object | ISettlementInfo>): Promise<any> {
    try {
        switch (req.method) {
            case "GET":
                res.status(200).json(await getSettlementInfoById(req))
                break
            case "PUT":
                await setSettlementInfo(req)
                res.status(200).json({ "status": "ok" })
                break
            case "PATCH":
                await updateSettlementInfo(req)
                res.status(200).json({ "status": "ok" })
                break
            default:
                res.status(405).end()
        }
    } catch(e) {
        if (e instanceof UnknownSettlementError) {
            res.status(404).json({"status": "not found"})
        } else if (e instanceof IncompleteSettlementInfoError) {
            res.status(400).json({"status": `missing field ${e.field}`})
        } else if (e instanceof WrongTypeSettlementError) {
            res.status(400).json({"status": `wrong type ${e.receivedType} on field ${e.field}`})
        } else if (e instanceof DuplicatePartiesSettlementError) {
            res.status(400).json({"status": `same buyer and seller: ${e.partyId}`})
        } else if (e instanceof NoActionToDoSettlementError) {
            res.status(400).json({"status": `no action found for ${e.id}`})
        } else {
            console.log(e)
            res.status(500).json({"status": "internal error"})
        }
    }
}
