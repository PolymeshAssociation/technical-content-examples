import countries from "i18n-iso-countries"
import type { InjectedExtension } from '@polkadot/extension-inject/types';
import {
    Account,
    AgentWithGroup,
    CddClaim,
    CheckpointWithData,
    Claim,
    ClaimType,
    Condition,
    ConditionType,
    CountryCode,
    DefaultPortfolio,
    DistributionParticipant,
    DividendDistributionDetails,
    EventIdentifier,
    GroupPermissions,
    Identity,
    IdentityCondition,
    InvestorUniquenessV2Claim,
    ModuleName,
    NumberedPortfolio,
    Requirement,
    ScheduleWithDetails,
    Scope,
    SecurityToken,
    SecurityTokenDetails,
    TickerReservation,
    TickerReservationDetails,
    TokenIdentifier,
    TxTag,
} from "@polymathnetwork/polymesh-sdk/types"
import {
    AuthorizationRequest,
    Checkpoint,
    CheckpointSchedule,
    CorporateAction,
    CustomPermissionGroup,
    DividendDistribution,
    KnownPermissionGroup,
} from "@polymathnetwork/polymesh-sdk/internal"
import { BigNumber } from "@polymathnetwork/polymesh-sdk"
import { ScopeClaimProof } from "@polymathnetwork/polymesh-sdk/types/internal"
import { Requirements } from "@polymathnetwork/polymesh-sdk/api/entities/SecurityToken/Compliance/Requirements"
import { Permissions } from "@polymathnetwork/polymesh-sdk/api/entities/SecurityToken/Permissions"
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
    polyWallet: PolyWallet | null
    ticker: string
    myDid: string
    myAddress: string
    myTickers: string[]
    reservation: ReservationInfoJson
    token: TokenInfoJson
    permissions: PermissionsInfoJson
    requirements: RequirementsInfoJson
    authorisations: AuthorisationInfoJson
    portfolios: PortfoliosInfoJson
    checkpoints: CheckpointsInfoJson
    corporateActions: CorporateActionsInfoJson
}

export type ReservationInfoJson = {
    current: TickerReservation | null,
    details: TickerReservationDetails | null,
}

export function getEmptyReservation(): ReservationInfoJson {
    return {
        current: null,
        details: null,
    }
}

export type TokenInfoJson = {
    current: SecurityToken | null
    createdAt: EventIdentifier | null
    details: SecurityTokenDetails | null
    currentFundingRound: string
    tokenIdentifiers: TokenIdentifier[]
}

export function getEmptyTokenInfoJson(): TokenInfoJson {
    return {
        current: null,
        details: null,
        createdAt: null,
        currentFundingRound: "",
        tokenIdentifiers: [],
    }
}

export type PermissionGroupInfoJson<GroupType extends KnownPermissionGroup | CustomPermissionGroup> = {
    current: GroupType
    permissions: GroupPermissions
    exists: boolean
}

// Should be part of the SDK. Remove when it is part of the SDK.
export type PermissionGroupsInfo = {
    known: KnownPermissionGroup[]
    custom: CustomPermissionGroup[]
}

export type PermissionGroupsInfoJson = {
    known: PermissionGroupInfoJson<KnownPermissionGroup>[]
    custom: PermissionGroupInfoJson<CustomPermissionGroup>[]
}

export function getEmptyPermissionGroupsInfoJson(): PermissionGroupsInfoJson {
    return {
        known: [],
        custom: [],
    }
}

export type PermissionsInfoJson = {
    original: Permissions | null
    groups: PermissionGroupsInfoJson
    agents: AgentWithGroup[]
}

export function getEmptyPermissionsInfoJson(): PermissionsInfoJson {
    return {
        original: null,
        groups: getEmptyPermissionGroupsInfoJson(),
        agents: [],
    }
}

export type RequirementsInfoJson = {
    original: Requirements | null
    current: Requirement[]
    arePaused: boolean
    canManipulate: boolean
}

export function getEmptyRequirements(): RequirementsInfoJson {
    return {
        original: null,
        current: [],
        arePaused: true,
        canManipulate: false,
    }
}

export type AuthorisationInfoJson = {
    current: AuthorizationRequest[]
}

export type PortfoliosInfoJson = {
    picked: PortfolioInfoJson | null
}

export type PortfolioInfoJson = {
    original: DefaultPortfolio | NumberedPortfolio
    name: string | null
    exists: boolean
    custodian: string
    createdAt: EventIdentifier | null
}

export type CheckpointsInfoJson = {
    current: Checkpoint[]
    details: CheckpointInfoJson[]
    picked: CheckpointInfoJson | null
    currentSchedules: CheckpointSchedule[]
    scheduleDetails: CheckpointScheduleDetailsInfoJson[]
}

export function getEmptyCheckpointsInfoJson(): CheckpointsInfoJson {
    return {
        current: [],
        details: [],
        picked: null,
        currentSchedules: [],
        scheduleDetails: [],
    }
}

export type CheckpointInfoJson = {
    checkpoint: Checkpoint
    exists: boolean
    totalSupply: BigNumber
    createdAt: Date
}

