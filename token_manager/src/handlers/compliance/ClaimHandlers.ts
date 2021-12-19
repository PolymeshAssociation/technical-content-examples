import {
    Claim,
    ClaimType,
    CountryCode,
    isInvestorUniquenessClaim,
    isScopedClaim,
    Scope,
    ScopeType,
    TrustedClaimIssuer,
} from "@polymathnetwork/polymesh-sdk/types";
import {
    assertUnreachable,
    isCddClaim,
    isInvestorUniquenessV2Claim,
    isJurisdictionClaim,
} from "../../types";
import { IdentityGetter } from "./ComplianceHandlers";

export type OnScopeChanged = (scope: Scope) => void
export type OnClaimChanged = (claim: Claim) => void
export type OnClaimsChanged = (claims: Claim[]) => void
export type OnTrustedIssuerChanged = (trustedClaimIssuer: TrustedClaimIssuerFlat) => void
export type OnTrustedIssuersChanged = (trustedClaimIssuers: TrustedClaimIssuerFlat[]) => void

export interface TrustedClaimIssuerFlat {
    identity: string
    trustedFor: ClaimType[]
}

export const getDummyClaim = (): Claim => ({
    type: ClaimType.NoData
})

export const convertTrustedClaimIssuerToFlat = (trustedClaimIssuer: TrustedClaimIssuer): TrustedClaimIssuerFlat => ({
    identity: trustedClaimIssuer.identity.did,
    trustedFor: trustedClaimIssuer.trustedFor ?? [],
})

export const convertTrustedClaimIssuerFlatToCorrect = (getter: IdentityGetter) => async (flat: TrustedClaimIssuerFlat): Promise<TrustedClaimIssuer> => ({
    identity: await getter(flat.identity),
    trustedFor: flat.trustedFor,
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