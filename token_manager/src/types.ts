import countries from "i18n-iso-countries"
import {
    CalendarUnit,
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
    DistributionParticipant,
    DividendDistributionDetails,
    EventIdentifier,
    IdentityCondition,
    InvestorUniquenessClaim,
    KnownTokenType,
    NumberedPortfolio,
    PrimaryIssuanceAgentCondition,
    Requirement,
    Scope,
    ScopeType,
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
    ConfigureDividendDistributionParams,
    CorporateAction,
    CreateCheckpointScheduleParams,
    DividendDistribution,
    Identity,
    ModifyCorporateActionsAgentParams,
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

export type MyInfoPath = (string | number)[]

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
    corporateActions: CorporateActionsInfoJson,
}

export type ReservationInfoJson = {
    fetchTimer: NodeJS.Timeout,
    current: TickerReservation,
    details: TickerReservationDetails,
}

export type TokenInfoJson = {
    current: SecurityToken,
    createdAt: EventIdentifier,
    details: SecurityTokenDetails,
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
    mine: [DefaultPortfolio, ...NumberedPortfolio[]],
    otherOwner: string,
    details: PortfolioInfoJson[],
    myDetails: PortfolioInfoJson[],
    newPortfolioName: string,
}

export type PortfolioInfoJson = {
    original: DefaultPortfolio | NumberedPortfolio,
    owner: string,
    id: string | null,
    name: string,
    custodian: string,
    newCustodian: string,
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
    scheduleDetails: CheckpointScheduleDetailsInfoJson[],
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
    createdCheckpoints: CheckpointInfoJson[],
    exists: boolean,
}

export type CheckpointScheduleDetailsInfoJson = CheckpointScheduleInfoJson & {
    remainingCheckpoints: number,
    nextCheckpointDate: Date,
}

export type CorporateActionsInfoJson = {
    distributions: DistributionsInfoJson,
    agent: Identity,
    newAgent: ModifyCorporateActionsAgentParams,
}

export type DistributionsInfoJson = {
    dividends: DividendDistributionInfoJson[],
    newDividend: ConfigureDividendDistributionParams,
}

export type CorporateActionInfoJson = {
    current: CorporateAction,
    exists: boolean,
    checkpoint: CheckpointInfoJson | null,
    checkpointSchedule: CheckpointScheduleInfoJson | null,
}

export type DividendDistributionInfoJson = Omit<CorporateActionInfoJson, "current"> & {
    current: DividendDistribution,
    origin: PortfolioInfoJson,
    details: DividendDistributionDetails,
    participants: DistributionParticipant[],
}

export function getEmptyTokenDetails(): SecurityTokenDetails {
    return {
        assetType: KnownTokenType.EquityCommon,
        isDivisible: false,
        name: "",
        owner: null,
        totalSupply: new BigNumber("0"),
        primaryIssuanceAgent: null,
    }
}

export function getEmptyRequirements(): RequirementsInfoJson {
    return {
        current: [] as Requirement[],
        arePaused: true as boolean,
        canManipulate: false as boolean,
        modified: false as boolean,
        settleSimulation: {
            sender: "" as string,
            recipient: "" as string,
            works: null as boolean | null,
        },
    }
}

