import { BigNumber } from "@polymathnetwork/polymesh-sdk";
import { Component } from "react";
import { CheckpointInfoJson } from "../../types";

export type LoadBalanceAtCheckpoint = (checkpoint: CheckpointInfoJson, whoseBalance: string) => Promise<BigNumber>

const whoseBalanceKey = "whoseBalance"
const balanceKey = "balance"

interface CheckpointViewState {
    [whoseBalanceKey]: string
    [balanceKey]: BigNumber
}

export interface BasicCheckpointViewProps {
    loadBalanceAtCheckpoint: LoadBalanceAtCheckpoint
}

export interface CheckpointViewProps extends BasicCheckpointViewProps {
    checkpointInfo: CheckpointInfoJson
    canManipulate: boolean
}

export class CheckpointView extends Component<CheckpointViewProps, CheckpointViewState> {
    constructor(props: CheckpointViewProps) {
        super(props)
        this.state = {
            [whoseBalanceKey]: "",
            [balanceKey]: new BigNumber("0"),
        }
    }

    updateNewWhoseBalance = (e) => {
        this.setState({
            [whoseBalanceKey]: e.target.value,
        })
    }

    updateBalanceAtCheckpoint = async (e) => {
        this.setState({
            [balanceKey]: await this.props.loadBalanceAtCheckpoint(this.props.checkpointInfo, this.state[whoseBalanceKey])
        })
    }


    render() {
        const { checkpointInfo } = this.props
        return <ul>
            <li key="id">Id:&nbsp;{checkpointInfo.checkpoint.id.toString(10)}</li>
            <li key="ticker">Ticker:&nbsp;{checkpointInfo.checkpoint.ticker}</li>
            <li key="totalSupply">Total supply:&nbsp;{checkpointInfo.totalSupply.toString(10)}</li>
            <li key="createdAt">Created at:&nbsp;{checkpointInfo.createdAt.toISOString()}</li>
            <li key="balanceOf">Balance of:&nbsp;
                <input
                    defaultValue={this.state.whoseBalance}
                    placeholder="0x123"
                    onChange={this.updateNewWhoseBalance}
                />
                &nbsp;
                <button
                    className="submit get-balanceOf"
                    onClick={this.updateBalanceAtCheckpoint}
                >
                    Fetch
                </button>
                <br />
                Is&nbsp;{`${this.state.balance.toString(10)} ${checkpointInfo.checkpoint.ticker}`}
            </li>
        </ul>
    }
}

export interface CheckpointsViewProps extends BasicCheckpointViewProps {
    checkpoints: CheckpointInfoJson[]
    canManipulate: boolean
}

export class CheckpointsView extends Component<CheckpointsViewProps> {
    render() {
        const {
            checkpoints,
            canManipulate,
            loadBalanceAtCheckpoint
        } = this.props
        if (typeof checkpoints === "undefined" || checkpoints === null || checkpoints.length === 0)
            return <div>There are no checkpoints</div>
        return <ul>{
            checkpoints
                .map((checkpoint: CheckpointInfoJson, index: number) => <li key={index}>
                    Checkpoint {index}:&nbsp;<CheckpointView
                        checkpointInfo={checkpoint}
                        canManipulate={canManipulate}
                        loadBalanceAtCheckpoint={loadBalanceAtCheckpoint}
                    />
                </li>)
        }</ul>
    }
}
