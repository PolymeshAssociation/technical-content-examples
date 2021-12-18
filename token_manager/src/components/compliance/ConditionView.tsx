import {
    Condition,
    ConditionBase,
    ConditionTarget,
    ConditionType,
    ExternalAgentCondition,
    Identity,
    IdentityCondition,
    isMultiClaimCondition,
    isSingleClaimCondition,
    MultiClaimCondition,
    SingleClaimCondition,
} from "@polymathnetwork/polymesh-sdk/types";
import React, { Component } from "react";
import {
    assertUnreachable,
    FetchAndAddToPath,
    isIdentityCondition,
    MyInfoJson,
} from "../../types";
import { BasicProps } from "../BasicProps";
import { EnumSelectView } from "../EnumView";
import { ClaimsView, ClaimsViewState, ClaimView, ClaimViewState } from "./ClaimView";
import { IdentityGetter } from "./ComplianceView";
import {
    TrustedClaimIssuersView,
    TrustedClaimIssuersViewState,
    TrustedClaimIssuerView,
    TrustedClaimIssuerViewState,
} from "./TrustedClaimIssuerView";

export type OnConditionChanged = (condition: ConditionViewState) => void

export interface ConditionViewState {
    target: ConditionTarget
    trustedClaimIssuers: TrustedClaimIssuerViewState[]
    type: ConditionType
    claim: ClaimViewState | null
    claims: ClaimsViewState
    identity: string
    modified: boolean
}

export interface ConditionViewProps extends BasicProps {
    condition: ConditionViewState
    myInfo: MyInfoJson
    onConditionChanged: OnConditionChanged
    fetchCddId: FetchAndAddToPath<string | Identity>
}

export class ConditionView extends Component<ConditionViewProps, ConditionViewState> {
    constructor(props: ConditionViewProps) {
        super(props)
        this.state = props.condition
    }

    static DummyConditionViewState = (): ConditionViewState => ({
        target: ConditionTarget.Both,
        trustedClaimIssuers: [],
        type: ConditionType.IsPresent,
        claim: ClaimView.DummyClaimViewState(),
        claims: ClaimsView.ClaimsToState([]),
        identity: "",
        modified: false,
    })
    static ConditionToState = (condition: Condition): ConditionViewState => ({
        target: condition.target,
        trustedClaimIssuers: TrustedClaimIssuersView.TrustedIssuersToState(condition.trustedClaimIssuers).trustedIssuers,
        type: condition.type,
        claim: isSingleClaimCondition(condition) ? ClaimView.ClaimToState(condition.claim) : null,
        claims: ClaimsView.ClaimsToState(isMultiClaimCondition(condition) ? condition.claims : []),
        identity: isIdentityCondition(condition) ? condition.identity.did : "",
        modified: false,
    })
    static StateToCondition = (getter: IdentityGetter) => async (state: ConditionViewState): Promise<Condition> => {
        const base: ConditionBase = {
            target: state.target,
            trustedClaimIssuers: await Promise.all(state.trustedClaimIssuers.map(TrustedClaimIssuerView.StateToTrustedIssuer(getter))),
        }
        switch (state.type) {
            case ConditionType.IsPresent:
            case ConditionType.IsAbsent: return {
                ...base,
                type: state.type,
                target: state.target,
                claim: ClaimView.StateToClaim(state.claim),
            } as SingleClaimCondition
            case ConditionType.IsAnyOf:
            case ConditionType.IsNoneOf: return {
                ...base,
                type: state.type,
                target: state.target,
                claims: ClaimsView.StateToClaims(state.claims),
            } as MultiClaimCondition
            case ConditionType.IsIdentity: return {
                ...base,
                type: state.type,
                identity: await getter(state.identity),
            } as IdentityCondition
            case ConditionType.IsExternalAgent: return {
                ...base,
                type: state.type,
            } as ExternalAgentCondition
            default: return assertUnreachable(state.type)
        }
    }

    onStringChanged = (key: keyof ConditionViewState) => async (e) => this.setState((prev: ConditionViewState) => {
        const updated: ConditionViewState = {
            ...prev,
            [key]: e.target.value,
            modified: true,
        }
        this.props.onConditionChanged(updated)
        return updated
    })
    onTrustedClaimIssuersChanged = (trustedClaimIssuers: TrustedClaimIssuersViewState) => this.setState((prev: ConditionViewState) => {
        const updated: ConditionViewState = {
            ...prev,
            trustedClaimIssuers: trustedClaimIssuers.trustedIssuers,
            modified: true,
        }
        this.props.onConditionChanged(updated)
        return updated
    })
    onClaimChanged = (claim: ClaimViewState) => this.setState((prev: ConditionViewState) => {
        const updated: ConditionViewState = {
            ...prev,
            claim: claim,
            modified: true,
        }
        this.props.onConditionChanged(updated)
        return updated
    })
    onClaimsChanged = (claims: ClaimsViewState) => this.setState((prev: ConditionViewState) => {
        const updated: ConditionViewState = {
            ...prev,
            claims: claims,
            modified: true,
        }
        this.props.onConditionChanged(updated)
        return updated
    })

