import { ClaimType, TrustedClaimIssuer } from "@polymathnetwork/polymesh-sdk/types"
import { IdentityGetter } from "../compliance/ComplianceHandlers"

export type OnTrustedIssuerChanged = (trustedClaimIssuer: TrustedClaimIssuerFlat) => void
export type OnTrustedIssuersChanged = (trustedClaimIssuers: TrustedClaimIssuerFlat[]) => void

export interface TrustedClaimIssuerFlat {
    identity: string
    trustedFor: ClaimType[]
}

export const getDummyTrustedClaimIssuerFlat = (): TrustedClaimIssuerFlat => ({
    identity: "",
    trustedFor: [],
})

export const convertTrustedClaimIssuerToFlat = (trustedClaimIssuer: TrustedClaimIssuer): TrustedClaimIssuerFlat => ({
    identity: trustedClaimIssuer.identity.did,
    trustedFor: trustedClaimIssuer.trustedFor ?? [],
})

export const convertTrustedClaimIssuerFlatToCorrect = (getter: IdentityGetter) => async (flat: TrustedClaimIssuerFlat): Promise<TrustedClaimIssuer> => ({
    identity: await getter(flat.identity),
    trustedFor: flat.trustedFor,
})
