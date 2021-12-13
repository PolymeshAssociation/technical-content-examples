import {
    ClaimType,
    Condition,
    ConditionType,
    Identity,
    Requirement,
    Scope,
    TrustedClaimIssuer,
} from "@polymathnetwork/polymesh-sdk/types";
import React, { Component } from "react";
import {
    AddToPath,
    FetchAndAddToPath,
    MyInfoJson,
    MyInfoPath,
    OnValueChangedCreator,
    OnRequirementChangedIdentityCreator,
} from "../../types";
import { BasicProps } from "../BasicProps";
import { ConditionsView } from "./ConditionView";

export interface RequirementViewProps extends BasicProps {
    requirement: Requirement
    myInfo: MyInfoJson
    onRequirementChangedCreator: OnValueChangedCreator
    removeFromMyRequirementArray: (location: MyInfoPath) => void
    onRequirementChangedIdentityCreator: OnRequirementChangedIdentityCreator
    addConditionToMyRequirementArray: AddToPath<Condition>
    addClaimToMyRequirementArray: AddToPath<ClaimType>
    addTrustedIssuerToMyRequirementArray: AddToPath<TrustedClaimIssuer>
    addToPath: AddToPath<Scope>
    fetchCddId: FetchAndAddToPath<string | Identity>
}

export class RequirementView extends Component<RequirementViewProps> {
    render() {
        const {
            requirement,
            myInfo,
            onRequirementChangedCreator,
            removeFromMyRequirementArray,
            onRequirementChangedIdentityCreator,
            addConditionToMyRequirementArray,
            addClaimToMyRequirementArray,
            addTrustedIssuerToMyRequirementArray,
            addToPath,
            fetchCddId,
            location,
            canManipulate
        } = this.props
        const dummyCondition: Condition = {
            target: null,
            type: ConditionType.IsPresent,
            claim: {
                type: ClaimType.NoData,
            },
        }
        return <ul>
            <li key="id">Id: {requirement.id}</li>
            <li key="conditions">Conditions:&nbsp;
                <button
                    className="submit add-condition"
                    onClick={() => addConditionToMyRequirementArray([...location, "conditions"], dummyCondition)}
                    disabled={!canManipulate}>
                    Add condition
                </button>
                <ConditionsView
                    conditions={requirement.conditions}
                    myInfo={myInfo}
                    onRequirementChangedCreator={onRequirementChangedCreator}
                    removeFromMyRequirementArray={removeFromMyRequirementArray}
                    onRequirementChangedIdentityCreator={onRequirementChangedIdentityCreator}
                    addClaimToMyRequirementArray={addClaimToMyRequirementArray}
                    addTrustedIssuerToMyRequirementArray={addTrustedIssuerToMyRequirementArray}
                    addToPath={addToPath}
                    fetchCddId={fetchCddId}
                    location={[...location, "conditions"]}
                    canManipulate={canManipulate}
                />
            </li>
        </ul>
    }
}

export interface RequirementsViewProps extends BasicProps {
    requirements: Requirement[]
    myInfo: MyInfoJson
    onRequirementChangedCreator: OnValueChangedCreator
    removeFromMyRequirementArray: (location: MyInfoPath) => void
    onRequirementChangedIdentityCreator: OnRequirementChangedIdentityCreator
    addConditionToMyRequirementArray: AddToPath<Condition>
    addClaimToMyRequirementArray: AddToPath<ClaimType>
    addTrustedIssuerToMyRequirementArray: AddToPath<TrustedClaimIssuer>
    addToPath: AddToPath<Scope>
    fetchCddId: FetchAndAddToPath<string | Identity>
}

export class RequirementsView extends Component<RequirementsViewProps> {
    render() {
        const {
            requirements,
            myInfo,
            onRequirementChangedCreator,
            removeFromMyRequirementArray,
            onRequirementChangedIdentityCreator,
            addConditionToMyRequirementArray,
            addClaimToMyRequirementArray,
            addTrustedIssuerToMyRequirementArray,
            addToPath,
            fetchCddId,
            location,
            canManipulate
        } = this.props
        if (typeof requirements === "undefined" || requirements === null || requirements.length === 0) return <div>No requirements</div>
        return <ul>{
            requirements
                .map((requirement: Requirement, requirementIndex: number) => <li key={requirementIndex}>
                    Requirement {requirementIndex}:&nbsp;
                    <button
                        className="submit remove-requirement"
                        onClick={() => removeFromMyRequirementArray([...location, requirementIndex])}
                        disabled={!canManipulate}>
                        Remove {requirementIndex}
                    </button>
                    <RequirementView
                        requirement={requirement}
                        myInfo={myInfo}
                        onRequirementChangedCreator={onRequirementChangedCreator}
                        removeFromMyRequirementArray={removeFromMyRequirementArray}
                        onRequirementChangedIdentityCreator={onRequirementChangedIdentityCreator}
                        addConditionToMyRequirementArray={addConditionToMyRequirementArray}
                        addClaimToMyRequirementArray={addClaimToMyRequirementArray}
                        addTrustedIssuerToMyRequirementArray={addTrustedIssuerToMyRequirementArray}
                        addToPath={addToPath}
                        fetchCddId={fetchCddId}
                        location={[...location, requirementIndex]}
                        canManipulate={canManipulate}
                    />
                </li>)
        }</ul>
    }
}
