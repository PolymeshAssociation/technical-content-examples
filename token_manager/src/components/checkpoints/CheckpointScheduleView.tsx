import { Component } from "react";
import {
    CheckpointScheduleDetailsInfoJson,
    CheckpointScheduleInfoJson,
} from "../../types";
import {
    BasicCheckpointViewProps,
    CheckpointsView,
    LoadBalanceAtCheckpoint
} from "./CheckpointView";

export interface CheckpointScheduleViewProps extends BasicCheckpointViewProps {
    scheduleInfo: CheckpointScheduleInfoJson
    canManipulate: boolean
}

function presentCheckpointScheduleInner(
    scheduleInfo: CheckpointScheduleInfoJson,
    canManipulate: boolean,
    loadBalanceAtCheckpoint: LoadBalanceAtCheckpoint): JSX.Element[] {
    return [
        <li key="exists">Exists:&nbsp;{scheduleInfo.exists ? "true" : "false"}</li>,
        <li key="createdCheckpoints">Created checkpoints:&nbsp;<CheckpointsView
            checkpoints={scheduleInfo.createdCheckpoints}
            canManipulate={canManipulate}
            loadBalanceAtCheckpoint={loadBalanceAtCheckpoint}
        />
        </li>,
    ]
}

function presentCheckpointScheduleDetailInner(
    scheduleInfo: CheckpointScheduleDetailsInfoJson,
    canManipulate: boolean,
    loadBalanceAtCheckpoint: LoadBalanceAtCheckpoint): JSX.Element[] {
    return [
        ...presentCheckpointScheduleInner(
            scheduleInfo,
            canManipulate,
            loadBalanceAtCheckpoint),
        <li key="remainingCheckpoints">
            Remaining checkpoints:&nbsp;{scheduleInfo.remainingCheckpoints.toString(10)}
        </li>,
        <li key="nextCheckpointDate">
            Next checkpoint date:&nbsp;{scheduleInfo.nextCheckpointDate.toISOString()}
        </li>,
    ]
}

export class CheckpointScheduleView extends Component<CheckpointScheduleViewProps> {
    render() {
        const {
            scheduleInfo,
            canManipulate,
            loadBalanceAtCheckpoint
        } = this.props
        return <ul>{presentCheckpointScheduleInner(
            scheduleInfo,
            canManipulate,
            loadBalanceAtCheckpoint)
        }</ul>
    }
}

export interface CheckpointScheduleDetailViewProps extends BasicCheckpointViewProps {
    scheduleDetailInfo: CheckpointScheduleDetailsInfoJson
    canManipulate: boolean
}

export class CheckpointScheduleDetailView extends Component<CheckpointScheduleDetailViewProps> {
    render() {
        const {
            scheduleDetailInfo: scheduleInfo,
            canManipulate,
            loadBalanceAtCheckpoint
        } = this.props
        return <ul>{presentCheckpointScheduleDetailInner(
            scheduleInfo,
            canManipulate,
            loadBalanceAtCheckpoint)
        }</ul>
    }
}

export interface CheckpointScheduleDetailsViewProps extends BasicCheckpointViewProps {
    schedules: CheckpointScheduleDetailsInfoJson[]
    canManipulate: boolean
}

export class CheckpointScheduleDetailsView extends Component<CheckpointScheduleDetailsViewProps> {
    render() {
        const {
            schedules,
            canManipulate,
            loadBalanceAtCheckpoint
        } = this.props
        if (typeof schedules === "undefined" || schedules === null || schedules.length === 0)
            return <div>There are no checkpoint schedules</div>
        return <ul>{
            schedules
                .map((schedule: CheckpointScheduleDetailsInfoJson, index: number) => <li key={index}>
                    Checkpoint schedule&nbsp;<CheckpointScheduleDetailView
                        scheduleDetailInfo={schedule}
                        canManipulate={canManipulate}
                        loadBalanceAtCheckpoint={loadBalanceAtCheckpoint}
                    /></li>)
        }</ul>
    }
}