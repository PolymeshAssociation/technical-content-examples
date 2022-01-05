import { Polymesh } from "@polymathnetwork/polymesh-sdk";
import { Claim, ClaimData, Identity } from "@polymathnetwork/polymesh-sdk/types";
import { Component } from "react";
import {
    ClaimDataFlat,
    convertClaimDataToFlat,
    OnClaimDataChanged,
    OnClaimDatasChanged,
} from "../../handlers/claims/ClaimDataHandlers";
import { FetchAndAddToPath, MyInfoJson } from "../../types";
import { BasicProps } from "../BasicProps";
import { DateTimeEntryView } from "../elements/DateTimeEntry";
import { ClaimView } from "./ClaimView";

export interface ClaimDataViewProps extends BasicProps {
    claimData: ClaimData<Claim>
    myInfo: MyInfoJson
    apiPromise: Promise<Polymesh>
    isWrongStyle: any
    onClaimDataChanged: OnClaimDataChanged
    fetchCddId: FetchAndAddToPath<string | Identity>
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
            myInfo,
            canManipulate,
            apiPromise,
            isWrongStyle,
            fetchCddId,
            location,
        } = this.props
        const { target, issuer, expiry, issuedAt, claim } = convertClaimDataToFlat(claimData)

        return <ul>
            <li key="target">Target:&nbsp;
                <input
                    defaultValue={target}
                    placeholder="0x123"
                    disabled={!canManipulate}
                    onChange={this.onStringChanged("target")}
                />
            </li>
            <li key="issuer">Issuer:&nbsp;
                <input
                    defaultValue={issuer}
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
                    myInfo={myInfo}
                    fetchCddId={fetchCddId}
                    onClaimChanged={this.onClaimChanged}
                    location={[...location, "claim"]}
                    canManipulate={canManipulate}
                />
            </li>
        </ul>
    }
}

export interface ClaimDatasViewProps extends BasicProps {
    claimDatas: ClaimData<Claim>[]
    myInfo: MyInfoJson
    apiPromise: Promise<Polymesh>
    isWrongStyle: any
    onClaimDatasChanged: OnClaimDatasChanged
    fetchCddId: FetchAndAddToPath<string | Identity>
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
        const { claimDatas, myInfo, apiPromise, isWrongStyle, location, canManipulate, fetchCddId } = this.props
        if (claimDatas.length === 0) return <div>No attestations</div>
        return <ul>{
            claimDatas
                .map((claimData: ClaimData, index: number) => {
                    const canManipulateIt = canManipulate && claimData.issuer.did === myInfo.myDid
                    return <li key={index}>
                        Attestation {index}:&nbsp;
                        <button
                            className="submit revoke-claim-data"
                            onClick={this.onRevokeAttestation(claimData)}
                            disabled={!canManipulateIt}>
                            Revoke
                        </button>
                        <ClaimDataView
                            claimData={claimData}
                            canManipulate={canManipulateIt}
                            myInfo={myInfo}
                            isWrongStyle={isWrongStyle}
                            apiPromise={apiPromise}
                            location={[...location, index]}
                            fetchCddId={fetchCddId}
                            onClaimDataChanged={this.onClaimDataChangedAt(index)}
                        />
                    </li>
                })
        }</ul>
    }
}
