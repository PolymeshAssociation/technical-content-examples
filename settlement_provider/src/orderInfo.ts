export interface IOrderInfo {
    isBuy: boolean
    quantity: number
    token: string
    price: number
    toJSON(): JSON
}

function requireDesiredType(info: JSON, field: string, receivedType: string) {
    if (typeof info[field] === "undefined") { 
        throw new IncompleteInformationError(field)
    }
    if (typeof info[field] !== receivedType) {
        throw new WrongTypeError(field, typeof info[field])
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
        requireDesiredType(info, "token", "string")
        this.token = info["token"]
        requireDesiredType(info, "price", "number")
        this.price = info["price"]
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

export class OrderInfoError {
    constructor () {
        Error.apply(this, arguments)
    }
}

export class IncompleteInformationError extends OrderInfoError {
    constructor (public field: string) {
        super()
    }
}

export class WrongTypeError extends OrderInfoError {
    constructor (public field: string, public receivedType: string) {
        super()
    }
}