import { BigNumber } from "@polymathnetwork/polymesh-sdk"

export interface OrderJson {
    isBuy: boolean
    quantity: string
    token: string
    price: string
    polymeshDid: string
    portfolioId: string | null
}

export interface IOrderInfo {
    isBuy: boolean
    quantity: BigNumber
    token: string
    price: BigNumber
    polymeshDid: string
    portfolioId: BigNumber | null
    toJSON(): OrderJson
}

const polymeshDidRegex = /^0x[0-9a-fA-F]{64}$/u

export interface AssignedOrderJson extends OrderJson {
    id: string
}

export interface IAssignedOrderInfo extends IOrderInfo {
    id: string
    toJSON(): AssignedOrderJson
}

function requireDesiredType(info: any, field: string, receivedType: string) {
    if (typeof info === "undefined") {
        throw new IncompleteOrderInfoError(field)
    }
    if (typeof info !== receivedType) {
        throw new WrongTypeOrderError(field, typeof info)
    }
}

export class OrderInfo implements IOrderInfo {
    isBuy: boolean
    quantity: BigNumber
    token: string
    price: BigNumber
    polymeshDid: string
    portfolioId: BigNumber | null

    constructor(info: OrderJson) {
        requireDesiredType(info.isBuy, "isBuy", "boolean")
        this.isBuy = info.isBuy
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
        requireDesiredType(info.polymeshDid, "polymeshDid", "string")
        if (!(info.polymeshDid as string).match(polymeshDidRegex)) {
            throw new InvalidPolymeshDidError(info.polymeshDid)
        }
        this.polymeshDid = info.polymeshDid
        if (typeof info.portfolioId === "undefined" || info.portfolioId === null || info.portfolioId === "") {
            this.portfolioId = null
        } else {
            requireDesiredType(info.portfolioId, "portfolioId", "string")
            this.portfolioId = new BigNumber(info.portfolioId)
            if (this.portfolioId.toString(10) === "NaN") {
                throw new WrongNumericValueError("portfolioId", info.portfolioId)
            }
        }
    }

    toJSON(): OrderJson {
        return {
            isBuy: this.isBuy,
            quantity: this.quantity.toString(10),
            token: this.token,
            price: this.price.toString(10),
            polymeshDid: this.polymeshDid,
            portfolioId: this.portfolioId === null ? null : this.portfolioId.toString(10),
        }
    }

}

export class AssignedOrderInfo extends OrderInfo implements IAssignedOrderInfo {
    id: string

    constructor(info: AssignedOrderJson) {
        super(info)
        requireDesiredType(info.id, "id", "string")
        this.id = info.id
    }

    toJSON(): AssignedOrderJson {
        return {
            ...super.toJSON(),
            id: this.id,
        }
    }

}

export class OrderInfoError extends Error {
    constructor(message?: string) {
        super(message)
        Error.apply(this, arguments)
    }
}

export class IncompleteOrderInfoError extends OrderInfoError {
    constructor(public field: string, message?: string) {
        super(message)
    }
}

export class WrongTypeOrderError extends OrderInfoError {
    constructor(public field: string, public receivedType: string, message?: string) {
        super(message)
    }
}

export class WrongNumericValueError extends OrderInfoError {
    constructor(public field: string, public received: string, message?: string) {
        super(message)
    }
}

export class WrongZeroOrderError extends OrderInfoError {
    constructor(public field: string, message?: string) {
        super(message)
    }
}

export class InvalidPolymeshDidError extends OrderInfoError {
    constructor(public polymeshDid: string, message?: string) {
        super(message)
    }
}

export class NonExistentCustomerPolymeshIdError extends OrderInfoError {
    constructor(public polymeshDid: string) {
        super()
    }
}

export class InvalidPortfolioError extends OrderInfoError {
    constructor(public polymeshDid: string, public portfolioId: BigNumber, message?: string) {
        super(message)
    }
}
