import React, { Component } from "react";
import { ConditionFlat } from "../../handlers/compliance/ConditionHandlers";
import {
    getDummyRequirementFlat,
    OnRequirementChanged,
    OnRequirementsChanged,
    RequirementFlat,
} from "../../handlers/compliance/RequirementHandlers";
import { ApiGetter } from "../../types";
import { ConditionsView } from "./ConditionView";

export interface RequirementViewProps {
    requirement: RequirementFlat
    canManipulate: boolean
    apiGetter: ApiGetter
    onRequirementChanged: OnRequirementChanged
}

export class RequirementView extends Component<RequirementViewProps> {

    onConditionsChange = (conditions: ConditionFlat[]) => this.props.onRequirementChanged({
        ...this.props.requirement,
        conditions: conditions,
    })

    render() {
        const {
            requirement: {
                id,
                conditions,
            },
            apiGetter,
            canManipulate,
        } = this.props
        return <ul>
            <li key="id">Id: {id}</li>
            <li key="conditions">
                Conditions:&nbsp;
                <ConditionsView
                    conditions={conditions}
                    apiGetter={apiGetter}
                    onConditionsChanged={this.onConditionsChange}
                    canManipulate={canManipulate}
                />
            </li>
        </ul>
    }
}

export interface RequirementsViewProps {
    requirements: RequirementFlat[]
    canManipulate: boolean
    apiGetter: ApiGetter
    onRequirementsChanged: OnRequirementsChanged
}

export class RequirementsView extends Component<RequirementsViewProps> {

    addRequirement = () => this.props.onRequirementsChanged([
        getDummyRequirementFlat(),
        ...this.props.requirements,
    ])
    onRequirementChangedAt = (index: number) => (requirement: RequirementFlat) => {
        const requirements: RequirementFlat[] = this.props.requirements
        requirements[index] = requirement
        this.props.onRequirementsChanged(requirements)
    }
    removeRequirementAt = (index: number) => () => {
        const requirements: RequirementFlat[] = this.props.requirements
        requirements.splice(index, 1)
        this.props.onRequirementsChanged(requirements)
    }

    render() {
        const { requirements, apiGetter, canManipulate } = this.props
        const addButton: JSX.Element = <button
            className="submit add-requirement"
            onClick={this.addRequirement}
            disabled={!canManipulate}>
            Add 1 Requirement
        </button>
        if (typeof requirements === "undefined" || requirements === null || requirements.length === 0)
            return <div>
                No requirements&nbsp;{addButton}
            </div>
        return <div>
            {addButton}
            <ul>{
                requirements.map((requirement: RequirementFlat, index: number) => <li key={index}>
                    Requirement {index}:&nbsp;
                    <button
                        className="submit remove-requirement"
                        onClick={this.removeRequirementAt(index)}
                        disabled={!canManipulate}>
                        Remove {index}
                    </button>
                    <RequirementView
                        requirement={requirement}
                        apiGetter={apiGetter}
                        onRequirementChanged={this.onRequirementChangedAt(index)}
                        canManipulate={canManipulate}
                    />
                </li>)
            }</ul>
        </div>
    }
}