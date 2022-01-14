import { Checkpoint, CreateCheckpointScheduleParams } from "@polymathnetwork/polymesh-sdk/internal";
import { CalendarUnit, CheckpointSchedule } from "@polymathnetwork/polymesh-sdk/types";
import { Component } from "react";
import {
    fetchCheckpointInfoJson,
    fetchCheckpointScheduleInfoJson,
    OnCheckpointPicked,
    OnCheckpointsChanged,
    OnCheckpointSchedulesChanged,
} from "../../handlers/checkpoints/CheckpointHandlers";
import {
    CheckpointInfoJson,
    CheckpointScheduleDetailsInfoJson,
    CheckpointScheduleInfoJson,
    CheckpointsInfoJson,
    TokenInfoJson,
} from "../../types";
import { DateTimeEntryView } from "../elements/DateTimeEntry";
import { EnumSelectView } from "../EnumView";
import { CollapsibleFieldsetView } from "../presentation/CollapsibleFieldsetView";
import { CheckpointScheduleDetailsView } from "./CheckpointScheduleView";
import { CheckpointsView } from "./CheckpointView";

interface CheckpointManagerViewState {
    start: Date
    periodValue: number
    periodUnit: CalendarUnit
    repetitions: number
}

export interface CheckpointManagerViewProps {
    myDid: string
    token: TokenInfoJson | null
    checkpoints: CheckpointsInfoJson
    cardStyle: any
    isWrongStyle: any
    onCheckpointPicked: OnCheckpointPicked
    onCheckpointsChanged: OnCheckpointsChanged
    onCheckpointSchedulesChanged: OnCheckpointSchedulesChanged
}

export class CheckpointManagerView extends Component<CheckpointManagerViewProps, CheckpointManagerViewState> {
    constructor(props: CheckpointManagerViewProps) {
        super(props)
        this.state = {
            start: new Date(),
            periodValue: 1,
            periodUnit: CalendarUnit.Month,
            repetitions: 1
        }
    }

    onValidDateChanged = (newStartDate: Date) => this.setState({ start: newStartDate })
    updatePeriodValue = (e: React.ChangeEvent<HTMLInputElement>) => this.setState({ periodValue: parseInt(e.target.value) })
    updatePeriodUnit = async (e: React.ChangeEvent<HTMLSelectElement>) => this.setState({ periodUnit: CalendarUnit[e.target.value] })
    updateRepetitions = (e: React.ChangeEvent<HTMLInputElement>) => this.setState({ repetitions: parseInt(e.target.value) })

    onCreateCheckpointSchedule = async () => this.createCheckpointSchedule()
    createCheckpointSchedule = async (): Promise<CheckpointScheduleInfoJson> => {
        const schedule: CheckpointSchedule = await (await this.props.token.current.checkpoints.schedules.create(this.getCheckpointScheduleParams())).run()
        const info: CheckpointScheduleDetailsInfoJson = await fetchCheckpointScheduleInfoJson(schedule)
        this.props.onCheckpointSchedulesChanged([...this.props.checkpoints.scheduleDetails, info])
        return info
    }
    getCheckpointScheduleParams = (): CreateCheckpointScheduleParams => ({
        start: this.state.start,
        period: {
            unit: this.state.periodUnit,
            amount: this.state.periodValue,
        },
        repetitions: this.state.repetitions,
    })

    onCreateCheckpoint = async () => this.onCreateCheckpoint()
    createCheckpoint = async (): Promise<CheckpointInfoJson> => {
        const created: Checkpoint = await (await this.props.token.current.checkpoints.create()).run()
        const info: CheckpointInfoJson = await fetchCheckpointInfoJson(created)
        this.props.onCheckpointsChanged([...this.props.checkpoints.details, info])
        return info
    }

    render() {
        const { start, periodValue, periodUnit, repetitions } = this.state
        const { myDid, token, checkpoints, cardStyle, isWrongStyle } = this.props
        const canManipulate: boolean = token?.current !== null && token?.details?.owner?.did === myDid
        return <CollapsibleFieldsetView
            className={cardStyle}
            legend={`Checkpoints for: ${token?.current?.ticker}`}
            collapsed={true}>

            <div className="submit">
                <button
                    className="submit create-checkpoint"
                    onClick={this.createCheckpoint}
                    disabled={!canManipulate}>
                    Create 1 checkpoint now
                </button>
            </div>

            <CollapsibleFieldsetView
                className={cardStyle}
                legend="Loaded checkpoints"
                collapsed={false}>

                <CheckpointsView
                    checkpoints={checkpoints.details}
                    pickedCheckpoint={checkpoints.picked}
                    canManipulate={true}
                    onCheckpointPicked={this.props.onCheckpointPicked}
                />
            </CollapsibleFieldsetView>

            <CollapsibleFieldsetView
                className={cardStyle}
                legend="New schedule"
                collapsed={false}>

                <ul>
                    <li key="start">
                        Start at:&nbsp;
                        <DateTimeEntryView
                            dateTime={start}
                            isOptional={false}
                            isWrongStyle={isWrongStyle}
                            onValidDateChanged={this.onValidDateChanged}
                            canManipulate={canManipulate}
                        />
                    </li>
                    <li key="periodValue">
                        Period value:&nbsp;
                        <input
                            defaultValue={periodValue} placeholder="5"
                            disabled={!canManipulate}
                            onChange={this.updatePeriodValue}
                        />
                    </li>
                    <li key="periodUnit">
                        Period unit:&nbsp;
                        <EnumSelectView<CalendarUnit>
                            theEnum={CalendarUnit}
                            defaultValue={periodUnit}
                            onChange={this.updatePeriodUnit}
                            canManipulate={true}
                        />
                    </li>
                    <li key="repetitions">
                        Repetitions:&nbsp;
                        <input
                            defaultValue={repetitions}
                            placeholder="0" disabled={!canManipulate}
                            onChange={this.updateRepetitions}
                        />
                    </li>
                </ul>

                <div className="submit">
                    <div className="submit">
                        <button
                            className="submit create-scheduled-checkpoint"
                            onClick={this.onCreateCheckpointSchedule}
                            disabled={!canManipulate}>
                            Create schedule
                        </button>
                    </div>
                </div>

            </CollapsibleFieldsetView>

            <CollapsibleFieldsetView
                className={cardStyle}
                legend="Loaded checkpoint schedules"
                collapsed={false}>

                <CheckpointScheduleDetailsView
                    schedules={checkpoints.scheduleDetails}
                    pickedCheckpoint={checkpoints.picked}
                    canManipulate={canManipulate}
                    onCheckpointPicked={this.props.onCheckpointPicked}
                />
            </CollapsibleFieldsetView>

        </CollapsibleFieldsetView>

    }
}
