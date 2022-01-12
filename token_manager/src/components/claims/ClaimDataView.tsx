import { Polymesh } from "@polymathnetwork/polymesh-sdk";
import { Claim, ClaimData, ClaimTarget } from "@polymathnetwork/polymesh-sdk/types";
import { Component } from "react";
import {
    ClaimDataFlat,
    convertClaimDataToFlat,
    OnClaimDataChanged,
    OnClaimDatasChanged,
    OnClaimTargetChanged,
} from "../../handlers/claims/ClaimDataHandlers";
import { isIdentity } from "../../types";
import { DateTimeEntryView } from "../elements/DateTimeEntry";
import { ClaimView } from "./ClaimView";

export interface ClaimTargetViewProps {
    claimTarget: ClaimTarget
    isWrongStyle: any
    canManipulate: boolean
    apiPromise: Promise<Polymesh>
    onClaimTargetChanged: OnClaimTargetChanged
}

export class ClaimTargetView extends Component<ClaimTargetViewProps> {

    onTargetChanged = (e) => this.props.onClaimTargetChanged({
        ...this.props.claimTarget,
        target: e.target.value,
    })
    onExpiryChanged = (newExpiry: Date | null) => this.props.onClaimTargetChanged({
        ...this.props.claimTarget,
        expiry: newExpiry,
    })
    onClaimChanged = (newClaim: Claim) => this.props.onClaimTargetChanged({
        ...this.props.claimTarget,
        claim: newClaim,
    })

    render() {
        const { claimTarget, canManipulate, isWrongStyle, apiPromise } = this.props
        const { target, expiry } = claimTarget
        return <ul>
            <li key="target">Target:&nbsp;
                <input
                    defaultValue={isIdentity(target) ? target.did : target}
                    placeholder="0x123"
                    onChange={this.onTargetChanged}
                    disabled={!canManipulate}
                />
            </li>
            <li key="expiry">Expiry:&nbsp;
                <DateTimeEntryView
                    dateTime={expiry}
                    isOptional={true}
                    isWrongStyle={isWrongStyle}
                    validDateChanged={this.onExpiryChanged}
                    canManipulate={canManipulate}
                />
            </li>
            <li key="claim">Claim:&nbsp;
                <ClaimView
                    apiPromise={apiPromise}
                    claim={claimTarget.claim}
                    onClaimChanged={this.onClaimChanged}
                    canManipulate={canManipulate}
                />
            </li>
        </ul>
    }
}

export interface ClaimDataViewProps {
    claimData: ClaimData<Claim>
    isWrongStyle: any
    canManipulate: boolean
    apiPromise: Promise<Polymesh>
    onClaimDataChanged: OnClaimDataChanged
}

export class ClaimDataView extends Component<ClaimDataViewProps> {

    onStringChanged = (key: keyof ClaimDataFlat) => (e) => this.props.onClaimDataChanged({
        ...convertClaimDataToFlat(this.props.claimData),
        [key]: e.target.value,
    })
    onValidExpiryChanged = (newExpiry: Date | null) => this.props.onClaimDataChanged({
        ...convertClaimDataToFlat(this.props.claimData),
        expiry: newExpiry,
    })
    onClaimChanged = (newClaim: Claim) => this.props.onClaimDataChanged({
        ...convertClaimDataToFlat(this.props.claimData),
        claim: newClaim,
    })

    render() {
        const {
            claimData,
            canManipulate,
            apiPromise,
            isWrongStyle,
        } = this.props
        const { target, issuer, expiry, issuedAt, claim } = convertClaimDataToFlat(claimData)

        return <ul>
            <li key="target">Target:&nbsp;
                <input
                    value={target}
                    placeholder="0x123"
                    disabled={!canManipulate}
                    onChange={this.onStringChanged("target")}
                />
            </li>
            <li key="issuer">Issuer:&nbsp;
                <input
                    value={issuer}
                    placeholder="0x123"
                    disabled={!canManipulate}
                    onChange={this.onStringChanged("issuer")}
                />
            </li>
            <li key="issuedAt">Issued at: {issuedAt?.toISOString()}</li>
            <li key="expiry">Expiry:&nbsp;
                <DateTimeEntryView
                    dateTime={expiry}
                    isWrongStyle={isWrongStyle}
                    validDateChanged={this.onValidExpiryChanged}
                    isOptional={false}
                    canManipulate={canManipulate}
                />
            </li>
            <li key="claim">Claim:&nbsp;
                <ClaimView
                    apiPromise={apiPromise}
                    claim={claim}
                    onClaimChanged={this.onClaimChanged}
                    canManipulate={canManipulate}
                />
            </li>
        </ul>
    }
}

export interface ClaimDatasViewProps {
    myDid: string
    claimDatas: ClaimData<Claim>[]
    isWrongStyle: any
    canManipulate: boolean
    apiPromise: Promise<Polymesh>
    onClaimDatasChanged: OnClaimDatasChanged
}

export class ClaimDatasView extends Component<ClaimDatasViewProps> {

    onClaimDataChangedAt = (index: number) => (claimData: ClaimDataFlat) => {
        const claimDatas: ClaimDataFlat[] = this.props.claimDatas.map(convertClaimDataToFlat)
        claimDatas[index] = claimData
        this.props.onClaimDatasChanged(claimDatas)
    }
    onRevokeAttestation = (claimData: ClaimData) => async () => {
        const api: Polymesh = await this.props.apiPromise
        await (await api.claims.revokeClaims({
            claims: [{
                target: claimData.target,
                claim: claimData.claim,
            }],
        })).run()
    }

    render() {
        const { myDid, claimDatas, apiPromise, isWrongStyle, canManipulate } = this.props
        if (claimDatas.length === 0) return <div>No attestations</div>
        return <ul>{
            claimDatas
                .map((claimData: ClaimData, index: number) => {
                    const canRevokeIt = canManipulate && claimData.issuer.did === myDid
                    return <li key={index}>
                        Attestation {index}:&nbsp;
                        <button
                            className="submit revoke-claim-data"
                            onClick={this.onRevokeAttestation(claimData)}
                            disabled={!canRevokeIt}>
                            Revoke
                        </button>
                        <ClaimDataView
                            claimData={claimData}
                            canManipulate={false}
                            isWrongStyle={isWrongStyle}
                            apiPromise={apiPromise}
                            onClaimDataChanged={this.onClaimDataChangedAt(index)}
                        />
                    </li>
                })
        }</ul>
    }
}
