import {
    IOrderInfo,
    WrongNumericValueError,
    WrongZeroOrderError,
} from "./orderInfo"

export interface SettlementPartyJson {
    id: string
}

export interface ISettlementParty {
    id: string
    toJSON(): SettlementPartyJson
}

export interface SettlementJson {
    buyer: SettlementPartyJson
    seller: SettlementPartyJson
    quantity: string
    token: string
    price: string
    isPaid: boolean
    isTransferred: boolean
}

export interface FullSettlementJson extends SettlementJson {
    id: string
}

export interface ISettlementInfo {
    buyer: ISettlementParty
    seller: ISettlementParty
    quantity: number
    token: string
    price: number
    isPaid: boolean
    isTransferred: boolean
    toJSON(): SettlementJson
}

export interface IFullSettlementInfo extends ISettlementInfo {
    id: string
    toJSON(): FullSettlementJson
}

function requireDesiredType(info: any, field: string, receivedType: string) {
    if (typeof info === "undefined") {
        throw new IncompleteSettlementInfoError(field)
    }
    if (typeof info !== receivedType) {
        throw new WrongTypeSettlementError(field, typeof info)
    }
}

export class SettlementParty implements ISettlementParty {
    id: string

    constructor(info: SettlementPartyJson) {
        requireDesiredType(info.id, "id", "string")
        this.id = info.id
    }

    toJSON(): SettlementPartyJson {
        return {
            id: this.id,
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

    constructor(info: SettlementJson) {
        requireDesiredType(info.buyer, "buyer", "object")
        this.buyer = new SettlementParty(info.buyer)
        requireDesiredType(info.seller, "seller", "object")
        this.seller = new SettlementParty(info.seller)
        if (this.buyer.id === this.seller.id) {
            throw new DuplicatePartiesSettlementError(this.buyer.id)
        }
        requireDesiredType(info.quantity, "quantity", "string")
        this.quantity = parseInt(info.quantity)
        if (this.quantity.toString(10) === "0") {
            throw new WrongZeroOrderError("quantity")
        } else if (isNaN(this.quantity)) {
            throw new WrongNumericValueError("quantity", info.quantity)
        }
        requireDesiredType(info.token, "token", "string")
        this.token = info.token
        requireDesiredType(info.price, "price", "string")
        this.price = parseInt(info.price)
        if (this.price.toString(10) === "0") {
            throw new WrongZeroOrderError("price")
        } else if (isNaN(this.price)) {
            throw new WrongNumericValueError("price", info.price)
        }
        requireDesiredType(info.isPaid, "isPaid", "boolean")
        this.isPaid = info.isPaid
        requireDesiredType(info.isTransferred, "isTransferred", "boolean")
        this.isTransferred = info.isTransferred
    }

    toJSON(): SettlementJson {
        return {
            buyer: this.buyer.toJSON(),
            seller: this.seller.toJSON(),
            quantity: this.quantity.toString(10),
            token: this.token,
            price: this.price.toString(10),
            isPaid: this.isPaid,
            isTransferred: this.isTransferred,
        }
    }

}

export class FullSettlementInfo extends SettlementInfo implements IFullSettlementInfo {
    id: string

    constructor(info: FullSettlementJson) {
        super(info)
        requireDesiredType(info.id, "id", "string")
        this.id = info.id
    }

    toJSON(): FullSettlementJson {
        return {
            id: this.id,
            ...super.toJSON(),
        }
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
    const settlement: SettlementJson = {
        buyer: {
            id: buyerId,
        },
        seller: {
            id: sellerId,
        },
        quantity: quantity.toString(10),
        token: buyOrder.token,
        price: price.toString(10),
        isPaid: false,
        isTransferred: false,
    }
    return new SettlementInfo(settlement)
}

export class SettlementInfoError extends Error {
    constructor(message?: string) {
        super(message)
        Error.apply(this, arguments)
    }
}

export class IncompleteSettlementInfoError extends SettlementInfoError {
    constructor(public field: string, message?: string) {
        super(message)
    }
}

export class WrongTypeSettlementError extends SettlementInfoError {
    constructor(public field: string, public receivedType: string, message?: string) {
        super(message)
    }
}

export class DuplicatePartiesSettlementError extends SettlementInfoError {
    constructor(public partyId: string, message?: string) {
        super(message)
    }
}

export class NoActionToDoSettlementError extends SettlementInfoError {
    constructor(public id: string, message?: string) {
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
