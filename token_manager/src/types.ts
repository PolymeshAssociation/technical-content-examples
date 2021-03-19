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
    DefaultPortfolio,
    IdentityCondition,
    InvestorUniquenessClaim,
    NumberedPortfolio,
    PrimaryIssuanceAgentCondition,
    Requirement,
    SecurityToken,
    SecurityTokenDetails,
    TickerReservation,
    TickerReservationDetails,
    UnscopedClaim,
} from "@polymathnetwork/polymesh-sdk/types"
import {
    AddInvestorUniquenessClaimParams,
    AuthorizationRequest,
    ModifyPrimaryIssuanceAgentParams,
} from "@polymathnetwork/polymesh-sdk/internal"
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
    myAddress: string,
    myTickers: string[],
    reservation: ReservationInfoJson,
    token: TokenInfoJson,
    requirements: RequirementsInfoJson,
    authorisations: AuthorisationInfoJson,
    portfolios: PortfoliosInfoJson,
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
    piaBalance: {
        locked: string,
        total: string,
        toIssue: number,
        toRedeem: number,
    },
    ownershipTarget: string,
    piaChangeInfo: ModifyPrimaryIssuanceAgentParams,
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

export type AuthorisationInfoJson = {
    current: AuthorizationRequest[],
}

export type AttestationsInfoJSON = {
    current: ClaimData<Claim>[],
    otherTarget: string,
    toAdd: {
        target: string,
        expiry: Date | null,
        claim: Claim,
    },
    uniquenessToAdd: AddInvestorUniquenessClaimParams,
}

export type PortfoliosInfoJson = {
    current: [DefaultPortfolio, ...NumberedPortfolio[]] | null,
    otherOwner: string,
    details: PortfolioInfoJson[],
}

export type PortfolioInfoJson = {
    original: DefaultPortfolio |NumberedPortfolio,
    owner: string,
    id: string | null,
    custodian: string,
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

