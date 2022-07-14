import {
    Claim,
    Condition,
    ConditionBase,
    ConditionTarget,
    ConditionType,
    isMultiClaimCondition,
    isSingleClaimCondition,
} from "@polymathnetwork/polymesh-sdk/types"
import { assertUnreachable, isIdentityCondition } from "../../types"
import { getDummyClaim } from "../claims/ClaimHandlers"
import {
    convertTrustedClaimIssuerFlatToCorrect,
    convertTrustedClaimIssuerToFlat,
    TrustedClaimIssuerFlat,
} from "../claims/TrustedClaimIssuerHandlers"
import { IdentityGetter } from "./ComplianceHandlers"

export type OnConditionChanged = (condition: ConditionFlat) => void
export type OnConditionsChanged = (conditions: ConditionFlat[]) => void

export interface ConditionFlat {
    target: ConditionTarget
    trustedClaimIssuers: TrustedClaimIssuerFlat[]
    type: ConditionType
    claim: Claim | null
    claims: Claim[]
    identity: string
}

export const getDummyConditionFlat = (): ConditionFlat => ({
    target: ConditionTarget.Both,
    trustedClaimIssuers: [],
    type: ConditionType.IsPresent,
    claim: getDummyClaim(),
    claims: [],
    identity: "",
})

export const convertConditionToFlat = (condition: Condition): ConditionFlat => ({
    target: condition.target,
    trustedClaimIssuers: condition.trustedClaimIssuers.map(convertTrustedClaimIssuerToFlat),
    type: condition.type,
    claim: isSingleClaimCondition(condition) ? condition.claim : null,
    claims: isMultiClaimCondition(condition) ? condition.claims : [],
    identity: isIdentityCondition(condition) ? condition.identity.did : "",
})

export const convertConditionFlatToCondition = (getter: IdentityGetter) => async (flat: ConditionFlat): Promise<Condition> => {
    const base: ConditionBase = {
        target: flat.target,
        trustedClaimIssuers: await Promise.all(flat.trustedClaimIssuers.map(convertTrustedClaimIssuerFlatToCorrect(getter))),
    }
    switch (flat.type) {
        case ConditionType.IsPresent:
        case ConditionType.IsAbsent: return {
            ...base,
            type: flat.type,
            target: flat.target,
            claim: flat.claim,
        }
        case ConditionType.IsAnyOf:
        case ConditionType.IsNoneOf: return {
            ...base,
            type: flat.type,
            target: flat.target,
            claims: flat.claims,
        }
        case ConditionType.IsIdentity: return {
            ...base,
            type: flat.type,
            identity: await getter(flat.identity),
        }
        case ConditionType.IsExternalAgent: return {
            ...base,
            type: flat.type,
        }
        default: return assertUnreachable(flat.type)
    }
}
