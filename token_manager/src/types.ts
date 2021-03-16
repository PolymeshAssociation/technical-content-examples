import countries from "i18n-iso-countries"
import { CountryCode } from "@polymathnetwork/polymesh-sdk/types"
countries.registerLocale(require("i18n-iso-countries/langs/en.json"))

export declare type CountryInfo = {
    value: string
    label: string
}

export function getCountryList(): CountryInfo[] {
    return Object.values(CountryCode).sort().map((code: string) => {
        return {
            "value": code,
            "label": countries.getName(code.toUpperCase(), "en") || code,
        }
    })
}
