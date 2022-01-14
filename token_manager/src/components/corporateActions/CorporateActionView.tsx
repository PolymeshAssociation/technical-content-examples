import { CorporateAction } from "@polymathnetwork/polymesh-sdk/types"
import { Component } from "react"
import { OnCheckpointPicked } from "../../handlers/checkpoints/CheckpointHandlers"
import { CheckpointInfoJson, CorporateActionInfoJson } from "../../types"
import { CheckpointScheduleView } from "../checkpoints/CheckpointScheduleView"
import { CheckpointView } from "../checkpoints/CheckpointView"

export interface CorporateActionViewProps {
    action: CorporateAction
}

export const getCorporateActionViewInner = (props: CorporateActionViewProps): JSX.Element[] => {
    const {
        action: {
            id,
            ticker,
            declarationDate,
            description,
        },
    } = props
    return [
        <li key="id">Id:&nbsp;{id.toString(10)}</li>,
        <li key="ticker">Ticker:&nbsp;{ticker}</li>,
        <li key="declarationDate">Declaration date:&nbsp;{declarationDate.toISOString()}</li>,
        <li key="description">Description:&nbsp;{description}</li>,
    ]
}

export class CorporateActionView extends Component<CorporateActionViewProps> {
    render() {
        return <ul>
            {getCorporateActionViewInner(this.props)}
        </ul>
    }
}

export interface CorporateActionInfoJsonViewProps {
    action: CorporateActionInfoJson
    pickedCheckpoint: CheckpointInfoJson | null
    canManipulate: boolean
    onCheckpointPicked: OnCheckpointPicked
}

export const getCorporateActionInfoJsonViewInner = (props: CorporateActionInfoJsonViewProps): JSX.Element[] => {
    const {
        action: {
            current,
            checkpoint,
            checkpointSchedule,
        },
        pickedCheckpoint,
        canManipulate,
        onCheckpointPicked,
    } = props
    const elements: JSX.Element[] = getCorporateActionViewInner({ action: current })
    if (checkpoint === null) elements.push(<li key="checkpoint">No checkpoints</li>)
    else elements.push(<li key="checkpoint">
        Checkpoint:&nbsp;
        <CheckpointView
            checkpointInfo={checkpoint}
            canManipulate={canManipulate}
        />
    </li>)
    if (checkpointSchedule === null) elements.push(<li key="checkpointSchedule">No checkpoint schedules</li>)
    else elements.push(<li key="checkpointSchedule">
        Checkpoint schedule:&nbsp;
        <CheckpointScheduleView
            scheduleInfo={checkpointSchedule}
            pickedCheckpoint={pickedCheckpoint}
            canManipulate={canManipulate}
            onCheckpointPicked={onCheckpointPicked}
        />
    </li>)
    return elements
}

export class CorporateActionInfoJsonView extends Component<CorporateActionInfoJsonViewProps> {
    render() {
        return <ul>
            {getCorporateActionInfoJsonViewInner(this.props)}
        </ul>
    }
}

export interface CorporateActionInfoJsonsViewProps {
    actions: CorporateActionInfoJson[]
    pickedCheckpoint: CheckpointInfoJson | null
    canManipulate: boolean
    onCheckpointPicked: OnCheckpointPicked
}

export class CorporateActionInfoJsonsView extends Component<CorporateActionInfoJsonsViewProps> {
    render() {
        const {
            actions,
            pickedCheckpoint,
            canManipulate,
            onCheckpointPicked,
        } = this.props
        if (typeof actions === "undefined" || actions === null || actions.length === 0) return <div>There are no corporate actions</div>
        return <ul>{
            actions.map((action: CorporateActionInfoJson, index: number) => <li key={index}>
                Corporate action {index}:&nbsp;
                <CorporateActionInfoJsonView
                    action={action}
                    pickedCheckpoint={pickedCheckpoint}
                    canManipulate={canManipulate}
                    onCheckpointPicked={onCheckpointPicked}
                />
            </li>)
        }</ul>
    }
}