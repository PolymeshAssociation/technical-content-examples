import {
    ClaimType,
    Condition,
    ConditionTarget,
    ConditionType,
    Identity,
    isMultiClaimCondition,
    isSingleClaimCondition,
    Scope,
    TrustedClaimIssuer,
} from "@polymathnetwork/polymesh-sdk/types";
import React, { Component } from "react";
import {
    AddToPath,
    FetchAndAddToPath,
    isIdentityCondition,
    isPrimaryIssuanceAgentCondition,
    MyInfoJson,
    MyInfoPath,
    OnValueChangedCreator,
    OnRequirementChangedIdentityCreator,
} from "../../types";
import { BasicProps } from "../BasicProps";
import { EnumSelectView } from "../EnumView";
import {
    ClaimsView,
    ClaimView,
    TrustedClaimIssuersView
} from "./ClaimView";

export interface ConditionViewProps extends BasicProps {
    condition: Condition
    myInfo: MyInfoJson
    onRequirementChangedCreator: OnValueChangedCreator
    removeFromMyRequirementArray: (location: MyInfoPath) => void
    onRequirementChangedIdentityCreator: OnRequirementChangedIdentityCreator
    addClaimToMyRequirementArray: AddToPath<ClaimType>
    addTrustedIssuerToMyRequirementArray: AddToPath<TrustedClaimIssuer>
    addToPath: AddToPath<Scope>
    fetchCddId: FetchAndAddToPath<string | Identity>
}

export class ConditionView extends Component<ConditionViewProps> {
    render() {
        const {
            condition,
            myInfo,
            onRequirementChangedCreator,
            removeFromMyRequirementArray,
            onRequirementChangedIdentityCreator,
            addClaimToMyRequirementArray,
            addTrustedIssuerToMyRequirementArray,
            addToPath,
            fetchCddId,
            location,
            canManipulate
        } = this.props
        const dummyTrustedClaimIssuer: TrustedClaimIssuer = { identity: null, trustedFor: [] }
        const elements: JSX.Element[] = [
            <li key="target">Target:
                <EnumSelectView<ConditionTarget>
                    theEnum={ConditionTarget}
                    defaultValue={condition.target}
                    onChange={onRequirementChangedCreator([...location, "target"], false)}
                    location={[...location, "target"]}
                    canManipulate={canManipulate}
                />
            </li>,
            <li key="trustedClaimIssuers">Trusted claim issuers:&nbsp;
                <button
                    className="submit add-trusted-claim-issuer"
                    onClick={() => addTrustedIssuerToMyRequirementArray([...location, "trustedClaimIssuers"], dummyTrustedClaimIssuer)}
                    disabled={!canManipulate}>
                    Add trusted claim issuer
                </button>
                <TrustedClaimIssuersView
                    trustedIssuers={condition.trustedClaimIssuers}
                    onRequirementChangedCreator={onRequirementChangedCreator}
                    removeFromMyRequirementArray={removeFromMyRequirementArray}
                    onRequirementChangedIdentityCreator={onRequirementChangedIdentityCreator}
                    addClaimToMyRequirementArray={addClaimToMyRequirementArray}
                    location={[...location, "trustedClaimIssuers"]}
                    canManipulate={canManipulate}
                />
            </li>,
            <li key="type">Type:
                <EnumSelectView<ConditionType>
                    theEnum={ConditionType}
                    defaultValue={condition.type}
                    onChange={onRequirementChangedCreator([...location, "type"], false)}
                    location={[...location, "type"]}
                    canManipulate={canManipulate}
                />
            </li>,
        ]
        if (isSingleClaimCondition(condition)) {
            elements.push(<li key="claim">
                Claim:
                <ClaimView
                    claim={condition.claim}
                    myInfo={myInfo}
                    addToPath={addToPath}
                    onRequirementChangedCreator={onRequirementChangedCreator}
                    fetchCddId={fetchCddId}
                    location={[...location, "claim"]}
                    canManipulate={canManipulate}
                />
            </li>)
        } else if (isMultiClaimCondition(condition)) {
            elements.push(<li key="claims">Claims:
                <ClaimsView
                    claims={condition.claims}
                    myInfo={myInfo}
                    addToPath={addToPath}
                    onRequirementChangedCreator={onRequirementChangedCreator}
                    fetchAndAddToPath={fetchCddId}
                    location={[...location, "claims"]}
                    canManipulate={canManipulate}
                />
            </li>)
        } else if (isIdentityCondition(condition)) {
            elements.push(<li key="identity">Identity:&nbsp;
                <input
                    defaultValue={condition.identity?.did}
                    placeholder="0x123"
                    disabled={!canManipulate}
                    onChange={onRequirementChangedIdentityCreator([...location, "identity"])}
                />
            </li>)
        } else if (isPrimaryIssuanceAgentCondition(condition)) { // Nothing to do
        } else {
            throw new Error(`Unknown condition type: ${condition}`)
        }
        return <ul>{elements}</ul>
    }
}

export interface ConditionsViewProps extends BasicProps {
    conditions: Condition[]
    myInfo: MyInfoJson
    onRequirementChangedCreator: OnValueChangedCreator
    removeFromMyRequirementArray: (location: MyInfoPath) => void
    onRequirementChangedIdentityCreator: OnRequirementChangedIdentityCreator
    addClaimToMyRequirementArray: AddToPath<ClaimType>
    addTrustedIssuerToMyRequirementArray: AddToPath<TrustedClaimIssuer>
    addToPath: AddToPath<Scope>
    fetchCddId: FetchAndAddToPath<string | Identity>
}

export class ConditionsView extends Component<ConditionsViewProps> {
    render() {
        const {
            conditions,
            myInfo,
            onRequirementChangedCreator,
            removeFromMyRequirementArray,
            onRequirementChangedIdentityCreator,
            addClaimToMyRequirementArray,
            addTrustedIssuerToMyRequirementArray,
            addToPath,
            fetchCddId,
            location,
            canManipulate
        } = this.props
        if (conditions === null || conditions.length === 0) return <div>No conditions</div>
        return <ul>{
            conditions
                .map((condition: Condition, conditionIndex: number) => <ConditionView
                    condition={condition}
                    myInfo={myInfo}
                    onRequirementChangedCreator={onRequirementChangedCreator}
                    removeFromMyRequirementArray={removeFromMyRequirementArray}
                    onRequirementChangedIdentityCreator={onRequirementChangedIdentityCreator}
                    addClaimToMyRequirementArray={addClaimToMyRequirementArray}
                    addTrustedIssuerToMyRequirementArray={addTrustedIssuerToMyRequirementArray}
                    addToPath={addToPath}
                    fetchCddId={fetchCddId}
                    location={[...location, conditionIndex]}
                    canManipulate={canManipulate}
                />)
                .map((presented: JSX.Element, index: number) => <li key={index}>
                    Condition {index}:&nbsp;
                    <button
                        className="submit remove-condition"
                        onClick={() => removeFromMyRequirementArray([...location, index])}
                        disabled={!canManipulate}>
                        Remove {index}
                    </button>
                    {presented}
                </li>)
        }</ul>
    }
}
