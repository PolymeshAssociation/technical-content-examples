import { isEqual } from "lodash"
import { Polymesh } from "@polymathnetwork/polymesh-sdk";
import { SetAssetRequirementsParams } from "@polymathnetwork/polymesh-sdk/api/procedures/setAssetRequirements";
import { Compliance, Identity, Requirement, SecurityToken } from "@polymathnetwork/polymesh-sdk/types";
import { ChangeEvent, Component, KeyboardEvent } from "react";
import { IdentityGetter } from "../../handlers/compliance/ComplianceHandlers";
import {
    convertRequirementFlatToRequirement,
    convertRequirementToFlat,
    RequirementFlat,
} from "../../handlers/compliance/RequirementHandlers";
import { fetchTokenInfoJson, OnTokenInfoChanged } from "../../handlers/token/TokenHandlers";
import { ApiGetter, RequirementsInfoJson, TokenInfoJson } from "../../types";
import { RequirementsView } from "./RequirementView";
import { CollapsibleFieldsetView } from "../presentation/CollapsibleFieldsetView";
import { TransactionQueue } from "@polymathnetwork/polymesh-sdk/internal";
import { showFetchCycle, ShowFetchCycler, showRequestCycle, ShowRequestCycler } from "../../ui-helpers";

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
    apiGetter: ApiGetter
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

    onSaveRequirements = async (): Promise<void> => {
        const cyclerParams: ShowFetchCycler = showFetchCycle("Requirements params")
        const params: SetAssetRequirementsParams = await this.getParams()
        cyclerParams.fetched()
        const cyclerReq: ShowRequestCycler = showRequestCycle("Saving requirements")
        const queue: TransactionQueue<SecurityToken, SecurityToken> = await this.props.requirements.original.set(params)
        cyclerReq.running()
        const updatedToken: SecurityToken = await queue.run()
        cyclerReq.hasRun()
        const cycler: ShowFetchCycler = showFetchCycle("Updated security token")
        const updatedInfo: TokenInfoJson = await fetchTokenInfoJson(updatedToken)
        cycler.fetched()
        this.props.onTokenInfoChanged(updatedInfo)
    }
    getParams = async (): Promise<SetAssetRequirementsParams> => {
        const api: Polymesh = await this.props.apiGetter()
        const identityGetter: IdentityGetter = async (did: string) => api.getIdentity({ did: did })
        return {
            requirements: (await Promise
                .all(this.state.requirements
                    .map(convertRequirementFlatToRequirement(identityGetter))))
                .map((requirement: Requirement) => requirement.conditions)
        }
    }

    onFromChanged = (e: ChangeEvent<HTMLInputElement>) => this.setState({ simulationFrom: e.target.value })
    onFromPickedMe = async () => this.setState({ simulationFrom: this.props.myDid })
    onToChanged = (e: ChangeEvent<HTMLInputElement>) => this.setState({ simulationTo: e.target.value })
    onToPickedMe = async () => this.setState({ simulationTo: this.props.myDid })
    onFromOrToKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" ? this.onSimulateCompliance() : ""
    onSimulateCompliance = async () => {
        const cycler: ShowFetchCycler = showFetchCycle("Checking settle")
        const result = await this.props.requirements.original.checkSettle(this.getSimulateParams())
        cycler.fetched()
        this.setState({
            compliance: result,
        })
    }
    getSimulateParams = () => ({
        from: this.state.simulationFrom === "" ? undefined : this.state.simulationFrom,
        to: this.state.simulationTo,
    })

    onPauseCompliance = async (): Promise<void> => {
        const cyclerReq: ShowRequestCycler = showRequestCycle("Pausing compliance")
        const queue: TransactionQueue<SecurityToken, SecurityToken> = await this.props.requirements.original.pause()
        cyclerReq.running()
        const updatedToken: SecurityToken = await queue.run()
        cyclerReq.hasRun()
        const cycler: ShowFetchCycler = showFetchCycle("Token info")
        const updatedInfo: TokenInfoJson = await fetchTokenInfoJson(updatedToken)
        cycler.fetched()
        this.props.onTokenInfoChanged(updatedInfo)
    }
    onResumeCompliance = async (): Promise<void> => {
        const cyclerReq: ShowRequestCycler = showRequestCycle("Resuming compliance")
        const queue: TransactionQueue<SecurityToken, SecurityToken> = await this.props.requirements.original.unpause()
        cyclerReq.running()
        const updatedToken: SecurityToken = await (queue).run()
        cyclerReq.hasRun()
        const cycler: ShowFetchCycler = showFetchCycle("Token info")
        const updatedInfo: TokenInfoJson = await fetchTokenInfoJson(updatedToken)
        cycler.fetched()
        this.props.onTokenInfoChanged(updatedInfo)
    }

    render() {
        const { requirements, modified, simulationFrom, simulationTo, compliance } = this.state
        const {
            token,
            requirements: reqs,
            myDid,
            apiGetter,
            cardStyle,
            canManipulate,
        } = this.props
        const canSaveAll: boolean = token.current !== null
            && token.details?.owner?.did === myDid
            && modified
        const canSimulate: boolean = token.current !== null
        return <CollapsibleFieldsetView
            className={cardStyle}
            legend={`Compliance Requirements For: ${token.current?.ticker}`}
            collapsed={true}>

            <div>
                <RequirementsView
                    requirements={requirements}
                    apiGetter={apiGetter}
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
                        onChange={this.onFromChanged}
                        onKeyDown={this.onFromOrToKeyDown} />
                    &nbsp;
                    <button
                        className="submit pick-me-for-sender"
                        onClick={this.onFromPickedMe}>
                        Pick mine
                    </button>
                </div>
                <div>To:&nbsp;
                    <input
                        defaultValue={simulationTo}
                        placeholder="0x123"
                        onChange={this.onToChanged}
                        onKeyDown={this.onFromOrToKeyDown} />
                    &nbsp;
                    <button
                        className="submit pick-me-for-recipient"
                        onClick={this.onToPickedMe}>
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

        </CollapsibleFieldsetView >

    }
}
