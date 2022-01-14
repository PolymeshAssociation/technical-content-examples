import { Polymesh } from "@polymathnetwork/polymesh-sdk";
import { AddInvestorUniquenessClaimParams } from "@polymathnetwork/polymesh-sdk/internal";
import {
    CddClaim,
    Claim,
    ClaimData,
    ClaimType,
    CountryCode,
    Identity,
    isInvestorUniquenessClaim,
    isScopedClaim,
    Scope,
    ScopeType,
} from "@polymathnetwork/polymesh-sdk/types";
import { Component } from "react";
import {
    ClaimFlat,
    convertClaimFlatToClaim,
    convertClaimToFlat,
    getDummyClaim,
    OnAddInvestorUniquenessClaimParamsChanged,
    OnClaimChanged,
    OnClaimsChanged,
    OnScopeChanged,
} from "../../handlers/claims/ClaimHandlers";
import {
    isCddClaim,
    isJurisdictionClaim,
    isScopeClaimProof,
} from "../../types";
import { DateTimeEntryView } from "../elements/DateTimeEntry";
import { EnumSelectView } from "../EnumView";

export interface ScopeViewProps {
    scope: Scope
    onScopeChanged: OnScopeChanged
    canManipulate: boolean
}

export class ScopeView extends Component<ScopeViewProps> {

    onTypeChanged = async (e: React.ChangeEvent<HTMLSelectElement>) => this.props.onScopeChanged({
        ...this.props.scope,
        type: ScopeType[e.target.value],
    })
    onValueChanged = (e: React.ChangeEvent<HTMLInputElement>) => this.props.onScopeChanged({
        ...this.props.scope,
        value: e.target.value,
    })

    render() {
        const {
            scope: {
                type,
                value,
            },
            canManipulate,
        } = this.props
        return <ul>
            <li key="type">Type: &nbsp;
                <EnumSelectView<ScopeType>
                    theEnum={ScopeType}
                    defaultValue={type}
                    onChange={this.onTypeChanged}
                    canManipulate={canManipulate}
                />
            </li>
            <li key="value">Value:&nbsp;
                <input
                    defaultValue={value}
                    placeholder="ACME"
                    onChange={this.onValueChanged}
                    disabled={!canManipulate}
                />
            </li>
        </ul>
    }
}

export interface ClaimViewProps {
    claim: Claim
    canManipulate: boolean
    apiPromise: Promise<Polymesh>
    onClaimChanged: OnClaimChanged
}

export class ClaimView extends Component<ClaimViewProps> {

    onClaimTypeChanged = async (e: React.ChangeEvent<HTMLSelectElement>) => this.props.onClaimChanged(convertClaimFlatToClaim({
        ...convertClaimToFlat(this.props.claim),
        type: ClaimType[e.target.value],
    }))
    onStringChanged = (key: keyof ClaimFlat) => (e: React.ChangeEvent<HTMLInputElement>) => this.props.onClaimChanged(convertClaimFlatToClaim({
        ...convertClaimToFlat(this.props.claim),
        [key]: e.target.value,
    }))
    onScopeChanged = (scope: Scope) => this.props.onClaimChanged(convertClaimFlatToClaim({
        ...convertClaimToFlat(this.props.claim),
        scope: scope,
    }))
    onCountryCodeChanged = async (e: React.ChangeEvent<HTMLSelectElement>) => this.props.onClaimChanged(convertClaimFlatToClaim({
        ...convertClaimToFlat(this.props.claim),
        code: CountryCode[e.target.value],
    }))

    render() {
        const { claim, canManipulate } = this.props
        const { type, id, scope, cddId, scopeId, code } = convertClaimToFlat(claim)
        const elements: JSX.Element[] = [
            <li key="type">Type:&nbsp;
                <EnumSelectView<ClaimType>
                    theEnum={ClaimType}
                    defaultValue={type}
                    onChange={this.onClaimTypeChanged}
                    canManipulate={canManipulate}
                />
            </li>
        ]
        if (isCddClaim(claim)) {
            elements.push(<li key="id">Id:&nbsp;
                <input
                    defaultValue={id}
                    placeholder="123"
                    onChange={this.onStringChanged("id")}
                    disabled={!canManipulate}
                />
            </li>)
        }
        if (isScopedClaim(claim)) {
            elements.push(<li key="scope">
                Scope:&nbsp;
                <ScopeView
                    scope={scope}
                    onScopeChanged={this.onScopeChanged}
                    canManipulate={canManipulate}
                />
            </li>)
        }
        if (isInvestorUniquenessClaim(claim)) {
            elements.push(
                <li key="cddId">CDD id:
                    <input
                        defaultValue={cddId}
                        placeholder="123"
                        onChange={this.onStringChanged("cddId")}
                        disabled={!canManipulate}
                    />&nbsp;
                </li>,
                <li key="scopeId">Scope id:&nbsp;
                    <input
                        defaultValue={scopeId}
                        placeholder="123"
                        onChange={this.onStringChanged("scopeId")}
                        disabled={!canManipulate}
                    />
                </li>)
        }
        if (isJurisdictionClaim(claim)) {
            elements.push(<li key="countryCode">Country code:&nbsp;
                <EnumSelectView<CountryCode>
                    theEnum={CountryCode}
                    defaultValue={code}
                    onChange={this.onCountryCodeChanged}
                    canManipulate={canManipulate}
                />
            </li>)
        }
        return <ul>{elements}</ul>
    }
}

