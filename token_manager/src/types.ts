import countries from "i18n-iso-countries"
import {
    CddClaim,
    CheckpointWithCreationDate,
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
    Checkpoint,
    CheckpointSchedule,
    CreateCheckpointScheduleParams,
    ModifyPrimaryIssuanceAgentParams,
} from "@polymathnetwork/polymesh-sdk/internal"
import { BigNumber } from "@polymathnetwork/polymesh-sdk"
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
    attestations: AttestationsInfoJson,
    checkpoints: CheckpointsInfoJson,
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

export type AttestationsInfoJson = {
    current: ClaimData<Claim>[],
    otherTarget: string,
    toAdd: {
        target: string,
        expiry: Date | null,
        claim: Claim,
    },
    uniquenessToAdd: AddInvestorUniquenessClaimParams,
}

export type CheckpointsInfoJson = {
    current: CheckpointWithCreationDate[],
    details: CheckpointInfoJson[],
    scheduledToAdd: CreateCheckpointScheduleParams,
    currentSchedules: CheckpointSchedule[],
    scheduleDetails: CheckpointScheduleInfoJson[],
}

export type CheckpointInfoJson = {
    checkpoint: Checkpoint,
    totalSupply: BigNumber,
    createdAt: Date,
    whoseBalance: string,
    balance: BigNumber,
}

export type CheckpointScheduleInfoJson = {
    schedule: CheckpointSchedule,
    remainingCheckpoints: number,
    nextCheckpointDate: Date,
    createdCheckpoints: CheckpointInfoJson[],
    exists: boolean,
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
export const isCheckpointWithCreationDate = (checkpointInfo: CheckpointWithCreationDate | Checkpoint): checkpointInfo is CheckpointWithCreationDate => typeof (checkpointInfo as CheckpointWithCreationDate).createdAt !== "undefined"

