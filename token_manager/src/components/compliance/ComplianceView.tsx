import { isEqual } from "lodash"
import { Polymesh } from "@polymathnetwork/polymesh-sdk";
import { SetAssetRequirementsParams } from "@polymathnetwork/polymesh-sdk/api/procedures/setAssetRequirements";
import { Compliance, Identity, Requirement, SecurityToken } from "@polymathnetwork/polymesh-sdk/types";
import { Component } from "react";
import { IdentityGetter } from "../../handlers/compliance/ComplianceHandlers";
import {
    convertRequirementFlatToRequirement,
    convertRequirementToFlat,
    RequirementFlat,
} from "../../handlers/compliance/RequirementHandlers";
import { fetchTokenInfoJson, OnTokenInfoChanged } from "../../handlers/token/TokenHandlers";
import { RequirementsInfoJson, TokenInfoJson } from "../../types";
import { RequirementsView } from "./RequirementView";

export interface ComplianceCheckParams {
    from?: string | Identity
    to: string | Identity
}

interface ComplianceManagerViewState {
    requirements: RequirementFlat[]
    modified: boolean
    simulationFrom: string
    simulationTo: string
    compliance: Compliance | null
}

export interface ComplianceManagerViewProps {
    token: TokenInfoJson
    requirements: RequirementsInfoJson
    myDid: string
    canManipulate: boolean
    apiPromise: Promise<Polymesh>
    cardStyle: any
    onTokenInfoChanged: OnTokenInfoChanged
}

export class ComplianceManagerView extends Component<ComplianceManagerViewProps, ComplianceManagerViewState> {
    constructor(props: ComplianceManagerViewProps) {
        super(props)
        this.state = ComplianceManagerView.PropsToState(props.requirements.current)
    }

    componentDidUpdate(prevProps: Readonly<ComplianceManagerViewProps>, _: Readonly<ComplianceManagerViewState>): void {
        const prevReq = ComplianceManagerView.PropsToState(prevProps.requirements.current)
        const nextReq = ComplianceManagerView.PropsToState(this.props.requirements.current)
        if (!isEqual(prevReq, nextReq) || prevProps.token.current?.ticker !== this.props.token.current?.ticker) this.setState(nextReq)
    }

    static PropsToState(requirements: Requirement[]): ComplianceManagerViewState {
        return {
            requirements: requirements.map(convertRequirementToFlat),
            modified: false,
            simulationFrom: "",
            simulationTo: "",
            compliance: null,
        }
    }

    onRequirementsChanged = (requirements: RequirementFlat[]) => this.setState({
        requirements: requirements,
        modified: true,
    })
    onFromChanged = (e) => this.setState({ simulationFrom: e.target.value })
    onFromPicked = async () => this.setState({ simulationFrom: await this.props.myDid })
    onToChanged = (e) => this.setState({ simulationTo: e.target.value })
    onToPicked = async () => this.setState({ simulationTo: await this.props.myDid })

    onSaveRequirements = async (): Promise<void> => {
        const updatedToken: SecurityToken = await (await this.props.requirements.original.set(await this.getParams())).run()
        const updatedInfo: TokenInfoJson = await fetchTokenInfoJson(updatedToken)
        this.props.onTokenInfoChanged(updatedInfo)
    }
    getParams = async (): Promise<SetAssetRequirementsParams> => {
        const api: Polymesh = await this.props.apiPromise
        const identityGetter: IdentityGetter = async (did: string) => api.getIdentity({ did: did })
        return {
            requirements: (await Promise
                .all(this.state.requirements
                    .map(convertRequirementFlatToRequirement(identityGetter))))
                .map((requirement: Requirement) => requirement.conditions)
        }
    }

    onSimulateCompliance = async () => this.setState({
        compliance: await this.props.requirements.original.checkSettle(this.getSimulateParams())
    })
    getSimulateParams = () => ({
        from: this.state.simulationFrom === "" ? undefined : this.state.simulationFrom,
        to: this.state.simulationTo,
    })

    onPauseCompliance = async (): Promise<void> => {
        const updatedToken: SecurityToken = await (await this.props.requirements.original.pause()).run()
        const updatedInfo: TokenInfoJson = await fetchTokenInfoJson(updatedToken)
        this.props.onTokenInfoChanged(updatedInfo)
    }
    onResumeCompliance = async (): Promise<void> => {
        const updatedToken: SecurityToken = await (await this.props.requirements.original.unpause()).run()
        const updatedInfo: TokenInfoJson = await fetchTokenInfoJson(updatedToken)
        this.props.onTokenInfoChanged(updatedInfo)
    }

    render() {
        const { requirements, modified, simulationFrom, simulationTo, compliance } = this.state
        const {
            token,
            requirements: reqs,
            myDid,
            apiPromise,
            cardStyle,
            canManipulate,
        } = this.props
        const canSaveAll: boolean = token.current !== null
            && token.details?.owner?.did === myDid
            && modified
        const canSimulate: boolean = token.current !== null
        return <fieldset className={cardStyle}>
            < legend > Compliance Requirements For: {token.current?.ticker}</legend >

            <div>
                <RequirementsView
                    requirements={requirements}
                    apiPromise={apiPromise}
                    onRequirementsChanged={this.onRequirementsChanged}
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
                    onClick={this.onPauseCompliance}
                    disabled={!canManipulate || reqs.arePaused}>
                    Pause compliance
                </button>
                &nbsp;
                <button
                    className="submit resume-compliance"
                    onClick={this.onResumeCompliance}
                    disabled={!canManipulate || !reqs.arePaused}>
                    Resume compliance
                </button>
            </div>

            <div className={cardStyle}>
                <div>Would a transfer of {token.current?.ticker} work</div>
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

        </fieldset >

    }
}
