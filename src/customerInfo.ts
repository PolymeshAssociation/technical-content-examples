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
        if (!Object.values(CountryCode).includes(info["country"])) {
            throw new InvalidCountryCodeError(info["country"])
        }
        this.country = info["country"]
        this.passport = info["passport"]
        this.valid = typeof info["valid"] === "undefined" ? false : info["valid"]
        if (!Object.values(CountryCode).includes(info["jurisdiction"])) {
            throw new InvalidCountryCodeError(info["jurisdiction"])
        }
        this.jurisdiction = CountryCode[info["jurisdiction"]]
        if (typeof info["polymeshDid"] !== "undefined"
            && info["polymeshDid"] !== null
            && !(info["polymeshDid"] as string).match(polymeshDidRegex)) {
            throw new InvalidPolymeshDidError(info["polymeshDid"])
        }
        this.polymeshDid = info["polymeshDid"] || null
        // TODO verify id formatting
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
        if (typeof extra["country"] !== "undefined" && !Object.values(CountryCode).includes(extra["country"])) {
            throw new InvalidCountryCodeError(extra["country"])
        }
        this.country = typeof extra["country"] !== "undefined" ? CountryCode[extra["country"]] : this.country
        this.passport = typeof extra["passport"] !== "undefined" ? extra["passport"] : this.passport
        this.valid = typeof extra["valid"] !== "undefined" ? extra["valid"] : this.valid
        if (typeof extra["jurisdiction"] !== "undefined" && !Object.values(CountryCode).includes(extra["jurisdiction"])) {
            throw new InvalidCountryCodeError(extra["jurisdiction"])
        }
        this.jurisdiction = typeof extra["jurisdiction"] !== "undefined" ? CountryCode[extra["jurisdiction"]] : this.jurisdiction
        if (typeof extra["polymeshDid"] !== "undefined" && !(extra["polymeshDid"] as string).match(polymeshDidRegex)) {
            throw new InvalidPolymeshDidError(extra["polymeshDid"])
        }
        this.polymeshDid = typeof extra["polymeshDid"] !== "undefined" ? extra["polymeshDid"] : this.polymeshDid
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
