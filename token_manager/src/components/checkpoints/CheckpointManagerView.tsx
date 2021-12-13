import { Checkpoint, CreateCheckpointScheduleParams } from "@polymathnetwork/polymesh-sdk/internal";
import { CalendarUnit, CheckpointSchedule } from "@polymathnetwork/polymesh-sdk/types";
import React, { Component } from "react";
import { Getter, MyInfoJson } from "../../types";
import { EnumSelectView } from "../EnumView";
import { CheckpointScheduleDetailsView } from "./CheckpointScheduleView";
import { BasicCheckpointViewProps, CheckpointsView } from "./CheckpointView";

export type CreateCheckpointSchedule = (params: CreateCheckpointScheduleParams) => Promise<CheckpointSchedule>

const startKey = "start"
const periodValueKey = "periodValue"
const periodUnitKey = "periodUnit"
const repetitionsKey = "repetitions"

interface CheckpointManagerViewState {
    [startKey]: Date
    [periodValueKey]: number
    [periodUnitKey]: CalendarUnit
    [repetitionsKey]: number
}

export interface CheckpointManagerViewProps extends BasicCheckpointViewProps {
    myInfo: MyInfoJson
    cardStyle: any
    createCheckpoint: Getter<Checkpoint>
    createScheduledCheckpoint: CreateCheckpointSchedule
}

export class CheckpointManagerView extends Component<CheckpointManagerViewProps, CheckpointManagerViewState> {
    constructor(props: CheckpointManagerViewProps) {
        super(props)
        this.setState({
            [startKey]: new Date(),
            [periodValueKey]: 1,
            [periodUnitKey]: CalendarUnit.Month,
            [repetitionsKey]: 1
        })
    }

    updateStart = (e) => this.setState({ [startKey]: new Date(e.target.value) })
    updatePeriodValue = (e) => this.setState({ [periodValueKey]: parseInt(e.target.value) })
    updatePeriodUnit = async (e) => this.setState({ [periodUnitKey]: e.target.value })
    updateRepetitions = (e) => this.setState({ [repetitionsKey]: parseInt(e.target.value) })

    getScheduleParams = () => ({
        start: this.state.start,
        period: {
            unit: this.state.periodUnit,
            amount: this.state.periodValue,
        },
        repetitions: this.state.repetitions,
    })

    render() {
        const {
            myInfo,
            cardStyle,
            createCheckpoint,
            createScheduledCheckpoint,
            loadBalanceAtCheckpoint,
        } = this.props
        const canManipulate: boolean = myInfo.token?.current !== null && myInfo.token?.details?.owner?.did === myInfo.myDid
        return <fieldset className={cardStyle}>
            <legend>Checkpoints for: {myInfo.token.current?.ticker}</legend>

            <div className="submit">
                <button
                    className="submit create-checkpoint"
                    onClick={createCheckpoint}
                    disabled={!canManipulate}>
                    Create 1 now
                </button>
            </div>

            <div>
                <CheckpointsView
                    checkpoints={myInfo.checkpoints?.details}
                    location={["checkpoints", "details"]}
                    canManipulate={true}
                    loadBalanceAtCheckpoint={loadBalanceAtCheckpoint}
                />
            </div>

            <div className={cardStyle}>
                Create new:
                <ul>
                    <li key="start">
                        Start at:&nbsp;
                        <input
                            defaultValue={this.state.start.toISOString()}
                            placeholder="2021-12-31T06:00:00Z"
                            disabled={!canManipulate}
                            onChange={this.updateStart}
                        />
                    </li>
                    <li key="periodValue">
                        Period value:&nbsp;
                        <input
                            defaultValue={this.state.periodValue} placeholder="5"
                            disabled={!canManipulate}
                            onChange={this.updatePeriodValue}
                        />
                    </li>
                    <li key="periodUnit">
                        Period unit:&nbsp;
                        <EnumSelectView<CalendarUnit>
                            theEnum={CalendarUnit}
                            defaultValue={this.state.periodUnit}
                            onChange={this.updatePeriodUnit}
                            location={[]}
                            canManipulate={true}
                        />
                    </li>
                    <li key="repetitions">
                        Repetitions:&nbsp;
                        <input
                            defaultValue={this.state.repetitions}
                            placeholder="0" disabled={!canManipulate}
                            onChange={this.updateRepetitions}
                        />
                    </li>
                </ul>

                <div className="submit">
                    <div className="submit">
                        <button
                            className="submit create-scheduled-checkpoint"
                            onClick={() => createScheduledCheckpoint(this.getScheduleParams())}
                            disabled={!canManipulate}>
                            Create scheduled
                        </button>
                    </div>
                </div>

            </div>

            <div>
                <CheckpointScheduleDetailsView
                    schedules={myInfo.checkpoints.scheduleDetails}
                    location={["checkpoints", "scheduleDetails"]}
                    canManipulate={canManipulate}
                    loadBalanceAtCheckpoint={loadBalanceAtCheckpoint}
                />
            </div>

        </fieldset>

    }
}
