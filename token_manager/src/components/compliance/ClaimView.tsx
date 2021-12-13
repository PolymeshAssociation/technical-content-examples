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
    TrustedClaimIssuer,
} from "@polymathnetwork/polymesh-sdk/types";
import React, { Component } from "react";
import {
    AddToPath,
    FetchAndAddToPath,
    FetchDefaultAndAddToPath,
    isCddClaim,
    isClaimData,
    isScopeClaimProof,
    MyInfoJson,
    MyInfoPath,
    OnValueChangedCreator,
    OnRequirementChangedIdentityCreator,
} from "../../types";
import { findValue } from "../../ui-helpers";
import { BasicProps } from "../BasicProps";
import { EnumSelectView } from "../EnumView";

export interface TrustedClaimIssuerViewProps extends BasicProps {
    trustedIssuer: TrustedClaimIssuer
    onRequirementChangedCreator: OnValueChangedCreator
    removeFromMyRequirementArray: (location: MyInfoPath) => void
    onRequirementChangedIdentityCreator: OnRequirementChangedIdentityCreator
    addToMyRequirementArray: AddToPath<ClaimType>
}

export class TrustedClaimIssuerView extends Component<TrustedClaimIssuerViewProps> {
    render() {
        const {
            trustedIssuer,
            onRequirementChangedCreator,
            removeFromMyRequirementArray,
            onRequirementChangedIdentityCreator,
            addToMyRequirementArray,
            location,
            canManipulate
        } = this.props
        const trustedFor: JSX.Element = trustedIssuer.trustedFor
            ? <ul>{
                trustedIssuer.trustedFor.map((claimType: ClaimType, claimTypeIndex: number) => <li key={claimTypeIndex}>
                    <EnumSelectView<ClaimType>
                        theEnum={ClaimType}
                        defaultValue={claimType}
                        onChange={onRequirementChangedCreator([...location, "trustedFor", claimTypeIndex], false)}
                        location={[...location, "trustedFor", claimTypeIndex]}
                        canManipulate={canManipulate}
                    />
                    &nbsp;
                    <button
                        className="submit remove-trusted-for"
                        onClick={() => removeFromMyRequirementArray([...location, "trustedFor", claimTypeIndex])}
                        disabled={!canManipulate}>
                        Remove {claimTypeIndex}
                    </button>
                </li>)
            }</ul>
            : <div>Not trusted for anything</div>
        return <ul>
            <li key="identity">
                Did:
                <input
                    defaultValue={trustedIssuer.identity?.did}
                    placeholder="0x123"
                    onChange={onRequirementChangedIdentityCreator([...location, "identity"])}
                    disabled={!canManipulate}
                />
            </li>
            <li key="trustedFor">Trusted for:&nbsp;
                <button
                    className="submit add-trusted-for"
                    onClick={() => addToMyRequirementArray([...location, "trustedFor"], ClaimType.Accredited)}
                    disabled={!canManipulate}>
                    Add trusted for
                </button>
                {trustedFor}
            </li>
        </ul>
    }
}

export interface TrustedClaimIssuersViewProps extends BasicProps {
    trustedIssuers: TrustedClaimIssuer[] | null
    onRequirementChangedCreator: OnValueChangedCreator
    removeFromMyRequirementArray: (location: MyInfoPath) => void
    onRequirementChangedIdentityCreator: OnRequirementChangedIdentityCreator
    addClaimToMyRequirementArray: AddToPath<ClaimType>
}

export class TrustedClaimIssuersView extends Component<TrustedClaimIssuersViewProps> {
    render() {
        const {
            trustedIssuers,
            onRequirementChangedCreator,
            removeFromMyRequirementArray,
            onRequirementChangedIdentityCreator,
            addClaimToMyRequirementArray,
            location,
            canManipulate
        } = this.props
        if (typeof trustedIssuers === "undefined" || trustedIssuers === null || trustedIssuers.length === 0)
            return <div>No trusted issuers</div>
        return <ul>{
            trustedIssuers
                .map((trustedIssuer: TrustedClaimIssuer, issuerIndex: number) =>
                    <li key={issuerIndex}>
                        Issuer {issuerIndex}:&nbsp;
                        <button
                            className="submit remove-trusted-claim-issuer"
                            onClick={() => removeFromMyRequirementArray([...location, issuerIndex])}
                            disabled={!canManipulate}>
                            Remove {issuerIndex}
                        </button>
                        <TrustedClaimIssuerView
                            trustedIssuer={trustedIssuer}
                            onRequirementChangedCreator={onRequirementChangedCreator}
                            removeFromMyRequirementArray={removeFromMyRequirementArray}
                            onRequirementChangedIdentityCreator={onRequirementChangedIdentityCreator}
                            addToMyRequirementArray={addClaimToMyRequirementArray}
                            location={[...location, issuerIndex]}
                            canManipulate={canManipulate}
                        />
                    </li>)
        }</ul >
    }
}

export interface ScopeViewProps extends BasicProps {
    scope: Scope
    addToPath: AddToPath<Scope>
    onRequirementChangedCreator: OnValueChangedCreator
}

export class ScopeView extends Component<ScopeViewProps> {
    render() {
        let { scope } = this.props
        const {
            addToPath,
            onRequirementChangedCreator,
            location,
            canManipulate
        } = this.props
        if (typeof scope === "undefined" || scope === null) {
            const defaultScope: Scope = { type: ScopeType.Custom, value: "" }
            addToPath(location, defaultScope as Scope)
            scope = defaultScope
        }
        return <ul>
            <li key="type">Type: &nbsp;
                <EnumSelectView<ScopeType>
                    theEnum={ScopeType}
                    defaultValue={scope.type}
                    onChange={onRequirementChangedCreator([...location, "type"], false)}
                    location={[...location, "type"]}
                    canManipulate={canManipulate}
                />
            </li>
            <li key="value">Value:&nbsp;
                <input
                    defaultValue={scope.value}
                    placeholder="ACME"
                    onChange={onRequirementChangedCreator([...location, "value"], false)}
                    disabled={!canManipulate}
                />
            </li>
        </ul>
    }
}

