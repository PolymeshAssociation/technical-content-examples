import { IOrderInfo, InvalidPolymeshDidError } from "./orderInfo"

export interface ISettlementParty {
    id: string
    polymeshDid: string
    portfolioId: number | null
    toJSON(): JSON
}

export interface ISettlementInfo {
    buyer: ISettlementParty
    seller: ISettlementParty
    quantity: number
    token: string
    price: number
    isPaid: boolean
    isTransferred: boolean
    toJSON(): JSON
}

export interface IFullSettlementInfo extends ISettlementInfo {
    id: string
}

function requireDesiredType(info: JSON, field: string, receivedType: string) {
    if (typeof info[field] === "undefined") {
        throw new IncompleteSettlementInfoError(field)
    }
    if (typeof info[field] !== receivedType) {
        throw new WrongTypeSettlementError(field, typeof info[field])
    }
}

const polymeshDidRegex = /^0x[0-9a-fA-F]{64}$/u

export class SettlementParty implements ISettlementParty {
    id: string
    polymeshDid: string
    portfolioId: number | null

    constructor(info: JSON) {
        requireDesiredType(info, "id", "string")
        this.id = info["id"]
        requireDesiredType(info, "polymeshDid", "string")
        if (!(info["polymeshDid"] as string).match(polymeshDidRegex)) {
            throw new InvalidPolymeshDidError(info["polymeshDid"])
        }
        this.polymeshDid = info["polymeshDid"]
        if (typeof info["portfolioId"] === "undefined" || info["portfolioId"] === null) {
            this.portfolioId = null
        } else {
            requireDesiredType(info, "portfolioId", "number")
            this.portfolioId = info["portfolioId"]
        }
    }

    toJSON(): JSON {
        return <JSON><unknown>{
            "id": this.id,
            "polymeshDid": this.polymeshDid,
            "portfolioId": this.portfolioId,
        }
    }
}

export class SettlementInfo implements ISettlementInfo {
    buyer: SettlementParty
    seller: SettlementParty
    quantity: number
    token: string
    price: number
    isPaid: boolean
    isTransferred: boolean

    constructor(info: JSON) {
        requireDesiredType(info, "buyer", "object")
        this.buyer = new SettlementParty(info["buyer"])
        requireDesiredType(info, "seller", "object")
        this.seller = new SettlementParty(info["seller"])
        if (this.buyer.id === this.seller.id) {
            throw new DuplicatePartiesSettlementError(this.buyer.id)
        }
        if (this.buyer.polymeshDid === this.seller.polymeshDid) {
            throw new DuplicatePolymeshDidSettlementError(this.buyer.polymeshDid)
        }
        requireDesiredType(info, "quantity", "number")
        this.quantity = info["quantity"]
        requireDesiredType(info, "token", "string")
        this.token = info["token"]
        requireDesiredType(info, "price", "number")
        this.price = info["price"]
        requireDesiredType(info, "isPaid", "boolean")
        this.isPaid = info["isPaid"]
        requireDesiredType(info, "isTransferred", "boolean")
        this.isTransferred = info["isTransferred"]
    }

    toJSON(): JSON {
        return <JSON><unknown>{
            "buyer": this.buyer.toJSON(),
            "seller": this.seller.toJSON(),
            "quantity": this.quantity,
            "token": this.token,
            "price": this.price,
            "isPaid": this.isPaid,
            "isTransferred": this.isTransferred,
        }
    }

}

export class FullSettlementInfo extends SettlementInfo implements IFullSettlementInfo {
    id: string

    constructor(info: JSON) {
        super(info)
        requireDesiredType(info, "id", "string")
        this.id = info["id"]
    }

    toJSON(): JSON {
        const json = super.toJSON()
        json["id"] = this.id
        return json
    }

}

export function createByMatchingOrders(buyerId: string, buyOrder: IOrderInfo, sellerId: string, sellOrder: IOrderInfo): ISettlementInfo {
    if (!buyOrder.isBuy) {
        throw new WrongOrderTypeError(true)
    }
    if (sellOrder.isBuy) {
        throw new WrongOrderTypeError(false)
    }
    if (buyOrder.token !== sellOrder.token) {
        throw new IncompatibleOrderTypeError(buyOrder.token, sellOrder.token)
    }
    const quantity: number = Math.min(buyOrder.quantity, sellOrder.quantity)
    const price: number = (buyOrder.price + sellOrder.price) / 2
    const settlement: JSON = {
        "buyer": {
            "id": buyerId,
            "polymeshDid": buyOrder.polymeshDid,
            "portfolioId": buyOrder.portfolioId,
        },
        "seller": {
            "id": sellerId,
            "polymeshDid": sellOrder.polymeshDid,
            "portfolioId": sellOrder.portfolioId,
        },
        "quantity": quantity,
        "token": buyOrder.token,
        "price": price,
        "isPaid": false,
        "isTransferred": false,
    } as unknown as JSON
    return new SettlementInfo(settlement)
}

export class SettlementInfoError extends Error {
    constructor (message?: string) {
        super(message)
        Error.apply(this, arguments)
    }
}

export class IncompleteSettlementInfoError extends SettlementInfoError {
    constructor (public field: string, message?: string) {
        super(message)
    }
}

export class WrongTypeSettlementError extends SettlementInfoError {
    constructor (public field: string, public receivedType: string, message?: string) {
        super(message)
    }
}

export class DuplicatePartiesSettlementError extends SettlementInfoError {
    constructor (public partyId: string, message?: string) {
        super(message)
    }
}

export class DuplicatePolymeshDidSettlementError extends SettlementInfoError {
    constructor (public polymeshDid: string, message?: string) {
        super(message)
    }
}

export class NoActionToDoSettlementError extends SettlementInfoError {
    constructor (public id: string, message?: string) {
        super(message)
    }
}

export class WrongOrderTypeError extends SettlementInfoError {
    constructor(public expectedIsBuy: boolean, message?: string) {
        super(message)
    }
}

export class IncompatibleOrderTypeError extends SettlementInfoError {
    constructor(public buyToken: string, public sellToken: string, message?: string) {
        super(message)
    }
}
