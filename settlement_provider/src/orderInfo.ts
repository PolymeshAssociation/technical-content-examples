export interface OrderJson {
    isBuy: boolean
    quantity: string
    token: string
    price: string
}
export interface IOrderInfo {
    isBuy: boolean
    quantity: number
    token: string
    price: number
    toJSON(): OrderJson
}

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
    quantity: number
    token: string
    price: number

    constructor(info: OrderJson) {
        requireDesiredType(info.isBuy, "isBuy", "boolean")
        this.isBuy = info.isBuy
        requireDesiredType(info.quantity, "quantity", "string")
        this.quantity = parseInt(info.quantity)
        if (this.quantity === 0) {
            throw new WrongZeroOrderError("quantity")
        }
        requireDesiredType(info.token, "token", "string")
        this.token = info.token
        requireDesiredType(info.price, "price", "string")
        this.price = parseInt(info.price)
        if (this.price === 0) {
            throw new WrongZeroOrderError("price")
        }
    }

    toJSON(): OrderJson {
        return {
            "isBuy": this.isBuy,
            "quantity": this.quantity.toString(10),
            "token": this.token,
            "price": this.price.toString(10),
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
            id: this.id,
            ...super.toJSON(),
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

export class WrongZeroOrderError extends OrderInfoError {
    constructor(public field: string, message?: string) {
        super(message)
    }
}
