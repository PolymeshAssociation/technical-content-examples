import { Component } from "react";
import { CheckpointInfoJson, MyInfoPath, OnRequirementChangedCreator } from "../../types";
import { BasicProps } from "../BasicProps";

export type LoadBalanceAtCheckpoint = (checkpoint: CheckpointInfoJson, whoseBalance: string, location: MyInfoPath) => Promise<string>
export interface BasicCheckpointViewProps extends BasicProps {
    onRequirementChangedCreator: OnRequirementChangedCreator
    loadBalanceAtCheckpoint: LoadBalanceAtCheckpoint
}

export interface CheckpointViewProps extends BasicCheckpointViewProps {
    checkpointInfo: CheckpointInfoJson
}

export class CheckpointView extends Component<CheckpointViewProps> {
    render() {
        const {
            checkpointInfo,
            location,
            onRequirementChangedCreator,
            loadBalanceAtCheckpoint
        } = this.props
        return <ul>
            <li key="id">Id:&nbsp;{checkpointInfo.checkpoint.id.toString(10)}</li>
            <li key="ticker">Ticker:&nbsp;{checkpointInfo.checkpoint.ticker}</li>
            <li key="totalSupply">Total supply:&nbsp;{checkpointInfo.totalSupply.toString(10)}</li>
            <li key="createdAt">Created at:&nbsp;{checkpointInfo.createdAt.toISOString()}</li>
            <li key="balanceOf">Balance of:&nbsp;
                <input
                    defaultValue={checkpointInfo.whoseBalance}
                    placeholder="0x123"
                    onChange={onRequirementChangedCreator([...location, "whoseBalance"], false)}
                />
                &nbsp;
                <button
                    className="submit get-balanceOf"
                    onClick={() => loadBalanceAtCheckpoint(checkpointInfo, checkpointInfo.whoseBalance, location)}
                >
                    Fetch
                </button>
                <br />
                Is&nbsp;{`${checkpointInfo.balance.toString(10)} ${checkpointInfo.checkpoint.ticker}`}
            </li>
        </ul>
    }
}

export interface CheckpointsViewProps extends BasicCheckpointViewProps {
    checkpoints: CheckpointInfoJson[]
}

export class CheckpointsView extends Component<CheckpointsViewProps> {
    render() {
        const {
            checkpoints,
            location,
            canManipulate,
            onRequirementChangedCreator,
            loadBalanceAtCheckpoint
        } = this.props
        if (typeof checkpoints === "undefined" || checkpoints === null || checkpoints.length === 0)
            return <div>There are no checkpoints</div>
        return <ul>{
            checkpoints
                .map((checkpoint: CheckpointInfoJson, checkpointIndex: number) => <CheckpointView
                    checkpointInfo={checkpoint}
                    location={[...location, checkpointIndex]}
                    canManipulate={canManipulate}
                    onRequirementChangedCreator={onRequirementChangedCreator}
                    loadBalanceAtCheckpoint={loadBalanceAtCheckpoint}
                />)
                .map((presented: JSX.Element, checkpointIndex: number) => <li key={checkpointIndex}>
                    Checkpoint {checkpointIndex}:&nbsp;{presented}
                </li>)
        }</ul>
    }
}
