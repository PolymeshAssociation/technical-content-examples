import { SetAssetRequirementsParams } from "@polymathnetwork/polymesh-sdk/api/procedures/setAssetRequirements";
import { Compliance, Identity, Requirement } from "@polymathnetwork/polymesh-sdk/types";
import React, { Component } from "react";
import {
    FetchAndAddToPath,
    Getter,
    MyInfoJson,
    RequirementsInfoJson,
    SimpleAction,
} from "../../types";
import { BasicProps } from "../BasicProps";
import { RequirementsView, RequirementsViewState } from "./RequirementView";

export type IdentityGetter = (did: string) => Promise<Identity>
export type OnComplianceChanged = (complianceState: ComplianceManagerViewState) => void
export type RequirementsSaver = (params: SetAssetRequirementsParams) => Promise<void>
export type ComplianceSimulator = (params: ComplianceCheckParams) => Promise<Compliance>

export interface ComplianceCheckParams {
    from?: string | Identity
    to: string | Identity
}

export interface ComplianceManagerViewState {
    requirements: RequirementsViewState
    modified: boolean
    simulationFrom: string
    simulationTo: string
    compliance: Compliance | null
}

export interface ComplianceManagerViewProps extends BasicProps {
    requirements: RequirementsInfoJson
    myInfo: MyInfoJson
    cardStyle: any
    identityGetter: IdentityGetter
    onComplianceChanged: OnComplianceChanged,
    saveRequirements: RequirementsSaver
    pauseCompliance: SimpleAction
    resumeCompliance: SimpleAction
    simulateCompliance: ComplianceSimulator,
    fetchCddId: FetchAndAddToPath<string | Identity>
    getMyDid: Getter<string>
}

export class ComplianceManagerView extends Component<ComplianceManagerViewProps, ComplianceManagerViewState> {
    constructor(props: ComplianceManagerViewProps) {
        super(props)
        this.state = ComplianceManagerView.RequirementsToState(props.requirements)
    }

    static DummyComplianceManagerViewState = (): ComplianceManagerViewState => ({
        requirements: RequirementsView.DummyRequirementsViewState(),
        modified: false,
        simulationFrom: "",
        simulationTo: "",
        compliance: null,
    })
    static RequirementsToState = (requirements: RequirementsInfoJson): ComplianceManagerViewState => ({
        requirements: RequirementsView.RequirementsToState(requirements.current),
        modified: false,
        simulationFrom: "",
        simulationTo: "",
        compliance: null,
    })
    static StateToParams = (getter: IdentityGetter) => async (state: ComplianceManagerViewState): Promise<SetAssetRequirementsParams> =>
    ({
        requirements: (await RequirementsView.StateToRequirements(getter)(state.requirements))
            .map((requirement: Requirement) => requirement.conditions)
    })

    onRequirementsChanged = (requirements: RequirementsViewState) => this.setState((prev: ComplianceManagerViewState) => {
        const updated: ComplianceManagerViewState = {
            ...prev,
            requirements: requirements,
            modified: true,
        }
        this.props.onComplianceChanged(updated)
        return updated
    })
    onFromChanged = (e) => this.setState({ simulationFrom: e.target.value })
    onFromPicked = async () => this.setState({ simulationFrom: await this.props.getMyDid() })
    onToChanged = (e) => this.setState({ simulationTo: e.target.value })
    onToPicked = async () => this.setState({ simulationTo: await this.props.getMyDid() })
    onSaveRequirements = async () =>
        this.props.saveRequirements(await ComplianceManagerView.StateToParams(this.props.identityGetter)(this.state))
    onSimulateCompliance = async () => this.setState({
        compliance: await this.props.simulateCompliance({
            from: this.state.simulationFrom === "" ? undefined : this.state.simulationFrom,
            to: this.state.simulationTo,
        })
    })

    render() {
        const { requirements, modified, simulationFrom, simulationTo, compliance } = this.state
        const {
            requirements: reqs,
            myInfo,
            cardStyle,
            pauseCompliance,
            resumeCompliance,
            fetchCddId,
            location,
            canManipulate,
        } = this.props
        const canSaveAll: boolean = myInfo.token.current !== null
            && myInfo.token.details?.owner?.did === myInfo.myDid
            && modified
        const canSimulate: boolean = myInfo.token.current !== null
        return <fieldset className={cardStyle}>
            <legend>Compliance Requirements For: {myInfo.token.current?.ticker}</legend>

            <div>
                <RequirementsView
                    requirements={requirements}
                    myInfo={myInfo}
                    onRequirementsChanged={this.onRequirementsChanged}
                    fetchCddId={fetchCddId}
                    location={[...location, "current"]}
                    canManipulate={canManipulate}
                />
            </div>

            <div className="submit">
                <button
                    className="submit save-requirements"
                    onClick={this.onSaveRequirements}
                    disabled={!canSaveAll}>
                    Save the whole list of requirements
                </button>
            </div>

            <div className="submit">
                <button
                    className="submit pause-compliance"
                    onClick={pauseCompliance}
                    disabled={!canManipulate || reqs.arePaused}>
                    Pause compliance
                </button>
                &nbsp;
                <button
                    className="submit resume-compliance"
                    onClick={resumeCompliance}
                    disabled={!canManipulate || !reqs.arePaused}>
                    Resume compliance
                </button>
            </div>

            <div className={cardStyle}>
                <div>Would a transfer of {myInfo.token.current?.ticker} work</div>
                <div>From:&nbsp;
                    <input
                        defaultValue={simulationFrom}
                        placeholder="0x123"
                        onChange={this.onFromChanged} />
                    &nbsp;
                    <button
                        className="submit pick-me-for-sender"
                        onClick={this.onFromPicked}>
                        Pick mine
                    </button>
                </div>
                <div>To:&nbsp;
                    <input
                        defaultValue={simulationTo}
                        placeholder="0x123"
                        onChange={this.onToChanged} />
                    &nbsp;
                    <button
                        className="submit pick-me-for-recipient"
                        onClick={this.onToPicked}>
                        Pick mine
                    </button>
                </div>
                <div className="submit">
                    <button
                        className="submit simulate-compliance"
                        onClick={this.onSimulateCompliance}
                        disabled={!canSimulate}>
                        Try
                    </button>
                </div>
                <div>
                    Result:
                    {compliance?.complies === null ? "No info" : compliance?.complies ? "Aye" : "Nay"}
                </div>
            </div>

        </fieldset>

    }
}
