import { ClaimType } from "@polymathnetwork/polymesh-sdk/types";
import { Component } from "react";
import {
    getDummyTrustedClaimIssuerFlat,
    OnTrustedIssuerChanged,
    OnTrustedIssuersChanged,
    TrustedClaimIssuerFlat,
} from "../../handlers/claims/TrustedClaimIssuerHandlers";
import { EnumSelectView } from "../EnumView";

export interface TrustedClaimIssuerViewProps {
    trustedIssuer: TrustedClaimIssuerFlat
    onTrustedIssuerChanged: OnTrustedIssuerChanged
    canManipulate: boolean
}

export class TrustedClaimIssuerView extends Component<TrustedClaimIssuerViewProps> {

    onChangeIdentity = (e: React.ChangeEvent<HTMLInputElement>) => this.props.onTrustedIssuerChanged({
        ...this.props.trustedIssuer,
        identity: e.target.value,
    })
    onAddTrustedFor = () => this.props.onTrustedIssuerChanged({
        ...this.props.trustedIssuer,
        trustedFor: [
            ClaimType.Accredited,
            ...this.props.trustedIssuer.trustedFor,
        ]
    })
    onChangeTrustedForAt = (index: number) => async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const trustedFor: ClaimType[] = this.props.trustedIssuer.trustedFor
        trustedFor[index] = ClaimType[e.target.value]
        this.props.onTrustedIssuerChanged({
            ...this.props.trustedIssuer,
            trustedFor: trustedFor,
        })
    }
    onRemoveTrustedForAt = (index: number) => () => {
        const trustedFor: ClaimType[] = this.props.trustedIssuer.trustedFor
        trustedFor.splice(index, 1)
        this.props.onTrustedIssuerChanged({
            ...this.props.trustedIssuer,
            trustedFor: trustedFor,
        })
    }

    render() {
        const {
            trustedIssuer: {
                identity,
                trustedFor,
            },
            canManipulate,
        } = this.props
        const trustedForElem: JSX.Element = trustedFor && trustedFor.length > 0
            ? <ol>{
                trustedFor.map((claimType: ClaimType, index: number) => <li key={index}>
                    <EnumSelectView<ClaimType>
                        theEnum={ClaimType}
                        defaultValue={claimType}
                        onChange={this.onChangeTrustedForAt(index)}
                        canManipulate={canManipulate}
                    />
                    &nbsp;
                    <button
                        className="submit remove-trusted-for"
                        onClick={this.onRemoveTrustedForAt(index)}
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
                    defaultValue={identity}
                    placeholder="0x123"
                    onChange={this.onChangeIdentity}
                    disabled={!canManipulate}
                />
            </li>
            <li key="trustedFor">Trusted for:&nbsp;
                <button
                    className="submit add-trusted-for"
                    onClick={this.onAddTrustedFor}
                    disabled={!canManipulate}>
                    Add trusted for
                </button>
                {trustedForElem}
            </li>
        </ul>
    }
}

export interface TrustedClaimIssuersViewProps {
    trustedIssuers: TrustedClaimIssuerFlat[]
    onTrustedIssuersChanged: OnTrustedIssuersChanged
    canManipulate: boolean
}

export class TrustedClaimIssuersView extends Component<TrustedClaimIssuersViewProps> {

    onAddTrustedIssuer = () => this.props.onTrustedIssuersChanged([
        getDummyTrustedClaimIssuerFlat(),
        ...this.props.trustedIssuers,
    ])
    onTrustedIssuerChanged = (index: number) => (trustedClaimIssuer: TrustedClaimIssuerFlat) => {
        const trusteds: TrustedClaimIssuerFlat[] = this.props.trustedIssuers
        trusteds[index] = trustedClaimIssuer
        this.props.onTrustedIssuersChanged(trusteds)
    }
    onRemoveTrustedIssuerAt = (index: number) => () => {
        const trusteds: TrustedClaimIssuerFlat[] = this.props.trustedIssuers
        trusteds.splice(index, 1)
        this.props.onTrustedIssuersChanged(trusteds)
    }

    render() {
        const { trustedIssuers, canManipulate } = this.props
        const addButton: JSX.Element = <button
            className="submit add-trusted-claim-issuer"
            onClick={this.onAddTrustedIssuer}
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
                trustedIssuers.map((trustedIssuer: TrustedClaimIssuerFlat, index: number) =>
                    <li key={index}>
                        Issuer {index}:&nbsp;
                        <button
                            className="submit remove-trusted-claim-issuer"
                            onClick={this.onRemoveTrustedIssuerAt(index)}
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