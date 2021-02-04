export interface ICustomerInfo {
    name: string
    country: string
    passport: string
    valid: boolean
    toJSON(): JSON
}

export class CustomerInfo implements ICustomerInfo {
    name: string;
    country: string;
    passport: string;
    valid: boolean;

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
            "valid": this.valid
        }
    }

}