export function getEmptyMyInfo(): MyInfoJson {
    return {
        ticker: "" as string,
        myDid: "" as string,
        myAddress: "" as string,
        myTickers: [] as string[],
        reservation: {
            fetchTimer: null as NodeJS.Timeout,
            current: null as TickerReservation,
            details: null as TickerReservationDetails,
        } as ReservationInfoJson,
        token: {
            current: null as SecurityToken,
            details: getEmptyTokenDetails() as SecurityTokenDetails,
            piaBalance: {
                locked: "" as string,
                total: "" as string,
                toIssue: 0 as number,
                toRedeem: 0 as number,
            },
            ownershipTarget: "" as string,
            piaChangeInfo: {
                target: "" as string | Identity,
                requestExpiry: null as Date | null,
            } as ModifyPrimaryIssuanceAgentParams,
        } as TokenInfoJson,
        requirements: getEmptyRequirements() as RequirementsInfoJson,
        authorisations: {
            current: [] as AuthorizationRequest[],
        } as AuthorisationInfoJson,
        attestations: {
            current: [] as ClaimData<Claim>[],
            otherTarget: "" as string,
            toAdd: {
                target: "" as string,
                expiry: null as Date | null,
                claim: {
                    type: ClaimType.NoData,
                } as Claim,
            } as ClaimTarget,
            uniquenessToAdd: {
                scope: {
                    type: ScopeType.Ticker,
                    value: "" as string,
                } as Scope,
                cddId: "" as string,
                proof: "" as string,
                scopeId: "" as string,
                expiry: null as Date | null,
            } as AddInvestorUniquenessClaimParams,
        } as AttestationsInfoJson,
        portfolios: {
            current: null as [DefaultPortfolio, ...NumberedPortfolio[]] | null,
            mine: [] as [DefaultPortfolio, ...NumberedPortfolio[]],
            otherOwner: "" as string,
            details: [] as PortfolioInfoJson[],
            myDetails: [] as PortfolioInfoJson[],
            newPortfolioName: "",
        },
        checkpoints: {
            current: [] as CheckpointWithCreationDate[],
            details: [] as CheckpointInfoJson[],
            scheduledToAdd: {
                start: new Date(),
                period: {
                    amount: 3,
                    unit: CalendarUnit.Month,
                },
                repetitions: 0,
            },
            currentSchedules: [] as CheckpointSchedule[],
            scheduleDetails: [] as CheckpointScheduleDetailsInfoJson[],
        },
        corporateActions: {
            distributions: {
                dividends: [] as DividendDistributionInfoJson[],
                newDividend: {
                    declarationDate: new Date(),
                    checkpoint: null as Checkpoint,
                    description: "" as string,
                    taxWithholdings: [],
                    originPortfolio: null,
                    currency: "",
                    perShare: new BigNumber(0),
                    maxAmount: new BigNumber(0),
                    paymentDate: new Date,
                    expiryDate: null,
                },
            },
            agent: null as Identity,
            newAgent: {
                target: "" as string | Identity,
                requestExpiry: null as Date | null,
            } as ModifyCorporateActionsAgentParams
        },
    }
}

export interface HasFetchTimer {
    fetchTimer: NodeJS.Timeout | null
}

export const isNumberedPortfolio = (portfolio: DefaultPortfolio | NumberedPortfolio): portfolio is NumberedPortfolio => typeof (portfolio as NumberedPortfolio).id !== "undefined"
export const isIdentityCondition = (condition: Condition): condition is IdentityCondition => (condition as IdentityCondition).type === ConditionType.IsIdentity
export const isPrimaryIssuanceAgentCondition = (condition: Condition): condition is PrimaryIssuanceAgentCondition => (condition as PrimaryIssuanceAgentCondition).type === ConditionType.IsPrimaryIssuanceAgent
export const isUnScopedClaim = (claim: Claim): claim is UnscopedClaim => isCddClaim(claim) || (claim as UnscopedClaim).type === ClaimType.NoData
export const isInvestorUniquenessClaim = (claim: Claim): claim is InvestorUniquenessClaim => (claim as InvestorUniquenessClaim).type === ClaimType.InvestorUniqueness
export const isCddClaim = (claim: Claim): claim is CddClaim => (claim as CddClaim).type === ClaimType.CustomerDueDiligence
export const isClaimData = (claimData: ClaimData | ClaimTarget): claimData is ClaimData => typeof (claimData as ClaimData).issuedAt !== "undefined"
export const isCheckpointWithCreationDate = (checkpointInfo: CheckpointWithCreationDate | Checkpoint): checkpointInfo is CheckpointWithCreationDate => typeof (checkpointInfo as CheckpointWithCreationDate).createdAt !== "undefined"
export const isCheckpointSchedule = (checkpoint: Checkpoint | CheckpointSchedule): checkpoint is CheckpointSchedule => typeof (checkpoint as CheckpointSchedule).period !== "undefined"

