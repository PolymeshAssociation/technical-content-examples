import { Polymesh } from "@polymathnetwork/polymesh-sdk";
import { Identity } from "@polymathnetwork/polymesh-sdk/types";
import React, { Component } from "react";
import { ConditionFlat } from "../../handlers/compliance/ConditionHandlers";
import {
    getDummyRequirementFlat,
    OnRequirementChanged,
    OnRequirementsChanged,
    RequirementFlat,
} from "../../handlers/compliance/RequirementHandlers";
import { FetchAndAddToPath, MyInfoJson, } from "../../types";
import { BasicProps } from "../BasicProps";
import { ConditionsView } from "./ConditionView";

export interface RequirementViewProps extends BasicProps {
    requirement: RequirementFlat
    myInfo: MyInfoJson
    apiPromise: Promise<Polymesh>
    onRequirementChanged: OnRequirementChanged
    fetchCddId: FetchAndAddToPath<string | Identity>
}

export class RequirementView extends Component<RequirementViewProps> {

    onConditionsChange = (conditions: ConditionFlat[]) => this.props.onRequirementChanged({
        ...this.props.requirement,
        conditions: conditions,
    })

    render() {
        const { requirement, myInfo, apiPromise, fetchCddId, location, canManipulate } = this.props
        const { id, conditions } = requirement
        return <ul>
            <li key="id">Id: {id}</li>
            <li key="conditions">
                Conditions:&nbsp;
                <ConditionsView
                    conditions={conditions}
                    myInfo={myInfo}
                    apiPromise={apiPromise}
                    onConditionsChanged={this.onConditionsChange}
                    fetchCddId={fetchCddId}
                    location={[...location, "conditions"]}
                    canManipulate={canManipulate}
                />
            </li>
        </ul>
    }
}

export interface RequirementsViewProps extends BasicProps {
    requirements: RequirementFlat[]
    myInfo: MyInfoJson
    apiPromise: Promise<Polymesh>
    onRequirementsChanged: OnRequirementsChanged
    fetchCddId: FetchAndAddToPath<string | Identity>
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
        const { requirements, myInfo, apiPromise, fetchCddId, location, canManipulate } = this.props
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
                        myInfo={myInfo}
                        apiPromise={apiPromise}
                        onRequirementChanged={this.onRequirementChangedAt(index)}
                        fetchCddId={fetchCddId}
                        location={[...location, index]}
                        canManipulate={canManipulate}
                    />
                </li>)
            }</ul>
        </div>
    }
}
