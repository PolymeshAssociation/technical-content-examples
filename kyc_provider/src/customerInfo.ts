import { CountryCode } from "@polymathnetwork/polymesh-sdk/generated/types"

export interface CustomerJson {
    name: string
    country: string
    passport: string
    valid: boolean
    jurisdiction: string
    polymeshDid: string | null
}

export interface ICustomerInfo {
    name: string
    country: CountryCode
    passport: string
    valid: boolean
    jurisdiction: CountryCode
    polymeshDid: string | null
    toJSON(): CustomerJson
    patch(extra: Partial<CustomerJson>): void
}

const polymeshDidRegex = /^0x[0-9a-fA-F]{64}$/u

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
    country: CountryCode
    passport: string
    valid: boolean
    jurisdiction: CountryCode
    polymeshDid: string | null

    constructor(info: CustomerJson) {
        requireDesiredType(info.name, "name", "string")
        this.name = info.name
        requireDesiredType(info.country, "country", "string")
        if (info.country === "") {
            throw new IncompleteInfoError("country")
        } else if (!Object.values(CountryCode).includes(info.country as CountryCode)) {
            throw new InvalidCountryCodeError(info.country)
        }
        this.country = CountryCode[info.country]
        requireDesiredType(info.passport, "passport", "string")
        this.passport = info.passport
        this.valid = typeof info.valid === "undefined" ? false : info.valid
        requireDesiredType(info.jurisdiction, "jurisdiction", "string")
        if (info.jurisdiction === "") {
            throw new IncompleteInfoError("jurisdiction")
        } else if (!Object.values(CountryCode).includes(info.jurisdiction as CountryCode)) {
            throw new InvalidCountryCodeError(info.jurisdiction)
        }
        this.jurisdiction = CountryCode[info.jurisdiction]
        if (typeof info.polymeshDid === "string"
            && info.polymeshDid !== ""
            && !(info.polymeshDid as string).match(polymeshDidRegex)) {
            throw new InvalidPolymeshDidError(info.polymeshDid)
        } else if (typeof info.polymeshDid === "string") {
            this.polymeshDid = info.polymeshDid
        } else {
            this.polymeshDid = null
        }
    }

    toJSON(): CustomerJson {
        return {
            name: this.name,
            country: this.country,
            passport: this.passport,
            valid: this.valid,
            jurisdiction: this.jurisdiction,
            polymeshDid: this.polymeshDid
        }
    }

    patch(extra: Partial<CustomerJson>): void {
        this.name = typeof extra.name !== "undefined" ? extra.name : this.name
        if (typeof extra.country !== "undefined") {
            if (typeof extra.country !== "string" || extra.country === "") {
                this.country = null
            } else if (!Object.values(CountryCode).includes(extra.country as CountryCode)) {
                throw new InvalidCountryCodeError(extra.country)
            } else {
                this.country = CountryCode[extra.country]
            }
        }
        this.passport = typeof extra.passport !== "undefined" ? extra.passport : this.passport
        this.valid = typeof extra.valid !== "undefined" ? extra.valid : this.valid
        if (typeof extra.jurisdiction !== "undefined") {
            if (typeof extra.jurisdiction !== "string" || extra.jurisdiction === "") {
                this.jurisdiction = null
            } else if (!Object.values(CountryCode).includes(extra.jurisdiction as CountryCode)) {
                throw new InvalidCountryCodeError(extra.jurisdiction)
            } else {
                this.jurisdiction = CountryCode[extra.jurisdiction]
            }
        }
        if (typeof extra.polymeshDid === "string"
            && extra.polymeshDid !== ""
            && !(extra.polymeshDid as string).match(polymeshDidRegex)) {
            throw new InvalidPolymeshDidError(extra.polymeshDid)
        } else if (typeof extra.polymeshDid === "string") {
            this.polymeshDid = extra.polymeshDid
        }
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

export class InvalidCountryCodeError extends CustomerInfoError {
    constructor(public countryCode: string, message?: string) {
        super(message)
    }
}

export class InvalidPolymeshDidError extends CustomerInfoError {
    constructor(public polymeshDid: string, message?: string) {
        super(message)
    }
}
