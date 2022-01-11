import { Polymesh } from "@polymathnetwork/polymesh-sdk";
import { AddInvestorUniquenessClaimParams } from "@polymathnetwork/polymesh-sdk/internal";
import {
    Claim,
    ClaimData,
    ClaimTarget,
    Identity,
    IdentityWithClaims,
    ResultSet,
} from "@polymathnetwork/polymesh-sdk/types";
import { Component } from "react";
import { getDummyClaimTarget } from "../../handlers/claims/ClaimDataHandlers";
import {
    getDummyAddInvestorUniquenessClaimParams,
    OnAddInvestorUniquenessClaimParamsChanged,
} from "../../handlers/claims/ClaimHandlers";
import { ClaimDatasView, ClaimTargetView } from "./ClaimDataView";
import { AddInvestorUniquenessClaimView } from "./ClaimView";

interface ClaimsManagerViewState {
    targetToLoad: string
    claimDatas: ClaimData<Claim>[]
    claimTargetToAdd: ClaimTarget
    addInvestorUniquenessClaimParams: AddInvestorUniquenessClaimParams
}

export interface ClaimsManagerViewProps {
    myDid: string
    cardStyle: any
    isWrongStyle: any
    canManipulate: boolean
    apiPromise: Promise<Polymesh>
    onAddInvestorUniquenessClaimParamsChanged: OnAddInvestorUniquenessClaimParamsChanged
}

export class ClaimsManagerView extends Component<ClaimsManagerViewProps, ClaimsManagerViewState> {

    constructor(props: ClaimsManagerViewProps) {
        super(props)
        this.state = {
            targetToLoad: "",
            claimDatas: [],
            claimTargetToAdd: getDummyClaimTarget(),
            addInvestorUniquenessClaimParams: getDummyAddInvestorUniquenessClaimParams(),
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
    onAddInvestorUniquenessClaimParamsChanged = (params: AddInvestorUniquenessClaimParams) => this.setState({
        addInvestorUniquenessClaimParams: params,
    })
    onAddInvestorUniquenessClaim = async () => {
        const api: Polymesh = await this.props.apiPromise
        const me: Identity = await api.getCurrentIdentity()
        const polyWallet = (window || {})["polyWallet"]
        const network = await polyWallet.network.get()
        const crypto = await import('@polymathnetwork/confidential-identity')
        const params: AddInvestorUniquenessClaimParams = this.state.addInvestorUniquenessClaimParams
        const data = await polyWallet.uid.requestProof({ ticker: params.scope.value })
            .catch((e) => {
                if (e.message !== "Uid not found") throw e
                const mockedUid: string = crypto.create_mocked_investor_uid(me.did)
                return polyWallet.uid.provide({
                    uid: mockedUid,
                    did: me.did,
                    network: network.name,
                })
            })
            .then(() => polyWallet.uid.requestProof({ ticker: params.scope.value }))
        params.proof = data.proof
        params.scopeId = data.scope_id
        await (await api.claims.addInvestorUniquenessClaim(params)).run()
    }

    render() {
        const { myDid, canManipulate, apiPromise, cardStyle, isWrongStyle } = this.props
        const {
            targetToLoad,
            claimDatas,
            claimTargetToAdd,
            addInvestorUniquenessClaimParams,
        } = this.state

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
                    myDid={myDid}
                    claimDatas={claimDatas}
                    canManipulate={canManipulate}
                    isWrongStyle={isWrongStyle}
                    apiPromise={apiPromise}
                    onClaimDatasChanged={() => { }}
                />
            </div>

            <fieldset className={cardStyle}>
                <legend>Attestation to add:</legend>

                <div>
                    <ClaimTargetView
                        claimTarget={claimTargetToAdd}
                        canManipulate={true}
                        isWrongStyle={isWrongStyle}
                        apiPromise={apiPromise}
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
                        claimParams={addInvestorUniquenessClaimParams}
                        apiPromise={apiPromise}
                        isWrongStyle={isWrongStyle}
                        canManipulate={true}
                        onAddInvestorUniquenessClaimParamsChanged={this.onAddInvestorUniquenessClaimParamsChanged}
                    />
                </div>

                <div className="submit">
                    <button
                        className="submit add-unique-attestation"
                        onClick={this.onAddInvestorUniquenessClaim}>
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
