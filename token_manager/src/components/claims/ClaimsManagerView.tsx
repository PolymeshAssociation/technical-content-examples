import { Polymesh } from "@polymathnetwork/polymesh-sdk";
import {
    Claim,
    ClaimData,
    ClaimTarget,
    Identity,
    IdentityWithClaims,
    ResultSet,
} from "@polymathnetwork/polymesh-sdk/types";
import { Component } from "react";
import {
    getDummyClaimTarget,
    OnClaimDataChanged,
} from "../../handlers/claims/ClaimDataHandlers";
import { FetchAndAddToPath, FetchDefaultAndAddToPath, MyInfoJson } from "../../types";
import { BasicProps } from "../BasicProps";
import { ClaimDatasView, ClaimTargetView } from "./ClaimDataView";
import { AddInvestorUniquenessClaimView } from "./ClaimView";

interface ClaimsManagerViewState {
    targetToLoad: string
    claimDatas: ClaimData<Claim>[]
    claimTargetToAdd: ClaimTarget
}

export interface ClaimsManagerViewProps extends BasicProps {
    myInfo: MyInfoJson
    apiPromise: Promise<Polymesh>
    cardStyle: any
    isWrongStyle: any
    onClaimDataChanged: OnClaimDataChanged
    fetchCddId: FetchAndAddToPath<string | Identity>
    fetchMyCddId: FetchDefaultAndAddToPath
    addUniquenessAttestation: FetchDefaultAndAddToPath
}

export class ClaimsManagerView extends Component<ClaimsManagerViewProps, ClaimsManagerViewState> {

    constructor(props: ClaimsManagerViewProps) {
        super(props)
        this.state = {
            targetToLoad: "",
            claimDatas: [],
            claimTargetToAdd: getDummyClaimTarget(),
        }
    }

    onTargetToLoadChanged = (e) => this.setState({
        targetToLoad: e.target.value,
    })
    onPickMyDid = async () => {
        const api: Polymesh = await this.props.apiPromise
        const me = await api.getCurrentIdentity()
        this.setState({
            targetToLoad: me.did,
        })
    }
    onLoadAttestationsReceived = async () => {
        const api: Polymesh = await this.props.apiPromise
        const claimResult: ResultSet<IdentityWithClaims> = await api.claims.getIdentitiesWithClaims({
            targets: [this.state.targetToLoad],
        })
        this.setState({
            claimDatas: claimResult.data[0].claims,
        })
    }
    onAttestationToAddChanged = (newClaimTarget: ClaimTarget) => this.setState({
        claimTargetToAdd: newClaimTarget,
    })
    onAddAttestation = async () => {
        const api: Polymesh = await this.props.apiPromise
        await (await api.claims.addClaims({ claims: [this.state.claimTargetToAdd] })).run()
    }

    render() {
        const {
            myInfo,
            canManipulate,
            apiPromise,
            cardStyle,
            isWrongStyle,
            fetchCddId,
            fetchMyCddId,
            addUniquenessAttestation,
            location,
        } = this.props
        const { targetToLoad, claimDatas, claimTargetToAdd } = this.state

        return <fieldset className={cardStyle}>
            <legend>Attestations</legend>

            <div className="submit">
                <button
                    className="submit load-attestations-received-by"
                    onClick={this.onLoadAttestationsReceived}>
                    Load attestations received by
                </button>
                &nbsp;
                <input
                    value={targetToLoad}
                    placeholder="0x123"
                    onChange={this.onTargetToLoadChanged}
                />
                &nbsp;
                <button
                    className="submit pick-my-did"
                    onClick={this.onPickMyDid}>
                    Pick me
                </button>
            </div>

            <div>
                <ClaimDatasView
                    claimDatas={claimDatas}
                    canManipulate={canManipulate}
                    isWrongStyle={isWrongStyle}
                    location={[...location, "current"]}
                    myInfo={myInfo}
                    apiPromise={apiPromise}
                    fetchCddId={fetchCddId}
                    onClaimDatasChanged={() => { }}
                />
            </div>

            <fieldset className={cardStyle}>
                <legend>Attestation to add:</legend>

                <div>
                    <ClaimTargetView
                        claimTarget={claimTargetToAdd}
                        canManipulate={true}
                        location={[...location, "toAdd"]}
                        myInfo={myInfo}
                        isWrongStyle={isWrongStyle}
                        apiPromise={apiPromise}
                        fetchCddId={fetchCddId}
                        onClaimTargetChanged={this.onAttestationToAddChanged}
                    />
                </div>
                <div className="submit">
                    <button
                        className="submit add-attestation"
                        onClick={this.onAddAttestation}>
                        Add KYC attestation
                    </button>
                </div>
                <div>
                    It takes some time for the added attestation<br />
                    to show in the list above because the<br />
                    middleware first needs to be updated
                </div>
            </fieldset>

            <fieldset className={cardStyle}>
                <legend>Investor uniqueness to add to yourself:</legend>

                <div>
                    <AddInvestorUniquenessClaimView
                        claimParams={myInfo.attestations.uniquenessToAdd}
                        fetchMyCddId={fetchMyCddId}
                        location={[...location, "uniquenessToAdd"]}
                        isWrongStyle={isWrongStyle}
                        canManipulate={true}
                    />
                </div>

                <div className="submit">
                    <button
                        className="submit add-unique-attestation"
                        onClick={() => addUniquenessAttestation([...location, "uniquenessToAdd"])}>
                        Add uniqueness attestation
                    </button>
                </div>
                <div>
                    It takes some time for the added attestation<br />
                    to show in the list above because the<br />
                    middleware needs to be updated
                </div>
            </fieldset>

        </fieldset>
    }
}