    render() {
        const { target, trustedClaimIssuers, type, claim, claims, identity } = this.state
        const {
            myInfo,
            fetchCddId,
            location,
            canManipulate
        } = this.props
        const elements: JSX.Element[] = [
            <li key="target">Target:
                <EnumSelectView<ConditionTarget>
                    theEnum={ConditionTarget}
                    defaultValue={target}
                    onChange={this.onStringChanged("target")}
                    canManipulate={canManipulate}
                />
            </li>,
            <li key="trustedClaimIssuers">Trusted claim issuers:&nbsp;
                <TrustedClaimIssuersView
                    trustedIssuers={trustedClaimIssuers}
                    onTrustedIssuersChanged={this.onTrustedClaimIssuersChanged}
                    canManipulate={canManipulate}
                />
            </li>,
            <li key="type">Type:
                <EnumSelectView<ConditionType>
                    theEnum={ConditionType}
                    defaultValue={type}
                    onChange={this.onStringChanged("type")}
                    canManipulate={canManipulate}
                />
            </li>,
        ]
        switch (type) {
            case ConditionType.IsPresent:
            case ConditionType.IsAbsent:
                elements.push(<li key="claim">
                    Claim:
                    <ClaimView
                        claim={claim}
                        myInfo={myInfo}
                        onClaimChanged={this.onClaimChanged}
                        fetchCddId={fetchCddId}
                        location={[...location, "claim"]}
                        canManipulate={canManipulate}
                    />
                </li>)
                break
            case ConditionType.IsAnyOf:
            case ConditionType.IsNoneOf:
                elements.push(<li key="claims">Claims:
                    <ClaimsView
                        claims={claims}
                        myInfo={myInfo}
                        onClaimsChanged={this.onClaimsChanged}
                        fetchAndAddToPath={fetchCddId}
                        location={[...location, "claims"]}
                        canManipulate={canManipulate}
                    />
                </li>)
                break
            case ConditionType.IsIdentity:
                elements.push(<li key="identity">Identity:&nbsp;
                    <input
                        defaultValue={identity}
                        placeholder="0x123"
                        disabled={!canManipulate}
                        onChange={this.onStringChanged("identity")}
                    />
                </li>)
                break
            case ConditionType.IsExternalAgent:
                // Nothing to add
                break
            default: assertUnreachable(type)
        }

        return <ul>{elements}</ul>
    }
}

export type OnConditionsChanged = (conditions: ConditionsViewState) => void

export interface ConditionsViewState {
    conditions: ConditionViewState[]
    modified: boolean
}

export interface ConditionsViewProps extends BasicProps {
    conditions: ConditionsViewState
    myInfo: MyInfoJson
    onConditionsChanged: OnConditionsChanged
    fetchCddId: FetchAndAddToPath<string | Identity>
}

export class ConditionsView extends Component<ConditionsViewProps, ConditionsViewState> {
    constructor(props: ConditionsViewProps) {
        super(props)
        this.state = props.conditions
    }

    static DummyConditionsViewState = (): ConditionsViewState => ({
        conditions: [],
        modified: false,
    })
    static ConditionsToState = (conditions: Condition[]) => ({
        conditions: conditions.map(ConditionView.ConditionToState)
    }) as ConditionsViewState
    static StateToConditions = (getter: IdentityGetter) =>
        async (state: ConditionsViewState): Promise<Condition[]> =>
            Promise.all(state.conditions.map(ConditionView.StateToCondition(getter)))

    addCondition = () => this.setState((prev: ConditionsViewState) => {
        const updated: ConditionsViewState = {
            ...prev,
            conditions: [
                ConditionView.DummyConditionViewState(),
                ...prev.conditions,
            ],
            modified: true,
        }
        this.props.onConditionsChanged(updated)
        return updated
    })
    onConditionChangedAt = (index: number) => (condition: ConditionViewState) => this.setState((prev: ConditionsViewState) => {
        const conditions: ConditionViewState[] = prev.conditions
        conditions[index] = condition
        const updated: ConditionsViewState = {
            ...prev,
            conditions: conditions,
            modified: true,
        }
        this.props.onConditionsChanged(updated)
        return updated
    })
    onRemoveConditionAt = (index: number) => () => this.setState((prev: ConditionsViewState) => {
        const conditions: ConditionViewState[] = prev.conditions
        conditions.splice(index, 1)
        const updated: ConditionsViewState = {
            ...prev,
            conditions: conditions,
            modified: true,
        }
        this.props.onConditionsChanged(updated)
        return updated
    })

    render() {
        const { conditions } = this.state
        const { myInfo, fetchCddId, location, canManipulate } = this.props
        const addButton: JSX.Element = <button
            className="submit add-condition"
            onClick={this.addCondition}
            disabled={!canManipulate}>
            Add
        </button>
        if (conditions === null || conditions.length === 0) return <div>
            No conditions&nbsp;{addButton}
        </div>
        return <div>
            {addButton}
            <ul>{
                conditions
                    .map((condition: ConditionViewState, index: number) => <li key={index}>
                        Condition {index}:&nbsp;
                        <button
                            className="submit remove-condition"
                            onClick={this.onRemoveConditionAt(index)}
                            disabled={!canManipulate}>
                            Remove {index}
                        </button>
                        <ConditionView
                            condition={condition}
                            myInfo={myInfo}
                            onConditionChanged={this.onConditionChangedAt(index)}
                            fetchCddId={fetchCddId}
                            location={[...location, index]}
                            canManipulate={canManipulate}
                        />
                    </li>)
            }</ul>
        </div>
    }
}
