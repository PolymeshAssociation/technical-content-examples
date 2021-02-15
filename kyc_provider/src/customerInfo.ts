export interface ICustomerInfo {
    name: string
    country: string
    passport: string
    valid: boolean
    toJSON(): JSON
    patch(extra: JSON): void
}

export class CustomerInfo implements ICustomerInfo {
    name: string
    country: string
    passport: string
    valid: boolean

    constructor(info: JSON) {
        this.name = info["name"]
        this.country = info["country"]
        this.passport = info["passport"]
        this.valid = typeof info["valid"] === "undefined" ? false : info["valid"]
    }

    toJSON(): JSON {
        return <JSON><unknown>{
            "name": this.name,
            "country": this.country,
            "passport": this.passport,
            "valid": this.valid,
        }
    }

    patch(extra: JSON): void {
        this.name = typeof extra["name"] !== "undefined" ? extra["name"] : this.name
        this.country = typeof extra["country"] !== "undefined" ? extra["country"] : this.country
        this.passport = typeof extra["passport"] !== "undefined" ? extra["passport"] : this.passport
        this.valid = typeof extra["valid"] !== "undefined" ? extra["valid"] : this.valid
    }

}

export class CustomerInfoError {
    constructor () {
        Error.apply(this, arguments)
    }
}
