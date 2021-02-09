export interface ICustomerInfo {
    name: string
    country: string
    passport: string
    valid: boolean
    jurisdiction: string
    polymeshId: string
    toJSON(): JSON
    patch(extra: JSON): void
}

export class CustomerInfo implements ICustomerInfo {
    name: string;
    country: string;
    passport: string;
    valid: boolean;
    jurisdiction: string;
    polymeshId: string;

    constructor(info: JSON) {
        this.name = info["name"]
        this.country = info["country"]
        this.passport = info["passport"]
        this.valid = typeof info["valid"] === "undefined" ? false : info["valid"]
        this.jurisdiction = info["jurisdiction"]
        this.polymeshId = info["polymeshId"]
        // TODO verify id formatting
    }

    toJSON(): JSON {
        return <JSON><unknown>{
            "name": this.name,
            "country": this.country,
            "passport": this.passport,
            "valid": this.valid,
            "jurisdiction": this.jurisdiction,
            "polymeshId": this.polymeshId
        }
    }

    patch(extra: JSON): void {
        this.name = typeof extra["name"] !== "undefined" ? extra["name"] : this.name
        this.country = typeof extra["country"] !== "undefined" ? extra["nacountryme"] : this.country
        this.passport = typeof extra["passport"] !== "undefined" ? extra["passport"] : this.passport
        this.valid = typeof extra["valid"] !== "undefined" ? extra["valid"] : this.valid
        this.jurisdiction = typeof extra["jurisdiction"] !== "undefined" ? extra["jurisdiction"] : this.jurisdiction
        this.polymeshId = typeof extra["polymeshId"] !== "undefined" ? extra["polymeshId"] : this.polymeshId
    }

}
