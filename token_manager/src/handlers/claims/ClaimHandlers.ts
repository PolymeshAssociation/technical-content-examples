import { AddInvestorUniquenessClaimParams } from "@polymathnetwork/polymesh-sdk/api/procedures/addInvestorUniquenessClaim";
import {
    Claim,
    ClaimType,
    CountryCode,
    isInvestorUniquenessClaim,
    isScopedClaim,
    Scope,
    ScopeType,
} from "@polymathnetwork/polymesh-sdk/types";
import {
    assertUnreachable,
    isCddClaim,
    isInvestorUniquenessV2Claim,
    isJurisdictionClaim,
} from "../../types";

export type OnScopeChanged = (scope: Scope) => void
export type OnClaimChanged = (claim: Claim) => void
export type OnClaimsChanged = (claims: Claim[]) => void
export type OnAddInvestorUniquenessClaimParamsChanged = (params: AddInvestorUniquenessClaimParams) => void

export const getDummyClaim = (): Claim => ({
    type: ClaimType.NoData
})

export const getDummyAddInvestorUniquenessClaimParams = (): AddInvestorUniquenessClaimParams => ({
    scope: {
        type: ScopeType.Ticker,
        value: "",
    },
    cddId: "",
    proof: "",
    scopeId: "",
    expiry: null,
})

export interface ClaimFlat {
    type: ClaimType
    id: string
    scope: Scope
    cddId: string
    scopeId: string
    code: CountryCode
    modified: boolean
}

export const convertClaimToFlat = (claim: Claim): ClaimFlat => ({
    type: claim.type,
    id: isCddClaim(claim) ? claim.id : "",
    scope: isScopedClaim(claim) ? claim.scope : {
        type: ScopeType.Custom,
        value: "",
    },
    cddId: isInvestorUniquenessClaim(claim) || isInvestorUniquenessV2Claim(claim) ? claim.cddId : "",
    scopeId: isInvestorUniquenessClaim(claim) ? claim.scopeId : "",
    code: isJurisdictionClaim(claim) ? claim.code : CountryCode.Ad,
    modified: true,
})

export const convertClaimFlatToClaim = (state: ClaimFlat): Claim => {
    switch (state.type) {
        case ClaimType.CustomerDueDiligence: return {
            type: state.type,
            id: state.id,
        }
        case ClaimType.InvestorUniqueness: return {
            type: state.type,
            scope: state.scope,
            cddId: state.cddId,
            scopeId: state.scopeId,
        }
        case ClaimType.InvestorUniquenessV2: return {
            type: state.type,
            cddId: state.cddId,
        }
        case ClaimType.Jurisdiction: return {
            type: state.type,
            code: state.code,
            scope: state.scope,
        }
        case ClaimType.NoData: return {
            type: state.type
        }
        case ClaimType.Accredited:
        case ClaimType.Affiliate:
        case ClaimType.Blocked:
        case ClaimType.BuyLockup:
        case ClaimType.Exempted:
        case ClaimType.KnowYourCustomer:
        case ClaimType.SellLockup: return {
            type: state.type,
            scope: state.scope,
        }
        default: assertUnreachable(state.type)
    }
}