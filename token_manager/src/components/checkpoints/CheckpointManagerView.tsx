import { Checkpoint, CreateCheckpointScheduleParams } from "@polymathnetwork/polymesh-sdk/internal";
import { CalendarUnit, CheckpointSchedule } from "@polymathnetwork/polymesh-sdk/types";
import { Component } from "react";
import {
    fetchCheckpointInfoJson,
    fetchCheckpointScheduleInfoJson,
    OnCheckpointsChanged,
    OnCheckpointSchedulesChanged,
} from "../../handlers/checkpoints/CheckpointHandlers";
import {
    CheckpointInfoJson,
    CheckpointScheduleDetailsInfoJson,
    CheckpointScheduleInfoJson,
    CheckpointsInfoJson,
    MyInfoJson,
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
    myInfo: MyInfoJson
    token: TokenInfoJson
    checkpoints: CheckpointsInfoJson
    cardStyle: any
    isWrongStyle: any
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
    updatePeriodValue = (e) => this.setState({ periodValue: parseInt(e.target.value) })
    updatePeriodUnit = async (e) => this.setState({ periodUnit: e.target.value })
    updateRepetitions = (e) => this.setState({ repetitions: parseInt(e.target.value) })

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
        const created: Checkpoint = await (await this.props.myInfo.token.current.checkpoints.create()).run()
        const info: CheckpointInfoJson = await fetchCheckpointInfoJson(created)
        this.props.onCheckpointsChanged([...this.props.checkpoints.details, info])
        return info
    }

    render() {
        const { start } = this.state
        const { myInfo, cardStyle, isWrongStyle } = this.props
        const canManipulate: boolean = myInfo.token?.current !== null && myInfo.token?.details?.owner?.did === myInfo.myDid
        return <CollapsibleFieldsetView
            className={cardStyle}
            legend={`Checkpoints for: ${myInfo.token.current?.ticker}`}
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
                    checkpoints={myInfo.checkpoints?.details}
                    canManipulate={true}
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
                            validDateChanged={this.onValidDateChanged}
                            canManipulate={canManipulate}
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
                    schedules={myInfo.checkpoints.scheduleDetails}
                    canManipulate={canManipulate}
                />
            </CollapsibleFieldsetView>

        </CollapsibleFieldsetView>

    }
}
