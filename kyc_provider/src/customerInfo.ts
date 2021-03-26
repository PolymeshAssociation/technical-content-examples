export interface CustomerJson {
    name: string
    country: string
    passport: string
    valid: boolean
}

export interface ICustomerInfo {
    name: string
    country: string
    passport: string
    valid: boolean
    toJSON(): CustomerJson
    patch(extra: CustomerJson): void
}

export class CustomerInfo implements ICustomerInfo {
    name: string
    country: string
    passport: string
    valid: boolean

    constructor(info: CustomerJson) {
        this.name = info.name
        if (info.country === "") {
            throw new IncompleteInfoError("country")
        } else {
            this.country = info.country
        }
        this.passport = info.passport
        this.valid = typeof info.valid === "undefined" ? false : info.valid
    }

    toJSON(): CustomerJson {
        return {
            name: this.name,
            country: this.country,
            passport: this.passport,
            valid: this.valid,
        }
    }

    patch(extra: CustomerJson): void {
        this.name = typeof extra.name !== "undefined" ? extra.name : this.name
        this.country = typeof extra.country !== "undefined" ? extra.country : this.country
        this.passport = typeof extra.passport !== "undefined" ? extra.passport : this.passport
        this.valid = typeof extra.valid !== "undefined" ? extra.valid : this.valid
    }

}

export class CustomerInfoError extends Error {
    constructor(message?: string) {
        super(message)
        Error.apply(this, arguments)
    }
}

export class IncompleteInfoError extends CustomerInfoError {
    constructor(public field: string, message?: string) {
        super(message)
    }
}

export class WrongTypeError extends CustomerInfoError {
    constructor(public field: string, public receivedType: string, message?: string) {
        super(message)
    }
}