export interface ClaimsViewProps {
    claims: Claim[]
    canManipulate: boolean
    apiPromise: Promise<Polymesh>
    onClaimsChanged: OnClaimsChanged
}

export class ClaimsView extends Component<ClaimsViewProps> {

    addClaim = () => this.props.onClaimsChanged([
        getDummyClaim(),
        ...this.props.claims,
    ])
    onClaimChangedAt = (index: number) => (claim: Claim) => {
        const claims: Claim[] = this.props.claims
        claims[index] = claim
        this.props.onClaimsChanged(claims)
    }

    render() {
        const { claims, apiPromise, canManipulate } = this.props
        const addButton: JSX.Element = <button
            className="submit add-claim"
            onClick={this.addClaim}
            disabled={!canManipulate}>
            Add 1 claim
        </button>
        if (claims.length === 0) return <div>
            No claims&nbsp;{addButton}
        </div>
        return <div>
            {addButton}
            <ul>{
                claims
                    .map((claim: Claim, index: number) =>
                        <li key={index}>
                            Claim {index}:
                            <ClaimView
                                claim={convertClaimToFlat(claim)}
                                apiPromise={apiPromise}
                                onClaimChanged={this.onClaimChangedAt(index)}
                                canManipulate={canManipulate}
                            />
                        </li>
                    )
            }</ul>
        </div>
    }
}

export interface AddInvestorUniquenessClaimViewProps {
    claimParams: AddInvestorUniquenessClaimParams
    isWrongStyle: any
    canManipulate: boolean
    apiPromise: Promise<Polymesh>
    onAddInvestorUniquenessClaimParamsChanged: OnAddInvestorUniquenessClaimParamsChanged
}

export class AddInvestorUniquenessClaimView extends Component<AddInvestorUniquenessClaimViewProps> {

    setClaimParamValue = <Type,>(key: keyof AddInvestorUniquenessClaimParams, value: Type) =>
        this.props.onAddInvestorUniquenessClaimParamsChanged({
            ...this.props.claimParams,
            [key]: value,
        })
    onScopeChanged = (scope: Scope) => this.setClaimParamValue<Scope>("scope", scope)
    onParamsStringChanged = (key: keyof AddInvestorUniquenessClaimParams) => (e: React.ChangeEvent<HTMLInputElement>) =>
        this.setClaimParamValue<string>(key, e.target.value)
    onFetchMyCddId = async (): Promise<void> => {
        const api: Polymesh = await this.props.apiPromise
        const me: Identity = await api.getCurrentIdentity()
        const claims: ClaimData<CddClaim>[] = (await api.claims.getCddClaims({
            target: me,
            includeExpired: false,
        }))
        // TODO Handle more than the first.
        this.setClaimParamValue<string>("cddId", claims[0].claim.id)
    }
    onValidDateChanged = (newDate: Date) => this.setClaimParamValue<Date>("expiry", newDate)

    render() {
        const {
            claimParams: {
                scope,
                cddId,
                expiry,
                proof,
                scopeId,
            },
            isWrongStyle,
            canManipulate,
        } = this.props
        const proofToShow = isScopeClaimProof(proof) ? proof.proofScopeIdWellformed : proof
        return <ul>
            <li key="scope">
                Scope:&nbsp;
                <ScopeView
                    scope={scope}
                    onScopeChanged={this.onScopeChanged}
                    canManipulate={canManipulate}
                />
            </li >
            <li key="cddId">
                CDD id:&nbsp;
                <input
                    value={cddId}
                    placeholder="123"
                    onChange={this.onParamsStringChanged("cddId")}
                    disabled={!canManipulate}
                />
                &nbsp;
                <button
                    className="submit load-cdd-id"
                    onClick={this.onFetchMyCddId}
                    disabled={!canManipulate}>
                    Load my first
                </button>
            </li>
            <li key="proof">
                Proof:&nbsp;
                <input
                    defaultValue={proofToShow}
                    placeholder="123"
                    onChange={this.onParamsStringChanged("proof")}
                    disabled={true}
                />
            </li>
            <li key="scopeId">
                Scope id:&nbsp;
                <input
                    defaultValue={scopeId}
                    placeholder="123"
                    onChange={this.onParamsStringChanged("scopeId")}
                    disabled={true}
                />
            </li>
            <li key="expiry">
                Expiry:&nbsp;
                <DateTimeEntryView
                    dateTime={expiry}
                    isOptional={true}
                    isWrongStyle={isWrongStyle}
                    canManipulate={canManipulate}
                    onValidDateChanged={this.onValidDateChanged}
                />
            </li>
        </ul >
    }
}
