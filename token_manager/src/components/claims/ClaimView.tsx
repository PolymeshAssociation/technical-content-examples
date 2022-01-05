import { Polymesh } from "@polymathnetwork/polymesh-sdk";
import { AddInvestorUniquenessClaimParams } from "@polymathnetwork/polymesh-sdk/internal";
import {
    Claim,
    ClaimData,
    ClaimTarget,
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
    OnClaimChanged,
    OnClaimsChanged,
    OnScopeChanged,
} from "../../handlers/claims/ClaimHandlers";
import {
    FetchAndAddToPath,
    FetchDefaultAndAddToPath,
    isCddClaim,
    isClaimData,
    isJurisdictionClaim,
    isScopeClaimProof,
    MyInfoJson,
} from "../../types";
import { findValue } from "../../ui-helpers";
import { BasicProps } from "../BasicProps";
import { EnumSelectView } from "../EnumView";

export interface ScopeViewProps {
    scope: Scope
    onScopeChanged: OnScopeChanged
    canManipulate: boolean
}

export class ScopeView extends Component<ScopeViewProps> {

    onTypeChanged = async (e) => this.props.onScopeChanged({
        ...this.props.scope,
        type: e.target.value,
    })
    onValueChanged = (e) => this.props.onScopeChanged({
        ...this.props.scope,
        value: e.target.value,
    })

