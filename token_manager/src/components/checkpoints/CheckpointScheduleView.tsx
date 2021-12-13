import React, { Component } from "react";
import {
    CheckpointScheduleDetailsInfoJson,
    CheckpointScheduleInfoJson,
    MyInfoPath,
} from "../../types";
import { BasicProps } from "../BasicProps";
import {
    BasicCheckpointViewProps,
    CheckpointsView,
    LoadBalanceAtCheckpoint
} from "./CheckpointView";

export interface CheckpointScheduleViewProps extends BasicCheckpointViewProps, BasicProps {
    scheduleInfo: CheckpointScheduleInfoJson
}

function presentCheckpointScheduleInner(
    scheduleInfo: CheckpointScheduleInfoJson,
    location: MyInfoPath,
    canManipulate: boolean,
    loadBalanceAtCheckpoint: LoadBalanceAtCheckpoint): JSX.Element[] {
    return [
        <li key="exists">Exists:&nbsp;{scheduleInfo.exists ? "true" : "false"}</li>,
        <li key="createdCheckpoints">Created checkpoints:&nbsp;<CheckpointsView
            checkpoints={scheduleInfo.createdCheckpoints}
            location={[...location, "createdCheckpoints"]}
            canManipulate={canManipulate}
            loadBalanceAtCheckpoint={loadBalanceAtCheckpoint}
        />
        </li>,
    ]
}

function presentCheckpointScheduleDetailInner(
    scheduleInfo: CheckpointScheduleDetailsInfoJson,
    location: MyInfoPath,
    canManipulate: boolean,
    loadBalanceAtCheckpoint: LoadBalanceAtCheckpoint): JSX.Element[] {
    return [
        ...presentCheckpointScheduleInner(
            scheduleInfo,
            location,
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
            location,
            canManipulate,
            loadBalanceAtCheckpoint
        } = this.props
        return <ul>{presentCheckpointScheduleInner(
            scheduleInfo,
            location,
            canManipulate,
            loadBalanceAtCheckpoint)
        }</ul>
    }
}

export interface CheckpointScheduleDetailViewProps extends BasicCheckpointViewProps, BasicProps {
    scheduleDetailInfo: CheckpointScheduleDetailsInfoJson
}

export class CheckpointScheduleDetailView extends Component<CheckpointScheduleDetailViewProps> {
    render() {
        const {
            scheduleDetailInfo: scheduleInfo,
            location,
            canManipulate,
            loadBalanceAtCheckpoint
        } = this.props
        return <ul>{presentCheckpointScheduleDetailInner(
            scheduleInfo,
            location,
            canManipulate,
            loadBalanceAtCheckpoint)
        }</ul>
    }
}

export interface CheckpointScheduleDetailsViewProps extends BasicCheckpointViewProps, BasicProps {
    schedules: CheckpointScheduleDetailsInfoJson[]
}

export class CheckpointScheduleDetailsView extends Component<CheckpointScheduleDetailsViewProps> {
    render() {
        const {
            schedules,
            location,
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
                        location={[...location, index]}
                        canManipulate={canManipulate}
                        loadBalanceAtCheckpoint={loadBalanceAtCheckpoint}
                    /></li>)
        }</ul>
    }
}