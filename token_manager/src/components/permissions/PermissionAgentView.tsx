import {
    CustomPermissionGroup,
    KnownPermissionGroup,
    RemoveExternalAgentParams,
} from "@polymathnetwork/polymesh-sdk/internal";
import { Identity } from "@polymathnetwork/polymesh-sdk/types";
import { Permissions } from "@polymathnetwork/polymesh-sdk/api/entities/SecurityToken/Permissions"
import { Component } from "react";
import {
    AgentInfoJson,
    isCustomPermissionGroup,
    isKnownPermissionGroup,
    PermissionGroupInfoJson,
} from "../../types";
import { EnumSelectView } from "../EnumView";
import { IdentityView } from "../identity/IdentityView";
import { CustomPermissionGroupView, KnownPermissionGroupView } from "./PermissionGroupView";
import { OnInviteAgent, isOwner, OnAgentChanged } from "../../handlers/permissions/AgentHandlers";
import { DateTimeEntryView } from "../elements/DateTimeEntry";

enum GroupType {
    Known = "Known",
    Custom = "Custom",
}

interface PermissionAgentViewState {
    agent: AgentInfoJson
    groupType: GroupType
    knownGroup: KnownPermissionGroup
    customGroup: CustomPermissionGroup
}

export interface PermissionAgentViewProps {
    permissions: Permissions
    myDid: string
    agent: AgentInfoJson
    knownGroups: PermissionGroupInfoJson<KnownPermissionGroup>[]
    customGroups: PermissionGroupInfoJson<CustomPermissionGroup>[]
    canManipulate: boolean
    onAgentChanged: OnAgentChanged
}

export class PermissionAgentView extends Component<PermissionAgentViewProps, PermissionAgentViewState> {
    constructor(props: PermissionAgentViewProps) {
        super(props)
        const currentGroup: KnownPermissionGroup | CustomPermissionGroup = props.agent.current.group
        const groupType: GroupType = isKnownPermissionGroup(currentGroup) ? GroupType.Known : GroupType.Custom
        this.state = {
            agent: props.agent,
            groupType: groupType,
            knownGroup: isKnownPermissionGroup(currentGroup) ? currentGroup : props.knownGroups[0].current,
            customGroup: isCustomPermissionGroup(currentGroup) ? currentGroup : props.customGroups[0]?.current,
        }
    }

    onGroupTypeChanged = async (e) => this.setState({ groupType: e.target.value })

    render() {
        const { agent }: { agent: AgentInfoJson } = this.state
        const { myDid } = this.props
        return <ul>
            <li key="did">
                Did: <IdentityView value={agent.current.agent} lut={{ [myDid]: "me" }} />
            </li>
            <li key="isOwner">Is owner: {isOwner(agent.current.group) ? "true" : "false"}</li>
            {/* <li key="isIssuanceAgent">Is issuance agent: {isIssuanceAgentGroup(agent.group) ? "true" : "false"}</li> */}
            <li key="groupType">
                Group type: <EnumSelectView
                    theEnum={GroupType}
                    defaultValue={this.state.groupType}
                    onChange={this.onGroupTypeChanged}
                    canManipulate={false}
                />
            </li>
            <li key="group">
                Group: {
                    (function () {
                        if (isKnownPermissionGroup(agent.current.group)) return <KnownPermissionGroupView
                            group={agent.current.group}
                        />
                        else if (isCustomPermissionGroup(agent.current.group)) return <CustomPermissionGroupView
                            group={agent.current.group}
                        />
                    })()
                }
            </li>
        </ul>
    }
}

export interface PermissionAgentsViewProps {
    permissions: Permissions
    agents: AgentInfoJson[]
    myDid: string
    knownGroups: PermissionGroupInfoJson<KnownPermissionGroup>[]
    customGroups: PermissionGroupInfoJson<CustomPermissionGroup>[]
    canManipulate: boolean
    onAgentChanged: OnAgentChanged
}

