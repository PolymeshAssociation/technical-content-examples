import countries from "i18n-iso-countries"
countries.registerLocale(require("i18n-iso-countries/langs/en.json"))

export declare type CountryInfo = {
    value: string
    label: string
}
  
export function getCountryList(): CountryInfo[] {
    return Object.entries(countries.getNames("en", { select: "official" })).map(([code, countryName]) => {
        return {
            "value": code.charAt(0) + code.charAt(1).toLocaleLowerCase(),
            "label": countryName
        }
    })
}
