import { CountryCode } from "@polymathnetwork/polymesh-sdk/generated/types"

export interface ICustomerInfo {
    name: string
    country: CountryCode
    passport: string
    valid: boolean
    jurisdiction: CountryCode
    polymeshDid: string | null
    toJSON(): JSON
    patch(extra: JSON): void
}

const polymeshDidRegex = /^0x[0-9a-fA-F]{64}$/u

export class CustomerInfo implements ICustomerInfo {
    name: string
    country: CountryCode
    passport: string
    valid: boolean
    jurisdiction: CountryCode
    polymeshDid: string | null

    constructor(info: JSON) {
        this.name = info["name"]
        if (typeof info["country"] !== "string" || info["country"] === "") {
            this.country = null
        } else if (!Object.values(CountryCode).includes(info["country"] as CountryCode)) {
            throw new InvalidCountryCodeError(info["country"])
        } else {
            this.country = CountryCode[info["country"]]
        }
        this.passport = info["passport"]
        this.valid = typeof info["valid"] === "undefined" ? false : info["valid"]
        if (typeof info["jurisdiction"] !== "string" || info["jurisdiction"] === "") {
            this.jurisdiction = null
        } else if (!Object.values(CountryCode).includes(info["jurisdiction"] as CountryCode)) {
            throw new InvalidCountryCodeError(info["jurisdiction"])
        }
        this.jurisdiction = CountryCode[info["jurisdiction"]]
        if (typeof info["polymeshDid"] === "string"
            && info["polymeshDid"] !== ""
            && !(info["polymeshDid"] as string).match(polymeshDidRegex)) {
            throw new InvalidPolymeshDidError(info["polymeshDid"])
        } else if (typeof info["polymeshDid"] === "string") {
            this.polymeshDid = info["polymeshDid"]
        } else {
            this.polymeshDid = null
        }
    }

    toJSON(): JSON {
        return <JSON><unknown>{
            "name": this.name,
            "country": this.country,
            "passport": this.passport,
            "valid": this.valid,
            "jurisdiction": this.jurisdiction,
            "polymeshDid": this.polymeshDid
        }
    }

    patch(extra: JSON): void {
        this.name = typeof extra["name"] !== "undefined" ? extra["name"] : this.name
        if (typeof extra["country"] !== "undefined") {
            if (typeof extra["country"] !== "string" || extra["country"] === "") {
                this.country = null
            } else if (!Object.values(CountryCode).includes(extra["country"] as CountryCode)) {
                throw new InvalidCountryCodeError(extra["country"])
            } else {
                this.country = CountryCode[extra["country"]]
            }
        }
        this.passport = typeof extra["passport"] !== "undefined" ? extra["passport"] : this.passport
        this.valid = typeof extra["valid"] !== "undefined" ? extra["valid"] : this.valid
        if (typeof extra["jurisdiction"] !== "undefined") {
            if (typeof extra["jurisdiction"] !== "string" || extra["jurisdiction"] === "") {
                this.jurisdiction = null
            } else if (!Object.values(CountryCode).includes(extra["jurisdiction"] as CountryCode)) {
                throw new InvalidCountryCodeError(extra["jurisdiction"])
            } else {
                this.jurisdiction = CountryCode[extra["jurisdiction"]]
            }
        }
        if (typeof extra["polymeshDid"] === "string"
            && extra["polymeshDid"] !== ""
            && !(extra["polymeshDid"] as string).match(polymeshDidRegex)) {
            throw new InvalidPolymeshDidError(extra["polymeshDid"])
        } else if (typeof extra["polymeshDid"] === "string") {
            this.polymeshDid = extra["polymeshDid"]
        }
    }

}

export class CustomerInfoError {
    constructor () {
        Error.apply(this, arguments)
    }
}

export class InvalidCountryCodeError extends CustomerInfoError {
    constructor (public countryCode: string) {
        super()
    }
}

export class InvalidPolymeshDidError extends CustomerInfoError {
    constructor (public polymeshDid: string) {
        super()
    }
}