export class PermissionAgentsView extends Component<PermissionAgentsViewProps> {
    onRemoveAgent = (agent: AgentInfoJson) => async (e) => {
        await (await this.props.permissions.removeAgent(this.getRemoveParams(agent.current.agent))).run()
        this.props.onAgentChanged(agent.current.agent)
    }
    getRemoveParams = (agent: Identity): RemoveExternalAgentParams => ({
        target: agent
    })

    render() {
        const {
            permissions,
            agents,
            myDid,
            knownGroups,
            customGroups,
            canManipulate,
            onAgentChanged,
        } = this.props
        if (agents.length === 0) return <span>None</span>
        else return <ol>{
            agents.map((agent: AgentInfoJson, index: number) => <li key={index}>
                <button
                    className="submit"
                    onClick={this.onRemoveAgent(agent)}
                    disabled={!canManipulate}>
                    Remove it
                </button>
                <PermissionAgentView
                    permissions={permissions}
                    agent={agent}
                    myDid={myDid}
                    knownGroups={knownGroups}
                    customGroups={customGroups}
                    canManipulate={canManipulate}
                    onAgentChanged={onAgentChanged} />
            </li>)
        }</ol>
    }
}

interface NewPermissionAgentViewState {
    inviteTarget: string
    expiry: Date | null
}

export interface NewPermissionAgentViewProps {
    cardStyle: any
    hasTitleStyle: any
    isWrongStyle: any
    defaultGroup: PermissionGroupInfoJson<KnownPermissionGroup | CustomPermissionGroup> | null | undefined
    canManipulate: boolean
    onInviteAgent: OnInviteAgent
}

export class NewPermissionAgentView extends Component<NewPermissionAgentViewProps, NewPermissionAgentViewState> {
    constructor(props: NewPermissionAgentViewProps) {
        super(props)
        this.state = {
            inviteTarget: "",
            expiry: new Date(),
        }
    }

    updateInviteTarget = (e) => this.setState({ inviteTarget: e.target.value })
    onValidExpiryChanged = (newExpiry: Date | null) => this.setState({ expiry: newExpiry })
    onAgentInvited = async (e) => {
        this.props.onInviteAgent({
            target: this.state.inviteTarget,
            expiry: this.state.expiry,
            permissions: this.props.defaultGroup.current,
        })
    }

    render() {
        const { expiry } = this.state
        const {
            cardStyle,
            hasTitleStyle,
            isWrongStyle,
            defaultGroup,
            canManipulate,
        } = this.props
        return <fieldset className={cardStyle} >
            <legend>Agent to invite</legend>

            <div>
                <label htmlFor="invite-target">
                    <span className={hasTitleStyle} title="Did of your target agent">Identity</span>
                </label>
                <input
                    name="invite-target"
                    type="text"
                    placeholder="0x123"
                    defaultValue={this.state.inviteTarget}
                    disabled={!canManipulate}
                    onChange={this.updateInviteTarget}
                />
            </div>
            <div>
                <label htmlFor="invite-has-expiry">
                    <span className={hasTitleStyle} title="Invitation expiry">Invitation Expiry</span>
                </label>
                <DateTimeEntryView
                    dateTime={expiry}
                    isOptional={true}
                    isWrongStyle={isWrongStyle}
                    validDateChanged={this.onValidExpiryChanged}
                    canManipulate={canManipulate}
                />
            </div>
            <div>
                <label htmlFor="invite-group">
                    <span
                        className={hasTitleStyle}
                        title="Picked group in which to invite the agent">
                        Group
                    </span>
                </label>
                {(function () {
                    if (defaultGroup === null || typeof defaultGroup === "undefined")
                        return <div>Pick a group from the list above</div>
                    if (isKnownPermissionGroup(defaultGroup.current))
                        return <KnownPermissionGroupView
                            group={defaultGroup.current}
                        />
                    else
                        return <CustomPermissionGroupView
                            group={defaultGroup.current}
                        />
                })()}
            </div>

            <button
                className="submit"
                disabled={!canManipulate || defaultGroup === null || typeof defaultGroup === "undefined"}
                onClick={this.onAgentInvited}>
                Invite agent
            </button>

        </fieldset >
    }
}