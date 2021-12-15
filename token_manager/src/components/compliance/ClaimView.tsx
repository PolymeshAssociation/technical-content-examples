import { AddInvestorUniquenessClaimParams } from "@polymathnetwork/polymesh-sdk/internal";
import {
    CddClaim,
    Claim,
    ClaimData,
    ClaimTarget,
    ClaimType,
    CountryCode,
    Identity,
    InvestorUniquenessClaim,
    InvestorUniquenessV2Claim,
    isInvestorUniquenessClaim,
    isScopedClaim,
    Scope,
    ScopedClaim,
    ScopeType,
} from "@polymathnetwork/polymesh-sdk/types";
import { Component } from "react";
import {
    FetchAndAddToPath,
    FetchDefaultAndAddToPath,
    isCddClaim,
    isClaimData,
    isInvestorUniquenessV2Claim,
    isJurisdictionClaim,
    isScopeClaimProof,
    JurisdictionClaim,
    MyInfoJson,
    NoDataClaim,
} from "../../types";
import { findValue } from "../../ui-helpers";
import { BasicProps } from "../BasicProps";
import { EnumSelectView } from "../EnumView";

export type OnScopeChanged = (scope: Scope) => void

export interface ScopeViewState {
    type: ScopeType
    value: string
    modified: boolean
}

export interface ScopeViewProps {
    scope: Scope
    onScopeChanged: OnScopeChanged
    canManipulate: boolean
}

export class ScopeView extends Component<ScopeViewProps, ScopeViewState> {
    constructor(props: ScopeViewProps) {
        super(props)
        this.state = ScopeView.ScopeToState(props.scope)
    }

    static DummyScopeViewState = (): ScopeViewState => ({
        type: ScopeType.Custom,
        value: "",
        modified: false,
    })
    static ScopeToState = (scope: Scope): ScopeViewState => ({
        type: scope.type ?? ScopeType.Custom,
        value: scope.value ?? "",
        modified: false,
    })

    onTypeChanged = async (e) => this.setState((prev: ScopeViewState) => {
        const updated: ScopeViewState = {
            ...prev,
            type: e.target.value,
            modified: true,
        }
        this.props.onScopeChanged(updated)
        return updated
    })
    onValueChanged = (e) => this.setState((prev: ScopeViewState) => {
        const updated: ScopeViewState = {
            ...prev,
            value: e.target.value,
            modified: true,
        }
        this.props.onScopeChanged(updated)
        return updated
    })

