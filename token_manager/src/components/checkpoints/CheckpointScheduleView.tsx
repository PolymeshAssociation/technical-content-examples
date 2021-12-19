import { Component } from "react";
import { CheckpointScheduleDetailsInfoJson, CheckpointScheduleInfoJson } from "../../types";
import { CheckpointsView } from "./CheckpointView";

export interface CheckpointScheduleViewProps {
    scheduleInfo: CheckpointScheduleInfoJson
    canManipulate: boolean
}

function presentCheckpointScheduleInner(
    scheduleInfo: CheckpointScheduleInfoJson,
    canManipulate: boolean): JSX.Element[] {
    return [
        <li key="exists">
            Exists:&nbsp;
            <input
                type="checkbox"
                checked={scheduleInfo.exists}
                disabled={true}
            />
        </li>,
        <li key="createdCheckpoints">
            Created checkpoints:&nbsp;
            <CheckpointsView
                checkpoints={scheduleInfo.createdCheckpoints}
                canManipulate={canManipulate}
            />
        </li>,
    ]
}

function presentCheckpointScheduleDetailInner(
    scheduleInfo: CheckpointScheduleDetailsInfoJson,
    canManipulate: boolean): JSX.Element[] {
    return [
        ...presentCheckpointScheduleInner(
            scheduleInfo,
            canManipulate),
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
        } = this.props
        return <ul>{presentCheckpointScheduleInner(
            scheduleInfo,
            canManipulate)
        }</ul>
    }
}

export interface CheckpointScheduleDetailViewProps {
    scheduleDetailInfo: CheckpointScheduleDetailsInfoJson
    canManipulate: boolean
}

export class CheckpointScheduleDetailView extends Component<CheckpointScheduleDetailViewProps> {
    render() {
        const {
            scheduleDetailInfo: scheduleInfo,
            canManipulate,
        } = this.props
        return <ul>{presentCheckpointScheduleDetailInner(
            scheduleInfo,
            canManipulate)
        }</ul>
    }
}

export interface CheckpointScheduleDetailsViewProps {
    schedules: CheckpointScheduleDetailsInfoJson[]
    canManipulate: boolean
}

export class CheckpointScheduleDetailsView extends Component<CheckpointScheduleDetailsViewProps> {
    render() {
        const {
            schedules,
            canManipulate,
        } = this.props
        if (typeof schedules === "undefined" || schedules === null || schedules.length === 0)
            return <div>There are no checkpoint schedules</div>
        return <ul>{
            schedules
                .map((schedule: CheckpointScheduleDetailsInfoJson, index: number) => <li key={index}>
                    Checkpoint schedule&nbsp;
                    <CheckpointScheduleDetailView
                        scheduleDetailInfo={schedule}
                        canManipulate={canManipulate}
                    />
                </li>)
        }</ul>
    }
}