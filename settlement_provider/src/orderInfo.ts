import { BigNumber } from "bignumber.js"

export interface IOrderInfo {
    isBuy: boolean
    quantity: number
    token: string
    price: number
    polymeshDid: string
    portfolioId: BigNumber | null
    toJSON(): JSON
}

const polymeshDidRegex = /^0x[0-9a-fA-F]{64}$/u

export interface IAssignedOrderInfo extends IOrderInfo {
    id: string
}

function requireDesiredType(info: JSON, field: string, receivedType: string) {
    if (typeof info[field] === "undefined") {
        throw new IncompleteOrderInfoError(field)
    }
    if (typeof info[field] !== receivedType) {
        throw new WrongTypeOrderError(field, typeof info[field])
    }
}

export class OrderInfo implements IOrderInfo {
    isBuy: boolean
    quantity: number
    token: string
    price: number
    polymeshDid: string
    portfolioId: BigNumber | null

    constructor(info: JSON) {
        requireDesiredType(info, "isBuy", "boolean")
        this.isBuy = info["isBuy"]
        requireDesiredType(info, "quantity", "number")
        this.quantity = info["quantity"]
        if (this.quantity === 0) {
            throw new WrongZeroOrderError("quantity")
        }
        requireDesiredType(info, "token", "string")
        this.token = info["token"]
        requireDesiredType(info, "price", "number")
        this.price = info["price"]
        if (this.price === 0) {
            throw new WrongZeroOrderError("price")
        }
        requireDesiredType(info, "polymeshDid", "string")
        if (!(info["polymeshDid"] as string).match(polymeshDidRegex)) {
            throw new InvalidPolymeshDidError(info["polymeshDid"])
        }
        this.polymeshDid = info["polymeshDid"]
        if (typeof info["portfolioId"] === "undefined" || info["portfolioId"] === null || info["portfolioId"] === "") {
            this.portfolioId = null
        } else {
            requireDesiredType(info, "portfolioId", "string")
            this.portfolioId = new BigNumber(info["portfolioId"])
            if (this.portfolioId.toString(10) === "NaN") {
                throw new WrongNumericValueError("portfolioId", info["portfolioId"])
            }
        }
    }

    toJSON(): JSON {
        const toReturn: JSON = <JSON><unknown>{
            "isBuy": this.isBuy,
            "quantity": this.quantity,
            "token": this.token,
            "price": this.price,
            "polymeshDid": this.polymeshDid,
        }
        if (this.portfolioId) toReturn["portfolioId"] = this.portfolioId.toString(10)
        return toReturn
    }

}

export class AssignedOrderInfo extends OrderInfo implements IAssignedOrderInfo {
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

export class OrderInfoError extends Error {
    constructor (message?: string) {
        super(message)
        Error.apply(this, arguments)
    }
}

export class IncompleteOrderInfoError extends OrderInfoError {
    constructor (public field: string, message?: string) {
        super(message)
    }
}

export class WrongTypeOrderError extends OrderInfoError {
    constructor (public field: string, public receivedType: string, message?: string) {
        super(message)
    }
}

export class WrongNumericValueError extends OrderInfoError {
    constructor (public field: string, public received: string, message?: string) {
        super(message)
    }
}

export class WrongZeroOrderError extends OrderInfoError {
    constructor (public field: string, message?: string) {
        super(message)
    }
}

export class InvalidPolymeshDidError extends OrderInfoError {
    constructor (public polymeshDid: string, message?: string) {
        super(message)
    }
}
