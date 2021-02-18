export interface IOrderInfo {
    isBuy: boolean
    quantity: number
    token: string
    price: number
    toJSON(): JSON
}

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
    }

    toJSON(): JSON {
        return <JSON><unknown>{
            "isBuy": this.isBuy,
            "quantity": this.quantity,
            "token": this.token,
            "price": this.price,
        }
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
    field: string

    constructor (field: string, message?: string) {
        super(message)
        this.field = field
    }
}

export class WrongTypeOrderError extends OrderInfoError {
    field: string
    receivedType: string

    constructor (field: string, receivedType: string, message?: string) {
        super(message)
        this.field = field
        this.receivedType = receivedType
    }
}

export class WrongZeroOrderError extends OrderInfoError {
    field: string

    constructor (field: string, message?: string) {
        super(message)
        this.field = field
    }
}