import { Component } from "react";
import { OnCheckpointPicked } from "../../handlers/checkpoints/CheckpointHandlers";
import {
    CheckpointInfoJson,
    CheckpointScheduleDetailsInfoJson,
    CheckpointScheduleInfoJson,
} from "../../types";
import { CheckpointsView } from "./CheckpointView";

export interface CheckpointScheduleViewProps {
    scheduleInfo: CheckpointScheduleInfoJson
    pickedCheckpoint: CheckpointInfoJson | null
    canManipulate: boolean
    onCheckpointPicked: OnCheckpointPicked
}

export interface CheckpointScheduleDetailViewProps extends Omit<CheckpointScheduleViewProps, "scheduleInfo"> {
    scheduleDetailInfo: CheckpointScheduleDetailsInfoJson
}

function presentCheckpointScheduleInner(props: CheckpointScheduleViewProps): JSX.Element[] {
    const {
        scheduleInfo,
        pickedCheckpoint,
        canManipulate,
        onCheckpointPicked,
    } = props
    return [
        <li key="exists">
            Exists:&nbsp;
            <input
                type="checkbox"
                defaultChecked={scheduleInfo.exists}
                disabled={true}
            />
        </li>,
        <li key="createdCheckpoints">
            Created checkpoints:&nbsp;
            <CheckpointsView
                checkpoints={scheduleInfo.createdCheckpoints}
                canManipulate={canManipulate}
                pickedCheckpoint={pickedCheckpoint}
                onCheckpointPicked={onCheckpointPicked}
            />
        </li>,
    ]
}

function presentCheckpointScheduleDetailInner(props: CheckpointScheduleDetailViewProps): JSX.Element[] {
    const { scheduleDetailInfo } = props
    return [
        ...presentCheckpointScheduleInner({
            ...props,
            scheduleInfo: scheduleDetailInfo
        }),
        <li key="remainingCheckpoints">
            Remaining checkpoints:&nbsp;{scheduleDetailInfo.remainingCheckpoints.toString(10)}
        </li>,
        <li key="nextCheckpointDate">
            Next checkpoint date:&nbsp;{scheduleDetailInfo.nextCheckpointDate.toISOString()}
        </li>,
    ]
}

export class CheckpointScheduleView extends Component<CheckpointScheduleViewProps> {
    render() {
        return <ul>
            {presentCheckpointScheduleInner(this.props)}
        </ul>
    }
}

export class CheckpointScheduleDetailView extends Component<CheckpointScheduleDetailViewProps> {
    render() {
        return <ul>
            {presentCheckpointScheduleDetailInner(this.props)}
        </ul>
    }
}

export interface CheckpointScheduleDetailsViewProps {
    schedules: CheckpointScheduleDetailsInfoJson[]
    pickedCheckpoint: CheckpointInfoJson | null
    canManipulate: boolean
    onCheckpointPicked: OnCheckpointPicked
}

export class CheckpointScheduleDetailsView extends Component<CheckpointScheduleDetailsViewProps> {
    render() {
        const {
            schedules,
            pickedCheckpoint,
            canManipulate,
            onCheckpointPicked,
        } = this.props
        if (typeof schedules === "undefined" || schedules === null || schedules.length === 0)
            return <div>There are no checkpoint schedules</div>
        return <ul>{
            schedules
                .map((schedule: CheckpointScheduleDetailsInfoJson, index: number) => <li key={index}>
                    Checkpoint schedule&nbsp;
                    <CheckpointScheduleDetailView
                        scheduleDetailInfo={schedule}
                        pickedCheckpoint={pickedCheckpoint}
                        canManipulate={canManipulate}
                        onCheckpointPicked={onCheckpointPicked}
                    />
                </li>)
        }</ul>
    }
}