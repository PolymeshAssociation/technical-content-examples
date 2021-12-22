import { Polymesh } from "@polymathnetwork/polymesh-sdk";
import { Claim, ConditionTarget, ConditionType, Identity } from "@polymathnetwork/polymesh-sdk/types";
import React, { Component } from "react";
import { TrustedClaimIssuerFlat } from "../../handlers/claims/TrustedClaimIssuerHandlers";
import {
    ConditionFlat,
    getDummyConditionFlat,
    OnConditionChanged,
    OnConditionsChanged,
} from "../../handlers/compliance/ConditionHandlers";
import {
    assertUnreachable,
    FetchAndAddToPath,
    MyInfoJson,
} from "../../types";
import { BasicProps } from "../BasicProps";
import { ClaimsView, ClaimView } from "../claims/ClaimView";
import { TrustedClaimIssuersView } from "../claims/TrustedClaimIssuerView";
import { EnumSelectView } from "../EnumView";

export interface ConditionViewProps extends BasicProps {
    condition: ConditionFlat
    myInfo: MyInfoJson
    apiPromise: Promise<Polymesh>
    onConditionChanged: OnConditionChanged
    fetchCddId: FetchAndAddToPath<string | Identity>
}

export class ConditionView extends Component<ConditionViewProps> {

    onStringChanged = (key: keyof ConditionFlat) => async (e) => this.props.onConditionChanged({
        ...this.props.condition,
        [key]: e.target.value,
    })
    onTrustedClaimIssuersChanged = (trustedClaimIssuers: TrustedClaimIssuerFlat[]) => this.props.onConditionChanged({
        ...this.props.condition,
        trustedClaimIssuers: trustedClaimIssuers,
    })
    onClaimChanged = (claim: Claim) => this.props.onConditionChanged({
        ...this.props.condition,
        claim: claim,
    })
    onClaimsChanged = (claims: Claim[]) => this.props.onConditionChanged({
        ...this.props.condition,
        claims: claims,
    })

    render() {
        const { condition, myInfo, apiPromise, fetchCddId, location, canManipulate } = this.props
        const { target, trustedClaimIssuers, type, claim, claims, identity } = condition
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
                        apiPromise={apiPromise}
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
                        apiPromise={apiPromise}
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

export interface ConditionsViewProps extends BasicProps {
    conditions: ConditionFlat[]
    myInfo: MyInfoJson
    apiPromise: Promise<Polymesh>
    onConditionsChanged: OnConditionsChanged
    fetchCddId: FetchAndAddToPath<string | Identity>
}

export class ConditionsView extends Component<ConditionsViewProps> {

    addCondition = () => this.props.onConditionsChanged([
        getDummyConditionFlat(),
        ...this.props.conditions,
    ])
    onConditionChangedAt = (index: number) => (condition: ConditionFlat) => {
        const conditions: ConditionFlat[] = this.props.conditions
        conditions[index] = condition
        this.props.onConditionsChanged(conditions)
    }
    onRemoveConditionAt = (index: number) => () => {
        const conditions: ConditionFlat[] = this.props.conditions
        conditions.splice(index, 1)
        this.props.onConditionsChanged(conditions)
    }

    render() {
        const { conditions, myInfo, apiPromise, fetchCddId, location, canManipulate } = this.props
        const addButton: JSX.Element = <button
            className="submit add-condition"
            onClick={this.addCondition}
            disabled={!canManipulate}>
            Add 1 condition
        </button>
        if (conditions === null || conditions.length === 0) return <div>
            No conditions&nbsp;{addButton}
        </div>
        return <div>
            {addButton}
            <ul>{
                conditions
                    .map((condition: ConditionFlat, index: number) => <li key={index}>
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
                            apiPromise={apiPromise}
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
