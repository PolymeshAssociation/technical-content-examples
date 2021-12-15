import { ClaimType, TrustedClaimIssuer } from "@polymathnetwork/polymesh-sdk/types";
import { Component } from "react";
import { isIdentity, } from "../../types";
import { EnumSelectView } from "../EnumView";
import { IdentityGetter } from "./ComplianceView";

export type OnTrustedIssuerChanged = (trustedClaimIssuer: TrustedClaimIssuerViewState) => void

export interface TrustedClaimIssuerViewState {
    identity: string
    trustedFor: ClaimType[]
    modified: boolean,
}

export interface TrustedClaimIssuerViewProps {
    trustedIssuer: TrustedClaimIssuer | TrustedClaimIssuerViewState
    onTrustedIssuerChanged: OnTrustedIssuerChanged
    canManipulate: boolean
}

export class TrustedClaimIssuerView extends Component<TrustedClaimIssuerViewProps, TrustedClaimIssuerViewState> {
    constructor(props: TrustedClaimIssuerViewProps) {
        super(props)
        this.state = TrustedClaimIssuerView.TrustedIssuerToState(props.trustedIssuer)
    }

    static DummyTrustedClaimIssuerViewState = (): TrustedClaimIssuerViewState => ({
        identity: "",
        trustedFor: [],
        modified: false,
    })
    static TrustedIssuerToState = (trustedIssuer: TrustedClaimIssuer | TrustedClaimIssuerViewState | null): TrustedClaimIssuerViewState => ({
        identity: (isIdentity(trustedIssuer?.identity) ? trustedIssuer.identity.did : trustedIssuer?.identity) ?? "",
        trustedFor: trustedIssuer?.trustedFor ?? [],
        modified: false,
    })
    static StateToTrustedIssuer = (getter: IdentityGetter) =>
        async (state: TrustedClaimIssuerViewState): Promise<TrustedClaimIssuer> =>
        ({
            identity: await getter(state.identity),
            trustedFor: state.trustedFor,
        })

    changeIdentity = (e) => this.setState((prev: TrustedClaimIssuerViewState) => {
        const updated: TrustedClaimIssuerViewState = {
            ...prev,
            identity: e.target.value,
            modified: true,
        }
        this.props.onTrustedIssuerChanged(updated)
        return updated
    })
    addTrusted = (e) => this.setState((prev: TrustedClaimIssuerViewState) => {
        const updated: TrustedClaimIssuerViewState = {
            ...prev,
            trustedFor: [
                ClaimType.Accredited,
                ...prev.trustedFor,
            ],
            modified: true,
        }
        this.props.onTrustedIssuerChanged(updated)
        return updated
    })
    changeTrustedAt = (index: number) => async (e) => this.setState((prev: TrustedClaimIssuerViewState) => {
        const trustedFor: ClaimType[] = prev.trustedFor
        trustedFor[index] = e.target.value
        const updated: TrustedClaimIssuerViewState = {
            ...prev,
            trustedFor: trustedFor,
            modified: true,
        }
        this.props.onTrustedIssuerChanged(updated)
        return updated
    })
    removeTrustedForAt = (index: number) => (e) => this.setState((prev: TrustedClaimIssuerViewState) => {
        const trustedFor: ClaimType[] = prev.trustedFor
        trustedFor.splice(index, 1)
        const updated: TrustedClaimIssuerViewState = {
            ...prev,
            trustedFor: trustedFor,
            modified: true,
        }
        this.props.onTrustedIssuerChanged(updated)
        return updated
    })

    render() {
        const { canManipulate } = this.props
        const trustedFor: JSX.Element = this.state.trustedFor && this.state.trustedFor.length > 0
            ? <ol>{
                this.state.trustedFor.map((claimType: ClaimType, index: number) => <li key={index}>
                    <EnumSelectView<ClaimType>
                        theEnum={ClaimType}
                        defaultValue={claimType}
                        onChange={this.changeTrustedAt(index)}
                        canManipulate={canManipulate}
                    />
                    &nbsp;
                    <button
                        className="submit remove-trusted-for"
                        onClick={this.removeTrustedForAt(index)}
                        disabled={!canManipulate}>
                        Remove {index}
                    </button>
                </li>)
            }</ol>
            : <div>Not trusted for anything</div>
        return <ul>
            <li key="identity">
                Did:
                <input
                    defaultValue={this.state.identity}
                    placeholder="0x123"
                    onChange={this.changeIdentity}
                    disabled={!canManipulate}
                />
            </li>
            <li key="trustedFor">Trusted for:&nbsp;
                <button
                    className="submit add-trusted-for"
                    onClick={this.addTrusted}
                    disabled={!canManipulate}>
                    Add trusted for
                </button>
                {trustedFor}
            </li>
        </ul>
    }
}

