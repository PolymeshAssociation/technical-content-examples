import { BigNumber } from "@polymathnetwork/polymesh-sdk"
import {
    PortfolioLike,
} from "@polymathnetwork/polymesh-sdk/types"
import {
    IOrderInfo,
    InvalidPolymeshDidError,
    WrongNumericValueError,
    WrongZeroOrderError,
} from "./orderInfo"

export interface PolymeshPartyJson {
    polymeshDid: string
    portfolioId: string | null
}

export interface SettlementPartyJson extends PolymeshPartyJson {
    id: string
}

export interface ISettlementParty {
    id: string
    polymeshDid: string
    portfolioId: BigNumber | null
    toJSON(): SettlementPartyJson
    toPortfolioLike(): PortfolioLike
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

export interface PublishedSettlementJson extends SettlementJson {
    instructionId: string
}

export interface FullSettlementJson extends PublishedSettlementJson {
    id: string
}

export interface ISettlementInfo {
    buyer: ISettlementParty
    seller: ISettlementParty
    quantity: BigNumber
    token: string
    price: BigNumber
    isPaid: boolean
    isTransferred: boolean
    toJSON(): SettlementJson
}

export interface IPublishedSettlementInfo extends ISettlementInfo {
    instructionId: BigNumber
    toJSON(): PublishedSettlementJson
}

export interface IFullSettlementInfo extends IPublishedSettlementInfo {
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

const polymeshDidRegex = /^0x[0-9a-fA-F]{64}$/u

export class SettlementParty implements ISettlementParty {
    id: string
    polymeshDid: string
    portfolioId: BigNumber | null

    constructor(info: SettlementPartyJson) {
        requireDesiredType(info.id, "id", "string")
        this.id = info.id
        requireDesiredType(info.polymeshDid, "polymeshDid", "string")
        if (!(info.polymeshDid as string).match(polymeshDidRegex)) {
            throw new InvalidPolymeshDidError(info.polymeshDid)
        }
        this.polymeshDid = info.polymeshDid
        if (typeof info.portfolioId === "undefined" || info.portfolioId === null) {
            this.portfolioId = null
        } else {
            requireDesiredType(info.portfolioId, "portfolioId", "string")
            this.portfolioId = new BigNumber(info.portfolioId)
        }
    }

    toJSON(): SettlementPartyJson {
        return {
            id: this.id,
            polymeshDid: this.polymeshDid,
            portfolioId: this.portfolioId === null ? null : this.portfolioId.toString(10),
        }
    }

    toPortfolioLike(): PortfolioLike {
        return this.portfolioId ? {
            identity: this.polymeshDid,
            id: this.portfolioId,
        } : this.polymeshDid
    }
}

export class SettlementInfo implements ISettlementInfo {
    buyer: SettlementParty
    seller: SettlementParty
    quantity: BigNumber
    token: string
    price: BigNumber
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
        if (this.buyer.polymeshDid === this.seller.polymeshDid) {
            throw new DuplicatePolymeshDidSettlementError(this.buyer.polymeshDid)
        }
        requireDesiredType(info.quantity, "quantity", "string")
        this.quantity = new BigNumber(info.quantity)
        if (this.quantity.toString(10) === "0") {
            throw new WrongZeroOrderError("quantity")
        } else if (this.quantity.toString(10) === "NaN") {
            throw new WrongNumericValueError("quantity", info.quantity)
        }
        requireDesiredType(info.token, "token", "string")
        this.token = info.token
        requireDesiredType(info.price, "price", "string")
        this.price = new BigNumber(info.price)
        if (this.price.toString(10) === "0") {
            throw new WrongZeroOrderError("price")
        } else if (this.price.toString(10) === "NaN") {
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

export class PublishedSettlementInfo extends SettlementInfo implements IPublishedSettlementInfo {
    instructionId: BigNumber

    constructor(info: PublishedSettlementJson) {
        super(info)
        requireDesiredType(info.instructionId, "instructionId", "string")
        this.instructionId = new BigNumber(info.instructionId)
        if (this.instructionId.toString(10) === "NaN") {
            throw new WrongNumericValueError("instructionId", info.instructionId)
        }
    }

    toJSON(): PublishedSettlementJson {
        return {
            ...super.toJSON(),
            instructionId: this.instructionId.toString(10),
        }
    }

}
export class FullSettlementInfo extends PublishedSettlementInfo implements IFullSettlementInfo {
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
    const quantity: BigNumber = BigNumber.min(buyOrder.quantity, sellOrder.quantity)
    const price: BigNumber =  (buyOrder.price.plus(sellOrder.price)).dividedBy(new BigNumber("2"))
    const settlement: SettlementJson = {
        buyer: {
            id: buyerId,
            polymeshDid: buyOrder.polymeshDid,
            portfolioId: buyOrder.portfolioId?.toString(10),
        },
        seller: {
            id: sellerId,
            polymeshDid: sellOrder.polymeshDid,
            portfolioId: sellOrder.portfolioId?.toString(10),
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

export class DuplicatePolymeshDidSettlementError extends SettlementInfoError {
    constructor(public polymeshDid: string, message?: string) {
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