export type CheckpointScheduleInfoJson = {
    schedule: CheckpointSchedule
    createdCheckpoints: CheckpointInfoJson[]
    exists: boolean
}

export type CheckpointScheduleDetailsInfoJson = CheckpointScheduleInfoJson & {
    remainingCheckpoints: number
    nextCheckpointDate: Date
}

export type CorporateActionsInfoJson = {
    distributions: DistributionsInfoJson
}

export type DistributionsInfoJson = {
    dividends: DividendDistributionInfoJson[]
}

export type CorporateActionInfoJson = {
    current: CorporateAction
    exists: boolean
    checkpoint: CheckpointInfoJson | null
    checkpointSchedule: CheckpointScheduleInfoJson | null
}

export type DividendDistributionInfoJson = Omit<CorporateActionInfoJson, "current"> & {
    current: DividendDistribution
    origin: PortfolioInfoJson
    exists: boolean
    details: DividendDistributionDetails
    participants: DistributionParticipant[]
}

export function getEmptyMyInfo(): MyInfoJson {
    return {
        polyWallet: null,
        ticker: "",
        myDid: "",
        myAddress: "",
        myTickers: [],
        reservation: getEmptyReservation(),
        token: getEmptyTokenInfoJson(),
        permissions: getEmptyPermissionsInfoJson(),
        requirements: getEmptyRequirements(),
        authorisations: {
            current: [],
        },
        portfolios: {
            picked: null,
        },
        checkpoints: getEmptyCheckpointsInfoJson(),
        corporateActions: {
            distributions: {
                dividends: [],
            },
        },
    }
}

export const isIdentity = (identity: string | Identity): identity is Identity => typeof (identity as Identity).did !== "undefined"
export const isIdentityNotAccount = (identity: Identity | Account): identity is Identity => typeof (identity as Identity).did !== "undefined"
export const isAccount = (account: string | Account): account is Account => typeof (account as Account).address !== "undefined"
export const isKnownPermissionGroup = (group: KnownPermissionGroup | CustomPermissionGroup): group is KnownPermissionGroup => typeof (group as KnownPermissionGroup).type !== "undefined"
export const isCustomPermissionGroup = (group: KnownPermissionGroup | CustomPermissionGroup): group is CustomPermissionGroup => typeof (group as CustomPermissionGroup).id !== "undefined"
export const isNumberedPortfolio = (portfolio: DefaultPortfolio | NumberedPortfolio): portfolio is NumberedPortfolio => typeof (portfolio as NumberedPortfolio).id !== "undefined"
export const isIdentityCondition = (condition: Condition): condition is IdentityCondition => (condition as IdentityCondition).type === ConditionType.IsIdentity
export const isScopeClaimProof = (claim: string | ScopeClaimProof): claim is ScopeClaimProof => typeof (claim as ScopeClaimProof).proofScopeIdCddIdMatch !== "undefined"
export const isInvestorUniquenessV2Claim = (claim: Claim): claim is InvestorUniquenessV2Claim => (claim as InvestorUniquenessV2Claim).type === ClaimType.InvestorUniquenessV2
export const isJurisdictionClaim = (claim: Claim): claim is JurisdictionClaim => (claim as JurisdictionClaim).type === ClaimType.Jurisdiction
export const isCddClaim = (claim: Claim): claim is CddClaim => (claim as CddClaim).type === ClaimType.CustomerDueDiligence
export const isCheckpointWithData = (checkpointWith: CheckpointWithData | Checkpoint): checkpointWith is CheckpointWithData => typeof (checkpointWith as CheckpointWithData).checkpoint !== "undefined"
export const isCheckpointSchedule = (checkpoint: Checkpoint | CheckpointSchedule): checkpoint is CheckpointSchedule => typeof (checkpoint as CheckpointSchedule).period !== "undefined"
export const isScheduleWithDetails = (schedule: CheckpointSchedule | ScheduleWithDetails): schedule is ScheduleWithDetails => typeof (schedule as ScheduleWithDetails).schedule !== "undefined"
export const isTxTagNotModuleName = (tag: TxTag | ModuleName): tag is TxTag => (tag.indexOf(".") > -1)
export const isModuleNameNotTxTag = (tag: TxTag | ModuleName): tag is ModuleName => (tag.indexOf(".") <= -1)

// This declaration should be part of the SDK. Remove when it is part of it.
export declare type JurisdictionClaim = {
    type: ClaimType.Jurisdiction
    code: CountryCode
    scope: Scope
}

export type PolyWallet = InjectedExtension & {
    network: {
        get: () => Promise<any>
        subscribe: (any) => void
    }
    uid: {
        requestProof: (any) => any
        provide: (any) => any
    }
}

/**
 * For type safety. See https://schneidenbach.gitbooks.io/typescript-cookbook/content/nameof-operator.html
 */
export const nameofFactory = <T>() => (name: keyof T) => name;

/**
 * For exhaustiveness via compiler:
 * https://stackoverflow.com/questions/39419170/how-do-i-check-that-a-switch-block-is-exhaustive-in-typescript
 */
export const assertUnreachable = (x: never): never => { throw new Error("Didn't expect to get here") }