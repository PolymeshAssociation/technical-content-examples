import { Identity, Requirement, } from "@polymathnetwork/polymesh-sdk/types";
import React, { Component } from "react";
import { FetchAndAddToPath, MyInfoJson, } from "../../types";
import { BasicProps } from "../BasicProps";
import { IdentityGetter } from "./ComplianceView";
import { ConditionsView, ConditionsViewState } from "./ConditionView";

export type OnRequirementChanged = (requirement: RequirementViewState) => void

export interface RequirementViewState {
    id: number
    conditions: ConditionsViewState,
}

export interface RequirementViewProps extends BasicProps {
    requirement: RequirementViewState
    myInfo: MyInfoJson
    onRequirementChanged: OnRequirementChanged
    fetchCddId: FetchAndAddToPath<string | Identity>
}

export class RequirementView extends Component<RequirementViewProps, RequirementViewState> {
    constructor(props: RequirementViewProps) {
        super(props)
        this.state = props.requirement
    }

    static DummyRequirementViewState = (): RequirementViewState => ({
        id: Math.round(Math.random() * 1000),
        conditions: ConditionsView.DummyConditionsViewState(),
    })
    static RequirementToState = (requirement: Requirement) => ({
        id: requirement.id,
        conditions: ConditionsView.ConditionsToState(requirement.conditions),
    }) as RequirementViewState
    static StateToRequirement = (getter: IdentityGetter) =>
        async (state: RequirementViewState, id: number): Promise<Requirement> =>
        ({
            id: state.id > 0 ? state.id : id,
            conditions: await ConditionsView.StateToConditions(getter)(state.conditions),
        })

    onConditionsChange = (conditions: ConditionsViewState) => this.setState((prev: RequirementViewState) => {
        const updated: RequirementViewState = {
            ...prev,
            conditions: conditions,
        }
        this.props.onRequirementChanged(updated)
        return updated
    })

    render() {
        const { id, conditions } = this.state
        const { myInfo, fetchCddId, location, canManipulate } = this.props
        return <ul>
            <li key="id">Id: {id}</li>
            <li key="conditions">
                Conditions:&nbsp;
                <ConditionsView
                    conditions={conditions}
                    myInfo={myInfo}
                    onConditionsChanged={this.onConditionsChange}
                    fetchCddId={fetchCddId}
                    location={[...location, "conditions"]}
                    canManipulate={canManipulate}
                />
            </li>
        </ul>
    }
}

export type OnRequirementsChanged = (requirements: RequirementsViewState) => void

export interface RequirementsViewState {
    requirements: RequirementViewState[],
}

export interface RequirementsViewProps extends BasicProps {
    requirements: RequirementsViewState
    myInfo: MyInfoJson
    onRequirementsChanged: OnRequirementsChanged
    fetchCddId: FetchAndAddToPath<string | Identity>
}

export class RequirementsView extends Component<RequirementsViewProps, RequirementsViewState> {
    constructor(props: RequirementsViewProps) {
        super(props)
        this.state = props.requirements
    }

    static DummyRequirementsViewState = (): RequirementsViewState => ({
        requirements: [],
    })
    static RequirementsToState = (requirements: Requirement[]) => ({
        requirements: requirements.map(RequirementView.RequirementToState)
    }) as RequirementsViewState
    static StateToRequirements = (getter: IdentityGetter) =>
        async (state: RequirementsViewState): Promise<Requirement[]> =>
            Promise.all(state.requirements.map(RequirementView.StateToRequirement(getter)))

    addRequirement = () => this.setState((prev: RequirementsViewState) => {
        const updated: RequirementsViewState = {
            ...prev,
            requirements: [
                RequirementView.DummyRequirementViewState(),
                ...prev.requirements,
            ],
        }
        this.props.onRequirementsChanged(updated)
        return updated
    })
    onRequirementChangedAt = (index: number) => (requirement: RequirementViewState) => this.setState((prev: RequirementsViewState) => {
        const requirements: RequirementViewState[] = prev.requirements
        requirements[index] = requirement
        const updated: RequirementsViewState = {
            ...prev,
            requirements: requirements,
        }
        this.props.onRequirementsChanged(updated)
        return updated
    })
    removeRequirementAt = (index: number) => () => this.setState((prev: RequirementsViewState) => {
        const requirements: RequirementViewState[] = prev.requirements
        requirements.splice(index, 1)
        const updated: RequirementsViewState = {
            ...prev,
            requirements: requirements,
        }
        this.props.onRequirementsChanged(updated)
        return updated
    })

    render() {
        const { requirements } = this.state
        const { myInfo, fetchCddId, location, canManipulate } = this.props
        const addButton: JSX.Element = <button
            className="submit add-requirement"
            onClick={this.addRequirement}
            disabled={!canManipulate}>
            Add
        </button>
        if (typeof requirements === "undefined" || requirements === null || requirements.length === 0)
            return <div>
                No requirements&nbsp;{addButton}
            </div>
        return <div>
            {addButton}
            <ul>{
                requirements.map((requirement: RequirementViewState, index: number) => <li key={index}>
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
