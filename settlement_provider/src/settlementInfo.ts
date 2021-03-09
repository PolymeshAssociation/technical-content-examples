import {
    IOrderInfo,
} from "./orderInfo"

export interface ISettlementParty {
    id: string
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

export class SettlementParty implements ISettlementParty {
    id: string

    constructor(info: JSON) {
        requireDesiredType(info, "id", "string")
        this.id = info["id"]
    }

    toJSON(): JSON {
        const toReturn: JSON = <JSON><unknown>{
            "id": this.id,
        }
        return toReturn
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
        },
        "seller": {
            "id": sellerId,
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
