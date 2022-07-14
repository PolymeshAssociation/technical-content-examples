import { Polymesh } from "@polymathnetwork/polymesh-sdk";
import { AddInvestorUniquenessClaimParams, TransactionQueue } from "@polymathnetwork/polymesh-sdk/internal";
import {
    Claim,
    ClaimData,
    ClaimTarget,
    IdentityWithClaims,
    ResultSet,
} from "@polymathnetwork/polymesh-sdk/types";
import { ChangeEvent, Component, KeyboardEvent } from "react";
import { getDummyClaimTarget } from "../../handlers/claims/ClaimDataHandlers";
import {
    getDummyAddInvestorUniquenessClaimParams,
    OnAddInvestorUniquenessClaimParamsChanged,
} from "../../handlers/claims/ClaimHandlers";
import { ApiGetter, PolyWallet } from '../../types';
import { showFetchCycle, ShowFetchCycler, showRequestCycle, ShowRequestCycler } from "../../ui-helpers";
import { CollapsibleFieldsetView } from "../presentation/CollapsibleFieldsetView";
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
    apiGetter: ApiGetter
    polyWallet: PolyWallet
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

    onTargetToLoadChanged = (e: ChangeEvent<HTMLInputElement>) => this.setState({ targetToLoad: e.target.value })
    onPickMyDid = async () => this.setState({ targetToLoad: this.props.myDid })
    onTargetKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" ? this.onLoadAttestationsReceived() : ""
    onLoadAttestationsReceived = async () => {
        const api: Polymesh = await this.props.apiGetter()
        const cycler: ShowFetchCycler = showFetchCycle("Attestations")
        const claimResult: ResultSet<IdentityWithClaims> = await api.claims.getIdentitiesWithClaims({
            targets: [this.state.targetToLoad],
        })
        cycler.fetched()
        this.setState({
            claimDatas: claimResult.data[0].claims,
        })
    }
    onAttestationToAddChanged = (newClaimTarget: ClaimTarget) => this.setState({ claimTargetToAdd: newClaimTarget })
    onAddAttestation = async () => {
        const api: Polymesh = await this.props.apiGetter()
        const cycler: ShowRequestCycler = showRequestCycle("Adding attestation")
        const queue: TransactionQueue<void, void> = await api.claims.addClaims({ claims: [this.state.claimTargetToAdd] })
        cycler.running()
        await queue.run()
        cycler.hasRun()
    }
    onAddInvestorUniquenessClaimParamsChanged = (params: AddInvestorUniquenessClaimParams) => this.setState({
        addInvestorUniquenessClaimParams: params,
    })
    onAddInvestorUniquenessClaim = async () => {
        const api: Polymesh = await this.props.apiGetter()
        const { myDid, polyWallet } = this.props
        const network = await polyWallet.network.get()
        const cyclerImp: ShowFetchCycler = showFetchCycle("Confidential identity module")
        const crypto = await import('@polymathnetwork/confidential-identity')
        cyclerImp.fetched()
        const params: AddInvestorUniquenessClaimParams = this.state.addInvestorUniquenessClaimParams
        const cyclerProof: ShowFetchCycler = showFetchCycle("Request proof")
        const data = await polyWallet.uid.requestProof({ ticker: params.scope.value })
            .catch((e) => {
                if (e.message !== "Uid not found") throw e
                const mockedUid: string = crypto.create_mocked_investor_uid(myDid)
                return polyWallet.uid.provide({
                    uid: mockedUid,
                    did: myDid,
                    network: network.name,
                })
            })
            .then(() => polyWallet.uid.requestProof({ ticker: params.scope.value }))
        cyclerProof.fetched()
        params.proof = data.proof
        params.scopeId = data.scope_id
        const cycler: ShowRequestCycler = showRequestCycle("Adding investor uniqueness claim")
        const queue = await api.claims.addInvestorUniquenessClaim(params)
        cycler.running()
        await queue.run()
        cycler.hasRun()
    }

    render() {
        const { myDid, canManipulate, apiGetter, cardStyle, isWrongStyle } = this.props
        const {
            targetToLoad,
            claimDatas,
            claimTargetToAdd,
            addInvestorUniquenessClaimParams,
        } = this.state

        return <CollapsibleFieldsetView
            className={cardStyle}
            legend="Attestations"
            collapsed={true}>

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
                    onKeyDown={this.onTargetKeyDown}
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
                    apiGetter={apiGetter}
                    onClaimDatasChanged={() => { }}
                />
            </div>

            <CollapsibleFieldsetView
                className={cardStyle}
                legend="Attestation to add"
                collapsed={false}>

                <div>
                    <ClaimTargetView
                        claimTarget={claimTargetToAdd}
                        canManipulate={true}
                        isWrongStyle={isWrongStyle}
                        apiGetter={apiGetter}
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
            </CollapsibleFieldsetView>

            <CollapsibleFieldsetView
                className={cardStyle}
                legend="Investor uniqueness to add to yourself"
                collapsed={false}>

                <div>
                    <AddInvestorUniquenessClaimView
                        claimParams={addInvestorUniquenessClaimParams}
                        myDid={myDid}
                        apiGetter={apiGetter}
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
            </CollapsibleFieldsetView>

        </CollapsibleFieldsetView>
    }
}
