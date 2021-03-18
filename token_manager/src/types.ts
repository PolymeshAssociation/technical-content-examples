import countries from "i18n-iso-countries"
import {
    CddClaim,
    Claim,
    ClaimData,
    ClaimTarget,
    ClaimType,
    Condition,
    ConditionType,
    CountryCode,
    IdentityCondition,
    InvestorUniquenessClaim,
    PrimaryIssuanceAgentCondition,
    Requirement,
    SecurityToken,
    SecurityTokenDetails,
    TickerReservation,
    TickerReservationDetails,
    UnscopedClaim,
} from "@polymathnetwork/polymesh-sdk/types"
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

export type MyInfoJson = {
    ticker: string,
    myDid: string,
    myTickers: string[],
    reservation: ReservationInfoJson,
    token: TokenInfoJson,
    requirements: RequirementsInfoJson,
    attestations: AttestationsInfoJSON,
}

export type ReservationInfoJson = {
    fetchTimer: NodeJS.Timeout,
    current: TickerReservation,
    details: TickerReservationDetails,
    detailsJson: {
        owner: string,
        expiryDate: string,
        status: string,
    }
}

export type TokenInfoJson = {
    current: SecurityToken,
    details: SecurityTokenDetails,
    detailsJson: {
        name: string,
        assetType: string,
        owner: string,
        divisible: boolean,
        totalSupply: string,
        primaryIssuanceAgent: string,
    },
    ownershipTarget: string,
}

export type RequirementsInfoJson = {
    current: Requirement[],
    arePaused: boolean,
    canManipulate: boolean,
    modified: boolean,
    settleSimulation: {
        sender: string,
        recipient: string,
        works: boolean | null,
    },
}

export type AttestationsInfoJSON = {
    current: ClaimData<Claim>[],
    otherTarget: string,
    toAdd: {
        target: string,
        expiry: Date | null,
        claim: Claim,
    }
}

export interface HasFetchTimer {
    fetchTimer: NodeJS.Timeout | null
}

export const isIdentityCondition = (condition: Condition): condition is IdentityCondition => (condition as IdentityCondition).type === ConditionType.IsIdentity
export const isPrimaryIssuanceAgentCondition = (condition: Condition): condition is PrimaryIssuanceAgentCondition => (condition as PrimaryIssuanceAgentCondition).type === ConditionType.IsPrimaryIssuanceAgent
export const isUnScopedClaim = (claim: Claim): claim is UnscopedClaim => isCddClaim(claim) || (claim as UnscopedClaim).type === ClaimType.NoData
export const isInvestorUniquenessClaim = (claim: Claim): claim is InvestorUniquenessClaim => (claim as InvestorUniquenessClaim).type === ClaimType.InvestorUniqueness
export const isCddClaim = (claim: Claim): claim is CddClaim => (claim as CddClaim).type === ClaimType.CustomerDueDiligence
export const isClaimData = (claimData: ClaimData | ClaimTarget): claimData is ClaimData => typeof (claimData as ClaimData).issuedAt !== "undefined"

