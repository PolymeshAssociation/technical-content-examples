export interface CustomerJson {
    name: string
    country: string
    passport: string
    valid: boolean
    jurisdiction: string
}

export interface ICustomerInfo {
    name: string
    country: string
    passport: string
    valid: boolean
    jurisdiction: string
    toJSON: () => CustomerJson
    patch: (extra: Partial<CustomerJson>) => void
}

function requireDesiredType(info: any, field: string, receivedType: string) {
    if (typeof info === "undefined") {
        throw new IncompleteInfoError(field)
    }
    if (typeof info !== receivedType) {
        throw new WrongTypeError(field, typeof info)
    }
}

export class CustomerInfo implements ICustomerInfo {
    name: string
    country: string
    passport: string
    valid: boolean
    jurisdiction: string

    constructor(info: CustomerJson) {
        requireDesiredType(info.name, "name", "string")
        this.name = info.name
        requireDesiredType(info.country, "country", "string")
        if (info.country === "") {
            throw new IncompleteInfoError("country")
        }
        this.country = info.country
        requireDesiredType(info.passport, "passport", "string")
        this.passport = info.passport
        this.valid = typeof info.valid === "undefined" ? false : info.valid
        requireDesiredType(info.jurisdiction, "jurisdiction", "string")
        if (info.jurisdiction === "") {
            throw new IncompleteInfoError("jurisdiction")
        }
        this.jurisdiction = info.jurisdiction
    }

    toJSON(): CustomerJson {
        return {
            name: this.name,
            country: this.country,
            passport: this.passport,
            valid: this.valid,
            jurisdiction: this.jurisdiction,
        }
    }

    patch(extra: Partial<CustomerJson>): void {
        this.name = typeof extra.name !== "undefined" ? extra.name : this.name
        this.country = typeof extra.country !== "undefined" ? extra.country : this.country
        this.passport = typeof extra.passport !== "undefined" ? extra.passport : this.passport
        this.valid = typeof extra.valid !== "undefined" ? extra.valid : this.valid
        this.jurisdiction = typeof extra.jurisdiction !== "undefined" ? extra.jurisdiction : this.jurisdiction
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