export type OnTrustedIssuersChanged = (trustedClaimIssuers: TrustedClaimIssuersViewState) => void

export interface TrustedClaimIssuersViewState {
    trustedIssuers: TrustedClaimIssuerViewState[]
    modified: boolean
}

export interface TrustedClaimIssuersViewProps {
    trustedIssuers: TrustedClaimIssuer[] | TrustedClaimIssuerViewState[] | null
    onTrustedIssuersChanged: OnTrustedIssuersChanged
    canManipulate: boolean
}

export class TrustedClaimIssuersView extends Component<TrustedClaimIssuersViewProps, TrustedClaimIssuersViewState> {
    constructor(props: TrustedClaimIssuersViewProps) {
        super(props)
        this.state = TrustedClaimIssuersView.TrustedIssuersToState(props.trustedIssuers)
    }

    static DummyTrustedClaimIssuersViewState = (): TrustedClaimIssuersViewState => ({
        trustedIssuers: [],
        modified: false,
    })
    static TrustedIssuersToState = (trustedIssuers: TrustedClaimIssuer[] | TrustedClaimIssuerViewState[] | null): TrustedClaimIssuersViewState => ({
        trustedIssuers: trustedIssuers?.map(TrustedClaimIssuerView.TrustedIssuerToState) ?? [],
        modified: false,
    })

    addTrustedIssuer = (e) =>
        this.setState((prev: TrustedClaimIssuersViewState) => {
            const updated: TrustedClaimIssuersViewState = {
                ...prev,
                trustedIssuers: [
                    {
                        identity: "",
                        trustedFor: [],
                    } as TrustedClaimIssuerViewState,
                    ...prev.trustedIssuers,
                ],
                modified: true,
            }
            this.props.onTrustedIssuersChanged(updated)
            return updated
        })
    onTrustedIssuerChanged = (index: number) => (trustedClaimIssuer: TrustedClaimIssuerViewState) =>
        this.setState((prev: TrustedClaimIssuersViewState) => {
            const trusteds: TrustedClaimIssuerViewState[] = prev.trustedIssuers
            trusteds[index] = trustedClaimIssuer
            const updated: TrustedClaimIssuersViewState = {
                ...prev,
                trustedIssuers: trusteds,
                modified: true,
            }
            this.props.onTrustedIssuersChanged(updated)
            return updated
        })
    removeTrustedIssuerAt = (index: number) => (e) => this.setState((prev: TrustedClaimIssuersViewState) => {
        const trusteds: TrustedClaimIssuerViewState[] = prev.trustedIssuers
        trusteds.splice(index, 1)
        const updated: TrustedClaimIssuersViewState = {
            ...prev,
            trustedIssuers: trusteds,
            modified: true,
        }
        this.props.onTrustedIssuersChanged(updated)
        return updated
    })

    render() {
        const { trustedIssuers } = this.state
        const { canManipulate } = this.props
        const addButton: JSX.Element = <button
            className="submit add-trusted-claim-issuer"
            onClick={this.addTrustedIssuer}
            disabled={!canManipulate}>
            Add trusted claim issuer
        </button>
        if (typeof trustedIssuers === "undefined" || trustedIssuers === null || trustedIssuers.length === 0)
            return <div>
                No trusted issuers&nbsp;{addButton}
            </div>
        return <div>
            {addButton}
            <ul>{
                trustedIssuers.map((trustedIssuer: TrustedClaimIssuerViewState, index: number) =>
                    <li key={index}>
                        Issuer {index}:&nbsp;
                        <button
                            className="submit remove-trusted-claim-issuer"
                            onClick={this.removeTrustedIssuerAt(index)}
                            disabled={!canManipulate}>
                            Remove {index}
                        </button>
                        <TrustedClaimIssuerView
                            trustedIssuer={trustedIssuer}
                            onTrustedIssuerChanged={this.onTrustedIssuerChanged(index)}
                            canManipulate={canManipulate}
                        />
                    </li>)
            }</ul >
        </div>
    }
}