    render() {
        const { type, value } = this.state
        const { canManipulate } = this.props
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

export type OnClaimChanged = (claim: ClaimViewState) => void

export interface ClaimViewState {
    type: ClaimType
    id: string
    scope: ScopeViewState
    cddId: string
    scopeId: string
    code: CountryCode
    modified: boolean
}

export interface ClaimViewProps extends BasicProps {
    claim: ClaimViewState
    myInfo: MyInfoJson
    onClaimChanged: OnClaimChanged
    fetchCddId: FetchAndAddToPath<string | Identity>
}

export class ClaimView extends Component<ClaimViewProps, ClaimViewState> {
    constructor(props: ClaimViewProps) {
        super(props)
        this.state = props.claim
    }

    static DummyClaimViewState = (): ClaimViewState => ({
        type: ClaimType.NoData,
        id: "",
        scope: ScopeView.DummyScopeViewState(),
        cddId: "",
        scopeId: "",
        code: CountryCode.Ad,
        modified: false,
    })
    static ClaimToState = (claim: Claim): ClaimViewState => ({
        type: claim.type,
        id: isCddClaim(claim) ? claim.id : "",
        scope: ScopeView.ScopeToState(isScopedClaim(claim) ? claim.scope : {
            type: ScopeType.Custom,
            value: "",
        }),
        cddId: isInvestorUniquenessClaim(claim) || isInvestorUniquenessV2Claim(claim) ? claim.cddId : "",
        scopeId: isInvestorUniquenessClaim(claim) ? claim.scopeId : "",
        code: isJurisdictionClaim(claim) ? claim.code : CountryCode.Ad,
        modified: true,
    })
    static StateToClaim = (state: ClaimViewState): Claim => {
        switch (state.type) {
            case ClaimType.CustomerDueDiligence: return {
                type: state.type,
                id: state.id,
            } as CddClaim
            case ClaimType.InvestorUniqueness: return {
                type: state.type,
                scope: state.scope,
                cddId: state.cddId,
                scopeId: state.scopeId,
            } as InvestorUniquenessClaim
            case ClaimType.InvestorUniquenessV2: return {
                type: state.type,
                cddId: state.cddId,
            } as InvestorUniquenessV2Claim
            case ClaimType.Jurisdiction: return {
                type: state.type,
                code: state.code,
                scope: state.scope,
            } as JurisdictionClaim
            case ClaimType.NoData: return {
                type: state.type
            } as NoDataClaim
            default: return {
                type: state.type,
                scope: state.scope,
            } as ScopedClaim
        }
    }

    onClaimTypeChanged = async (e) => this.setState((prev: ClaimViewState) => {
        const updated: ClaimViewState = {
            ...prev,
            type: e.target.value,
            modified: true,
        }
        this.props.onClaimChanged(updated)
        return updated
    })
    onStringChanged = (key: keyof ClaimViewState) => (e) => this.setState((prev: ClaimViewState) => {
        const updated: ClaimViewState = {
            ...prev,
            [key]: e.target.value,
            modified: true,
        }
        this.props.onClaimChanged(updated)
        return updated
    })
    onScopeChanged = (scope: ScopeViewState) => this.setState((prev: ClaimViewState) => {
        const updated: ClaimViewState = {
            ...prev,
            scope: scope,
            modified: true,
        }
        this.props.onClaimChanged(updated)
        return updated
    })
    onCountryCodeChanged = async (e) => this.setState((prev: ClaimViewState) => {
        const updated: ClaimViewState = {
            ...prev,
            code: e.target.value,
            modified: true,
        }
        this.props.onClaimChanged(updated)
        return updated
    })

    render() {
        const claim: Claim = ClaimView.StateToClaim(this.state)
        const { type, id, scope, cddId, scopeId, code, } = this.state
        const {
            myInfo,
            fetchCddId,
            location,
            canManipulate
        } = this.props
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
                            onClick={() => fetchCddId([...location, "cddId"], target)}
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

export type OnClaimsChanged = (claims: ClaimsViewState) => void

export interface ClaimsViewState {
    claims: ClaimViewState[]
    modified: boolean
}

export interface ClaimsViewProps extends BasicProps {
    claims: ClaimsViewState
    myInfo: MyInfoJson
    onClaimsChanged: OnClaimsChanged
    fetchAndAddToPath: FetchAndAddToPath<string | Identity>
}

export class ClaimsView extends Component<ClaimsViewProps, ClaimsViewState> {
    constructor(props: ClaimsViewProps) {
        super(props)
        this.state = props.claims
    }

    static DummyClaimsViewState = (): ClaimsViewState => ({
        claims: [],
        modified: false,
    })
    static ClaimsToState = (claims: Claim[]): ClaimsViewState => ({
        claims: claims.map(ClaimView.ClaimToState),
        modified: false,
    })
    static StateToClaims = (state: ClaimsViewState): Claim[] => state.claims.map(ClaimView.StateToClaim)

    addClaim = () => this.setState((prev: ClaimsViewState) => {
        const updated: ClaimsViewState = {
            ...prev,
            claims: [
                ClaimView.DummyClaimViewState(),
                ...prev.claims,
            ],
            modified: true,
        }
        this.props.onClaimsChanged(updated)
        return updated
    })
    onClaimChangedAt = (index: number) => (claim: ClaimViewState) => this.setState((prev: ClaimsViewState) => {
        const claims: ClaimViewState[] = prev.claims
        claims[index] = claim
        const updated: ClaimsViewState = {
            ...prev,
            claims: claims,
            modified: true,
        }
        this.props.onClaimsChanged(updated)
        return updated
    })

    render() {
        const { claims } = this.state
        const { myInfo, fetchAndAddToPath, location, canManipulate } = this.props
        const addButton: JSX.Element = <button
            className="submit add-claim"
            onClick={this.addClaim}
            disabled={!canManipulate}>
            Add
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
                                claim={ClaimView.ClaimToState(claim)}
                                myInfo={myInfo}
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

export interface AddInvestorUniquenessClaimViewState {
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

