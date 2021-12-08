import React, { Component } from "react";
import {
    CheckpointScheduleDetailsInfoJson,
    CheckpointScheduleInfoJson,
    MyInfoPath,
    OnRequirementChangedCreator
} from "../../types";
import { BasicProps } from "../BasicProps";
import { BasicCheckpointViewProps, CheckpointsView } from "./CheckpointView";
import { LoadBalanceAtCheckpoint } from "./types";

export interface CheckpointScheduleViewProps extends BasicCheckpointViewProps, BasicProps {
    scheduleInfo: CheckpointScheduleInfoJson
}

function presentCheckpointScheduleInner(
    scheduleInfo: CheckpointScheduleInfoJson,
    location: MyInfoPath,
    canManipulate: boolean,
    onRequirementChangedCreator: OnRequirementChangedCreator,
    loadBalanceAtCheckpoint: LoadBalanceAtCheckpoint): JSX.Element[] {
    return [
        <li key="exists">Exists:&nbsp;{scheduleInfo.exists ? "true" : "false"}</li>,
        <li key="createdCheckpoints">Created checkpoints:&nbsp;<CheckpointsView
            checkpoints={scheduleInfo.createdCheckpoints}
            location={[...location, "createdCheckpoints"]}
            canManipulate={canManipulate}
            onRequirementChangedCreator={onRequirementChangedCreator}
            loadBalanceAtCheckpoint={loadBalanceAtCheckpoint}
        />
        </li>,
    ]
}

function presentCheckpointScheduleDetailInner(
    scheduleInfo: CheckpointScheduleDetailsInfoJson,
    location: MyInfoPath,
    canManipulate: boolean,
    onRequirementChangedCreator: OnRequirementChangedCreator,
    loadBalanceAtCheckpoint: LoadBalanceAtCheckpoint): JSX.Element[] {
    return [
        ...presentCheckpointScheduleInner(
            scheduleInfo,
            location,
            canManipulate,
            onRequirementChangedCreator,
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
            onRequirementChangedCreator,
            loadBalanceAtCheckpoint
        } = this.props
        return <ul>{presentCheckpointScheduleInner(
            scheduleInfo,
            location,
            canManipulate,
            onRequirementChangedCreator,
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
            onRequirementChangedCreator,
            loadBalanceAtCheckpoint
        } = this.props
        return <ul>{presentCheckpointScheduleDetailInner(
            scheduleInfo,
            location,
            canManipulate,
            onRequirementChangedCreator,
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
            onRequirementChangedCreator,
            loadBalanceAtCheckpoint
        } = this.props
        if (typeof schedules === "undefined" || schedules === null || schedules.length === 0)
            return <div>There are no checkpoint schedules</div>
        return <ul>{
            schedules
                .map((schedule: CheckpointScheduleDetailsInfoJson, scheduleIndex: number) => <CheckpointScheduleDetailView
                    scheduleDetailInfo={schedule}
                    location={[...location, scheduleIndex]}
                    canManipulate={canManipulate}
                    onRequirementChangedCreator={onRequirementChangedCreator}
                    loadBalanceAtCheckpoint={loadBalanceAtCheckpoint}
                />)
                .map((presented: JSX.Element, scheduleIndex: number) => <li key={scheduleIndex}>
                    Checkpoint schedule&nbsp;{scheduleIndex}:&nbsp;{presented}
                </li>)
        }</ul>
    }
}