import { Claim, ClaimData } from "@polymathnetwork/polymesh-sdk/types";
import { IdentityGetter } from "../compliance/ComplianceHandlers";

export type OnClaimDataChanged = (claimData: ClaimDataFlat) => void
export type OnClaimDatasChanged = (claimDatas: ClaimDataFlat[]) => void

export interface ClaimDataFlat {
    target: string
    issuer: string
    issuedAt: Date | null
    expiry: Date | null
    claim: Claim
}

export const convertClaimDataToFlat = (claimData: ClaimData<Claim>): ClaimDataFlat => ({
    target: claimData.target.did,
    issuer: claimData.issuer.did,
    issuedAt: claimData.issuedAt,
    expiry: claimData.expiry,
    claim: claimData.claim,
})

export const convertClaimDataFlatToCorrect = (getter: IdentityGetter) => async (flat: ClaimDataFlat): Promise<ClaimData<Claim>> => ({
    target: await getter(flat.target),
    issuer: await getter(flat.issuer),
    issuedAt: flat.issuedAt,
    expiry: flat.expiry,
    claim: flat.claim,
})
