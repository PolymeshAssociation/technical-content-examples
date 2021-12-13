import { Checkpoint } from "@polymathnetwork/polymesh-sdk/internal";
import { CalendarUnit, CheckpointSchedule } from "@polymathnetwork/polymesh-sdk/types";
import React, { Component } from "react";
import { Getter, MyInfoJson, OnRequirementChangedDateCreator } from "../../types";
import { presentEnumOptions } from "../EnumView";
import { CheckpointScheduleDetailsView } from "./CheckpointScheduleView";
import { BasicCheckpointViewProps, CheckpointsView } from "./CheckpointView";

export interface CheckpointManagerViewProps extends BasicCheckpointViewProps {
    myInfo: MyInfoJson
    cardStyle: any
    createCheckpoint: Getter<Checkpoint>
    onRequirementChangedDateCreator: OnRequirementChangedDateCreator
    createScheduledCheckpoint: Getter<CheckpointSchedule>
}

export class CheckpointManagerView extends Component<CheckpointManagerViewProps> {
    render() {
        const {
            myInfo,
            cardStyle,
            createCheckpoint,
            onRequirementChangedDateCreator,
            createScheduledCheckpoint,
            onRequirementChangedCreator,
            loadBalanceAtCheckpoint,
        } = this.props
        return <fieldset className={cardStyle}>
            <legend>Checkpoints for: {myInfo.token.current?.ticker}</legend>

            <div className="submit">{
                (() => {
                    const canManipulate: boolean = myInfo.token?.current !== null && myInfo.token?.details?.owner?.did === myInfo.myDid
                    return <div className="submit">
                        <button className="submit create-checkpoint" onClick={createCheckpoint} disabled={!canManipulate}>Create 1 now</button>
                    </div>
                })()
            }</div>

            <div>
                <CheckpointsView
                    checkpoints={myInfo.checkpoints?.details}
                    location={["checkpoints", "details"]}
                    canManipulate={true}
                    onRequirementChangedCreator={onRequirementChangedCreator}
                    loadBalanceAtCheckpoint={loadBalanceAtCheckpoint}
                />
            </div>

            <div className={cardStyle}>{
                (() => {
                    const canManipulate: boolean = myInfo.token?.current !== null && myInfo.token?.details?.owner?.did === myInfo.myDid
                    return <div>
                        Create new:
                        <ul>
                            <li key="start">
                                Start at:&nbsp;
                                <input defaultValue={myInfo.checkpoints.scheduledToAdd.start?.toISOString()} placeholder="2021-12-31T06:00:00Z" disabled={!canManipulate}
                                    onChange={onRequirementChangedDateCreator(["checkpoints", "scheduledToAdd", "start"])} />
                            </li>
                            <li key="periodValue">
                                Period value:&nbsp;
                                <input defaultValue={myInfo.checkpoints.scheduledToAdd.period?.amount?.toString(10)} placeholder="5" disabled={!canManipulate}
                                    onChange={onRequirementChangedCreator(["checkpoints", "scheduledToAdd", "period", "amount"], false, (e) => Promise.resolve(parseInt(e.target.value)))} />
                            </li>
                            <li key="periodUnit">
                                Period unit:&nbsp;
                                <select defaultValue={myInfo.checkpoints.scheduledToAdd.period?.unit} disabled={!canManipulate}
                                    onChange={onRequirementChangedCreator(["checkpoints", "scheduledToAdd", "period", "unit"], false)}>
                                    {presentEnumOptions(CalendarUnit)}
                                </select>
                            </li>
                            <li key="repetitions">
                                Repetitions:&nbsp;
                                <input defaultValue={myInfo.checkpoints.scheduledToAdd.repetitions.toString(10)} placeholder="0" disabled={!canManipulate}
                                    onChange={onRequirementChangedCreator(["checkpoints", "scheduledToAdd", "repetitions"], false, (e) => Promise.resolve(parseInt(e.target.value)))} />
                            </li>
                        </ul>

                        <div className="submit">
                            <div className="submit">
                                <button className="submit create-scheduled-checkpoint" onClick={createScheduledCheckpoint} disabled={!canManipulate}>Create scheduled</button>
                            </div>
                        </div>

                    </div>
                })()
            }</div>

            <div>
                <CheckpointScheduleDetailsView
                    schedules={myInfo.checkpoints.scheduleDetails}
                    location={["checkpoints", "scheduleDetails"]}
                    canManipulate={true}
                    onRequirementChangedCreator={onRequirementChangedCreator}
                    loadBalanceAtCheckpoint={loadBalanceAtCheckpoint}
                />
            </div>

        </fieldset>

    }
}
