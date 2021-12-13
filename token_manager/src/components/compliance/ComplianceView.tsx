import {
    ClaimType,
    Condition,
    Identity,
    Requirement,
    Scope,
    SecurityToken,
    TrustedClaimIssuer,
} from "@polymathnetwork/polymesh-sdk/types";
import React, { Component } from "react";
import {
    AddToPath,
    FetchAndAddToPath,
    MyInfoJson,
    MyInfoPath,
    OnValueChangedCreator,
    OnRequirementChangedIdentityCreator,
    Getter,
    SimpleAction,
    RequirementsInfoJson,
} from "../../types";
import { BasicProps } from "../BasicProps";
import { RequirementsView } from "./RequirementView";

export interface ComplianceManagerViewProps extends BasicProps {
    requirements: RequirementsInfoJson
    myInfo: MyInfoJson
    cardStyle: any
    onValueChangedCreator: OnValueChangedCreator
    onRequirementChangedCreator: OnValueChangedCreator
    removeFromMyRequirementArray: (location: MyInfoPath) => void
    onRequirementChangedIdentityCreator: OnRequirementChangedIdentityCreator
    addRequirementToMyRequirementArray: AddToPath<Requirement>
    addConditionToMyRequirementArray: AddToPath<Condition>
    addClaimToMyRequirementArray: AddToPath<ClaimType>
    addTrustedIssuerToMyRequirementArray: AddToPath<TrustedClaimIssuer>
    saveRequirements: Getter<SecurityToken>
    pauseCompliance: Getter<SecurityToken>
    resumeCompliance: Getter<SecurityToken>
    simulateCompliance: SimpleAction,
    addToPath: AddToPath<Scope>
    fetchCddId: FetchAndAddToPath<string | Identity>
    getMyDid: Getter<string>
}

export class ComplianceManagerView extends Component<ComplianceManagerViewProps> {
    render() {
        const {
            requirements,
            myInfo,
            cardStyle,
            onValueChangedCreator,
            onRequirementChangedCreator,
            removeFromMyRequirementArray,
            onRequirementChangedIdentityCreator,
            addRequirementToMyRequirementArray,
            addConditionToMyRequirementArray,
            addClaimToMyRequirementArray,
            addTrustedIssuerToMyRequirementArray,
            saveRequirements,
            pauseCompliance,
            resumeCompliance,
            simulateCompliance,
            addToPath,
            fetchCddId,
            getMyDid,
            location,
        } = this.props
        return <fieldset className={cardStyle}>
            <legend>Compliance Requirements For: {myInfo.token.current?.ticker}</legend>

            <div className="submit">
                <button
                    className="submit add-requirement"
                    onClick={() => addRequirementToMyRequirementArray([...location, "current"], { id: Math.round(Math.random() * 1000), conditions: [] })}
                    disabled={!requirements.canManipulate}>
                    Add requirement
                </button>
            </div>

            <div>
                <RequirementsView
                    requirements={requirements.current}
                    myInfo={myInfo}
                    onRequirementChangedCreator={onRequirementChangedCreator}
                    removeFromMyRequirementArray={removeFromMyRequirementArray}
                    onRequirementChangedIdentityCreator={onRequirementChangedIdentityCreator}
                    addConditionToMyRequirementArray={addConditionToMyRequirementArray}
                    addClaimToMyRequirementArray={addClaimToMyRequirementArray}
                    addTrustedIssuerToMyRequirementArray={addTrustedIssuerToMyRequirementArray}
                    addToPath={addToPath}
                    fetchCddId={fetchCddId}
                    location={[...location, "current"]}
                    canManipulate={requirements.canManipulate}
                />
            </div>

            <div>{
                (() => {
                    const canManipulate: boolean = myInfo.token.current !== null
                        && myInfo.token.details?.owner?.did === myInfo.myDid
                        && requirements.modified
                    return <div className="submit">
                        <button
                            className="submit save-requirements"
                            onClick={saveRequirements} disabled={!canManipulate}>
                            Save the whole list of requirements
                        </button>
                    </div>
                })()
            }</div>

            <div>{
                <div className="submit">
                    <button
                        className="submit pause-compliance"
                        onClick={pauseCompliance}
                        disabled={!requirements.canManipulate || requirements.arePaused}>
                        Pause compliance
                    </button>
                    &nbsp;
                    <button
                        className="submit resume-compliance"
                        onClick={resumeCompliance}
                        disabled={!requirements.canManipulate || !requirements.arePaused}>
                        Resume compliance
                    </button>
                </div>
            }</div>

            <div className={cardStyle}>
                <div>Would a transfer of {myInfo.token.current?.ticker} work</div>
                <div>From:&nbsp;
                    <input
                        defaultValue={requirements.settleSimulation.sender}
                        placeholder="0x123"
                        onChange={onValueChangedCreator([...location, "settleSimulation", "sender"], false)} />
                    &nbsp;
                    <button
                        className="submit pick-me-for-sender"
                        onClick={onValueChangedCreator([...location, "settleSimulation", "sender"], false, getMyDid)}>
                        Pick mine
                    </button>
                </div>
                <div>To:&nbsp;
                    <input
                        defaultValue={requirements.settleSimulation.recipient}
                        placeholder="0x123"
                        onChange={onValueChangedCreator([...location, "settleSimulation", "recipient"], false)} />
                    &nbsp;
                    <button
                        className="submit pick-me-for-recipient"
                        onClick={onValueChangedCreator([...location, "settleSimulation", "recipient"], false, getMyDid)}>
                        Pick mine
                    </button>
                </div>
                <div className="submit">
                    <button
                        className="submit simulate-compliance"
                        onClick={simulateCompliance} disabled={myInfo.token.current === null}>
                        Try
                    </button>
                </div>
                <div>
                    Result:
                    {requirements.settleSimulation.works === null ? "No info" : requirements.settleSimulation.works ? "Aye" : "Nay"}
                </div>
            </div>

        </fieldset>

    }
}