    render() {
        const { scope, canManipulate } = this.props
        const { type, value } = scope
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

export interface ClaimViewProps extends BasicProps {
    claim: Claim
    myInfo: MyInfoJson
    apiPromise: Promise<Polymesh>
    onClaimChanged: OnClaimChanged
    fetchCddId: FetchAndAddToPath<string | Identity>
}

export class ClaimView extends Component<ClaimViewProps> {

    onClaimTypeChanged = async (e) => this.props.onClaimChanged(convertClaimFlatToClaim({
        ...convertClaimToFlat(this.props.claim),
        type: e.target.value,
    }))
    onStringChanged = (key: keyof ClaimFlat) => (e) => this.props.onClaimChanged(convertClaimFlatToClaim({
        ...convertClaimToFlat(this.props.claim),
        [key]: e.target.value,
    }))
    onScopeChanged = (scope: Scope) => this.props.onClaimChanged(convertClaimFlatToClaim({
        ...convertClaimToFlat(this.props.claim),
        scope: scope,
    }))
    onCountryCodeChanged = async (e) => this.props.onClaimChanged(convertClaimFlatToClaim({
        ...convertClaimToFlat(this.props.claim),
        code: e.target.value,
    }))

    fetchCddId = async (target: string | Identity): Promise<ClaimData<Claim>[]> => {
        const api: Polymesh = await this.props.apiPromise
        const targetDid: string = typeof target === "string" ? target : target.did
        if (typeof targetDid === "undefined" || targetDid === null || targetDid === "")
            throw new Error(`You need to put a valid target first, not ${targetDid}`)
        const claims: ClaimData<Claim>[] = await api.claims.getCddClaims({
            target: target,
            includeExpired: false,
        })
        if (claims.length === 0) throw new Error(`No CDD claims attached to ${targetDid}`)
        return claims
    }

    render() {
        const { claim, myInfo, location, canManipulate } = this.props
        const { type, id, scope, cddId, scopeId, code, } = convertClaimToFlat(claim)
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
            const claimData: ClaimData | ClaimTarget = findValue(myInfo, location.slice(0, -1))
            const target: string | Identity = claimData?.target
            const targetDid: string = typeof target === "string" ? target : target.did
            const hasTarget: boolean = typeof targetDid !== "undefined" && targetDid !== null && targetDid !== ""
            elements.push(<li key="cddId">CDD id:
                <input
                    defaultValue={cddId}
                    placeholder="123"
                    onChange={this.onStringChanged("cddId")}
                    disabled={!canManipulate}
                />&nbsp;
                {
                    (() => {
                        if (typeof target === "undefined" || isClaimData(claimData)) return ""
                        return <button
                            className="submit load-cdd-id"
                            onClick={() => this.fetchCddId(target)}
                            disabled={!canManipulate || !hasTarget}>
                            Load it
                        </button>
                    })()
                }
            </li>)
            elements.push(<li key="scopeId">Scope id:&nbsp;
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

export interface ClaimsViewProps extends BasicProps {
    claims: Claim[]
    myInfo: MyInfoJson
    apiPromise: Promise<Polymesh>
    onClaimsChanged: OnClaimsChanged
    fetchAndAddToPath: FetchAndAddToPath<string | Identity>
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
        const { claims, myInfo, apiPromise, fetchAndAddToPath, location, canManipulate } = this.props
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
                                myInfo={myInfo}
                                apiPromise={apiPromise}
                                onClaimChanged={this.onClaimChangedAt(index)}
                                fetchCddId={fetchAndAddToPath}
                                location={[...location, index]}
                                canManipulate={canManipulate}
                            />
                        </li>
                    )
            }</ul>
        </div>
    }
}

interface AddInvestorUniquenessClaimViewState {
    scope: Scope,
    claimParams: AddInvestorUniquenessClaimParams,
    expiry: string
    hasExpiry: boolean
    isExpiryValid: boolean
    modified: boolean
}

export interface AddInvestorUniquenessClaimViewProps extends BasicProps {
    claimParams: AddInvestorUniquenessClaimParams | null
    isWrongStyle: any
    fetchMyCddId: FetchDefaultAndAddToPath
}

export class AddInvestorUniquenessClaimView extends Component<AddInvestorUniquenessClaimViewProps, AddInvestorUniquenessClaimViewState> {
    constructor(props: AddInvestorUniquenessClaimViewProps) {
        super(props)
        this.state = {
            scope: props.claimParams.scope,
            claimParams: props.claimParams ?? {
                cddId: "",
                proof: "",
                scope: {
                    type: ScopeType.Identity,
                    value: "",
                },
                scopeId: "",
            },
            expiry: new Date().toISOString(),
            hasExpiry: false,
            isExpiryValid: true,
            modified: false,
        }
    }

    onScopeChanged = (scope: Scope) => this.setState((prev: AddInvestorUniquenessClaimViewState) => {
        const updated: AddInvestorUniquenessClaimViewState = {
            ...prev,
            scope: scope,
            modified: true,
        }

        return updated
    })
    onParamsStringChanged = (key: keyof AddInvestorUniquenessClaimParams) => (e) => this.setState((prev: AddInvestorUniquenessClaimViewState) => {
        const updated: AddInvestorUniquenessClaimViewState = {
            ...prev,
            claimParams: {
                ...prev.claimParams,
                [key]: e.target.value,
            },
            modified: true,
        }
        return updated
    })
    updateExpiry = (e) => {
        const newExpiry = e.target.value
        this.setState({
            expiry: newExpiry,
            isExpiryValid: new Date(newExpiry).toString() !== "Invalid Date",
            modified: true,
        })
    }
    updateHasExpiry = (e) => this.setState({ hasExpiry: e.target.checked })


    render() {
        const { scope, claimParams, expiry, hasExpiry, isExpiryValid } = this.state
        const { fetchMyCddId, isWrongStyle, location, canManipulate } = this.props
        const proofToShow = isScopeClaimProof(claimParams.proof)
            ? claimParams.proof.proofScopeIdWellformed
            : claimParams.proof
        return <ul>
            <li key="scope">
                Scope:&nbsp;
                <ScopeView
                    scope={scope}
                    onScopeChanged={this.onScopeChanged}
                    canManipulate={canManipulate}
                />
            </li>
            <li key="cddId">
                CDD id:&nbsp;
                <input
                    defaultValue={claimParams.cddId}
                    placeholder="123"
                    onChange={this.onParamsStringChanged("cddId")}
                    disabled={!canManipulate}
                />
                &nbsp;
                <button
                    className="submit load-cdd-id"
                    onClick={() => fetchMyCddId([...location, "cddId"])}
                    disabled={!canManipulate}>
                    Load it
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
                    defaultValue={claimParams.scopeId}
                    placeholder="123"
                    onChange={this.onParamsStringChanged("scopeId")}
                    disabled={true}
                />
            </li>
            <li key="hasExpiry">
                Has expiry:&nbsp;<input
                    name="invite-has-expiry"
                    type="checkbox"
                    defaultChecked={hasExpiry}
                    disabled={!canManipulate}
                    onChange={this.updateHasExpiry}
                />
            </li>
            <li key="expiry">
                Expiry:&nbsp;<input
                    defaultValue={claimParams.expiry?.toISOString()}
                    placeholder="2020-12-31"
                    disabled={!canManipulate}
                />
                <input
                    type="text"
                    className={isExpiryValid ? "" : isWrongStyle}
                    placeholder={new Date().toISOString()}
                    defaultValue={expiry}
                    disabled={!canManipulate || !hasExpiry}
                    onChange={this.updateExpiry}
                />
            </li>
        </ul>
    }
}
