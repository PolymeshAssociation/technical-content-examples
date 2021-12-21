import { BigNumber } from "@polymathnetwork/polymesh-sdk";
import { Component } from "react";
import { CheckpointLoadBalanceParams } from "../../handlers/checkpoints/CheckpointHandlers";
import { CheckpointInfoJson } from "../../types";

interface CheckpointViewState {
    whoseBalance: string
    balance: BigNumber
}

export interface CheckpointViewProps {
    checkpointInfo: CheckpointInfoJson
    canManipulate: boolean
}

export class CheckpointView extends Component<CheckpointViewProps, CheckpointViewState> {
    constructor(props: CheckpointViewProps) {
        super(props)
        this.state = {
            whoseBalance: "",
            balance: new BigNumber("0"),
        }
    }

    updateNewWhoseBalance = (e) => this.setState({ whoseBalance: e.target.value })
    onGetBalanceOf = async (e) => this.setState({ balance: await this.loadBalance() })
    loadBalance = async (): Promise<BigNumber> => this.props.checkpointInfo.checkpoint.balance(this.getLoadBalanceParams())
    getLoadBalanceParams = (): CheckpointLoadBalanceParams => ({ identity: this.state.whoseBalance })

    render() {
        const { checkpointInfo } = this.props
        return <ul>
            <li key="id">Id:&nbsp;{checkpointInfo.checkpoint.id.toString(10)}</li>
            <li key="ticker">Ticker:&nbsp;{checkpointInfo.checkpoint.ticker}</li>
            <li key="exists">
                Exists:&nbsp;
                <input
                    type="checkbox"
                    defaultChecked={checkpointInfo.exists}
                    disabled={true}
                />
            </li>
            <li key="totalSupply">Total supply:&nbsp;{checkpointInfo.totalSupply.toString(10)}</li>
            <li key="createdAt">Created at:&nbsp;{checkpointInfo.createdAt.toISOString()}</li>
            <li key="balanceOf">Balance of:&nbsp;
                <input
                    defaultValue={this.state.whoseBalance}
                    type="text"
                    placeholder="0x123"
                    onChange={this.updateNewWhoseBalance}
                />
                &nbsp;
                <button
                    className="submit get-balanceOf"
                    onClick={this.onGetBalanceOf}>
                    Fetch
                </button>
                <br />
                Is&nbsp;{`${this.state.balance.toString(10)} ${checkpointInfo.checkpoint.ticker}`}
            </li>
        </ul>
    }
}

export interface CheckpointsViewProps {
    checkpoints: CheckpointInfoJson[]
    canManipulate: boolean
}

export class CheckpointsView extends Component<CheckpointsViewProps> {
    render() {
        const {
            checkpoints,
            canManipulate,
        } = this.props
        if (typeof checkpoints === "undefined" || checkpoints === null || checkpoints.length === 0)
            return <div>There are no checkpoints</div>
        return <ul>{
            checkpoints
                .map((checkpoint: CheckpointInfoJson, index: number) => <li key={index}>
                    Checkpoint {index}:&nbsp;
                    <CheckpointView
                        checkpointInfo={checkpoint}
                        canManipulate={canManipulate}
                    />
                </li>)
        }</ul>
    }
}