export interface ClaimViewProps extends BasicProps {
    claim: Claim
    myInfo: MyInfoJson
    addToPath: AddToPath<Scope>
    onRequirementChangedCreator: OnValueChangedCreator
    fetchCddId: FetchAndAddToPath<string | Identity>
}

export class ClaimView extends Component<ClaimViewProps> {
    render() {
        const {
            claim,
            myInfo,
            addToPath,
            onRequirementChangedCreator,
            fetchCddId,
            location,
            canManipulate
        } = this.props
        const elements: JSX.Element[] = [
            <li key="type">Type: &nbsp;
                <EnumSelectView<ClaimType>
                    theEnum={ClaimType}
                    defaultValue={claim.type}
                    onChange={onRequirementChangedCreator([...location, "type"], false)}
                    location={[...location, "type"]}
                    canManipulate={canManipulate}
                />
            </li>
        ]
        if (isCddClaim(claim)) {
            elements.push(<li key="id">Id:&nbsp;
                <input
                    defaultValue={claim.id}
                    placeholder="123"
                    onChange={onRequirementChangedCreator([...location, "id"], false)}
                    disabled={!canManipulate}
                />
            </li>)
        }
        if (isScopedClaim(claim)) {
            elements.push(<li key="scope">
                Scope:&nbsp;
                <ScopeView
                    scope={claim.scope}
                    addToPath={addToPath}
                    onRequirementChangedCreator={onRequirementChangedCreator}
                    location={[...location, "scope"]}
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
                    defaultValue={claim.cddId}
                    placeholder="123"
                    onChange={onRequirementChangedCreator([...location, "cddId"], false)}
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
                    defaultValue={claim.scopeId}
                    placeholder="123"
                    onChange={onRequirementChangedCreator([...location, "scopeId"], false)}
                    disabled={!canManipulate}
                />
            </li>)
        }
        if (claim.type === ClaimType.Jurisdiction) {
            elements.push(<li key="countryCode">Country code:&nbsp;
                <EnumSelectView<CountryCode>
                    theEnum={CountryCode}
                    defaultValue={claim.code}
                    onChange={onRequirementChangedCreator([...location, "code"], false)}
                    location={[...location, "code"]}
                    canManipulate={canManipulate}
                />
            </li>)
        }
        return <ul>{elements}</ul>
    }
}

export interface ClaimsViewProps extends BasicProps {
    claims: Claim[] | null
    myInfo: MyInfoJson
    addToPath: AddToPath<Scope>
    onRequirementChangedCreator: OnValueChangedCreator
    fetchAndAddToPath: FetchAndAddToPath<string | Identity>
}

export class ClaimsView extends Component<ClaimsViewProps> {
    render() {
        const {
            claims,
            myInfo,
            addToPath,
            onRequirementChangedCreator,
            fetchAndAddToPath,
            location,
            canManipulate
        } = this.props
        if (typeof claims === "undefined" || claims === null || claims.length === 0)
            return <div>No claims</div>
        return <ul>{
            claims
                .map((claim: Claim, claimIndex: number) =>
                    <li key={claimIndex}>
                        Claim {claimIndex}:
                        <ClaimView
                            claim={claim}
                            myInfo={myInfo}
                            addToPath={addToPath}
                            onRequirementChangedCreator={onRequirementChangedCreator}
                            fetchCddId={fetchAndAddToPath}
                            location={[...location, claimIndex]}
                            canManipulate={canManipulate}
                        />
                    </li>
                )
        }</ul>
    }
}

export interface AddInvestorUniquenessClaimViewProps extends BasicProps {
    claim: AddInvestorUniquenessClaimParams
    addToPath: AddToPath<Scope>
    onRequirementChangedCreator: OnValueChangedCreator
    fetchMyCddId: FetchDefaultAndAddToPath
}

export class AddInvestorUniquenessClaimView extends Component<AddInvestorUniquenessClaimViewProps> {
    render() {
        const {
            claim,
            addToPath,
            onRequirementChangedCreator,
            fetchMyCddId,
            location,
            canManipulate
        } = this.props
        const proofToShow = isScopeClaimProof(claim.proof)
            ? claim.proof.proofScopeIdWellformed
            : claim.proof
        return <ul>
            <li key="scope">
                Scope:&nbsp;
                <ScopeView
                    scope={claim.scope}
                    addToPath={addToPath}
                    onRequirementChangedCreator={onRequirementChangedCreator}
                    location={[...location, "scope"]}
                    canManipulate={canManipulate}
                />
            </li>
            <li key="cddId">
                CDD id:&nbsp;
                <input
                    defaultValue={claim.cddId}
                    placeholder="123"
                    onChange={onRequirementChangedCreator([...location, "cddId"], false)}
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
                    disabled={true}
                />
            </li>
            <li key="scopeId">
                Scope id:&nbsp;
                <input
                    defaultValue={claim.scopeId}
                    placeholder="123"
                    disabled={true}
                />
            </li>
            <li key="expiry">
                Expiry:&nbsp;<input
                    defaultValue={claim.expiry?.toISOString()}
                    placeholder="2020-12-31"
                    disabled={!canManipulate}
                />
            </li>
        </ul>
    }
}

