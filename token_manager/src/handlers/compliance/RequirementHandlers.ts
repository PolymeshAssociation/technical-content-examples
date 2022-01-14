import { Requirement } from "@polymathnetwork/polymesh-sdk/types";
import { IdentityGetter } from "./ComplianceHandlers";
import {
    ConditionFlat,
    convertConditionFlatToCondition,
    convertConditionToFlat,
} from "./ConditionHandlers";

export type OnRequirementChanged = (requirement: RequirementFlat) => void
export type OnRequirementsChanged = (requirements: RequirementFlat[]) => void

export interface RequirementFlat {
    id: number
    conditions: ConditionFlat[]
}

export const getDummyRequirementFlat = (): RequirementFlat => ({
    id: Math.round(Math.random() * 1000),
    conditions: [],
})

export const convertRequirementToFlat = (requirement: Requirement): RequirementFlat => ({
    id: requirement.id,
    conditions: requirement.conditions.map(convertConditionToFlat),
})

export const convertRequirementFlatToRequirement = (getter: IdentityGetter) => async (flat: RequirementFlat): Promise<Requirement> =>
({
    id: flat.id,
    conditions: await Promise.all(flat.conditions.map(convertConditionFlatToCondition(getter))),
})
