import React, { Component } from "react";
import { CheckpointInfoJson, CheckpointScheduleDetailsInfoJson, CheckpointScheduleInfoJson, MyInfoPath } from "../../types";
import { BasicCheckpointViewProps, CheckpointsView } from "./CheckpointView";

export interface CheckpointScheduleViewProps extends BasicCheckpointViewProps {
    scheduleInfo: CheckpointScheduleInfoJson
}

function presentCheckpointScheduleInner(
    scheduleInfo: CheckpointScheduleInfoJson,
    location: MyInfoPath,
    canManipulate: boolean,
    onRequirementChangedCreator: (path: MyInfoPath, deep: boolean, valueProcessor?: (e) => Promise<any>) => (e) => Promise<void>,
    loadBalanceAtCheckpoint: (checkpoint: CheckpointInfoJson, whoseBalance: string, location: MyInfoPath) => Promise<string>): JSX.Element[] {
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
    onRequirementChangedCreator: (path: MyInfoPath, deep: boolean, valueProcessor?: (e) => Promise<any>) => (e) => Promise<void>,
    loadBalanceAtCheckpoint: (checkpoint: CheckpointInfoJson, whoseBalance: string, location: MyInfoPath) => Promise<string>): JSX.Element[] {
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

export interface CheckpointScheduleDetailViewProps extends BasicCheckpointViewProps {
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

export interface CheckpointScheduleDetailsViewProps extends BasicCheckpointViewProps {
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
        if (typeof schedules === "undefined" || schedules === null || schedules.length === 0) return <div>There are no checkpoint schedules</div>
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