import {
    CustomPermissionGroup,
    InviteExternalAgentParams,
    KnownPermissionGroup,
    RemoveExternalAgentParams,
    TransactionQueue,
} from "@polymathnetwork/polymesh-sdk/internal";
import { AgentWithGroup, Identity } from "@polymathnetwork/polymesh-sdk/types";
import { Permissions } from "@polymathnetwork/polymesh-sdk/api/entities/SecurityToken/Permissions"
import { Component } from "react";
import { PermissionGroupInfoJson } from "../../types";
import { IdentityView } from "../identity/IdentityView";
import { PermissionGroupView } from "./PermissionGroupView";
import { isOwner, OnAgentChanged } from "../../handlers/permissions/AgentHandlers";
import { DateTimeEntryView } from "../elements/DateTimeEntry";
import { CollapsibleFieldsetView } from "../presentation/CollapsibleFieldsetView";
import { showRequestCycle, ShowRequestCycler } from "../../ui-helpers";

export interface PermissionAgentWithGroupViewProps {
    myDid: string
    agentWithGroup: AgentWithGroup
}

export class PermissionAgentWithGroupView extends Component<PermissionAgentWithGroupViewProps> {

    render() {
        const {
            agentWithGroup: {
                agent,
                group,
            },
            myDid,
        } = this.props
        return <ul>
            <li key="did">
                Did: <IdentityView value={agent} lut={{ [myDid]: "me" }} />
            </li>
            <li key="isOwner">Is owner: {isOwner(group) ? "true" : "false"}</li>
            <li key="group">
                Group:&nbsp;
                <PermissionGroupView
                    group={group}
                />
            </li>
        </ul>
    }
}

export interface PermissionAgentWithGroupsViewProps {
    permissions: Permissions
    agents: AgentWithGroup[]
    myDid: string
    canManipulate: boolean
    onAgentChanged: OnAgentChanged
}

export class PermissionAgentWithGroupsView extends Component<PermissionAgentWithGroupsViewProps> {
    onRemoveAgent = (agent: Identity) => async () => {
        const cycler: ShowRequestCycler = showRequestCycle("Removing agent")
        const queue: TransactionQueue<void, void> = await this.props.permissions.removeAgent(this.getRemoveParams(agent))
        cycler.running()
        await queue.run()
        cycler.hasRun()
        this.props.onAgentChanged(agent)
    }
    getRemoveParams = (agent: Identity): RemoveExternalAgentParams => ({
        target: agent
    })

    render() {
        const { agents, myDid, canManipulate } = this.props
        if (agents.length === 0) return <span>None</span>
        return <ol>{
            agents.map((agentWithGroup: AgentWithGroup, index: number) => <li key={index}>
                <button
                    className="submit"
                    onClick={this.onRemoveAgent(agentWithGroup.agent)}
                    disabled={!canManipulate}>
                    Remove it
                </button>
                <PermissionAgentWithGroupView
                    agentWithGroup={agentWithGroup}
                    myDid={myDid} />
            </li>)
        }</ol>
    }
}

interface NewPermissionAgentViewState {
    inviteTarget: string
    expiry: Date | null
    modified: boolean
}

export interface NewPermissionAgentViewProps {
    permissions: Permissions
    cardStyle: any
    hasTitleStyle: any
    isWrongStyle: any
    defaultGroup: PermissionGroupInfoJson<KnownPermissionGroup | CustomPermissionGroup> | null | undefined
    canManipulate: boolean
    onAgentInvited: OnAgentChanged
}

export class NewPermissionAgentView extends Component<NewPermissionAgentViewProps, NewPermissionAgentViewState> {
    constructor(props: NewPermissionAgentViewProps) {
        super(props)
        this.state = {
            inviteTarget: "",
            expiry: new Date(),
            modified: false,
        }
    }

    updateInviteTarget = (e: React.ChangeEvent<HTMLInputElement>) => this.setState({
        inviteTarget: e.target.value,
        modified: true,
    })
    onValidExpiryChanged = (newExpiry: Date | null) => this.setState({
        expiry: newExpiry,
        modified: true,
    })
    getInviteParams = (): InviteExternalAgentParams => ({
        target: this.state.inviteTarget,
        expiry: this.state.expiry,
        permissions: this.props.defaultGroup.current,
    })
    onInviteAgent = async () => {
        const params: InviteExternalAgentParams = this.getInviteParams()
        const cycler: ShowRequestCycler = showRequestCycle("Inviting agent")
        const queue: TransactionQueue<void, void> = await this.props.permissions.inviteAgent(params)
        cycler.running()
        await queue.run()
        cycler.hasRun()
    }

    render() {
        const { expiry, modified } = this.state
        const { cardStyle, hasTitleStyle, isWrongStyle, defaultGroup, canManipulate } = this.props
        const canInvite: boolean = canManipulate && modified && defaultGroup !== null && typeof defaultGroup !== "undefined"
        return <CollapsibleFieldsetView
            className={cardStyle}
            legend="Agent to invite"
            collapsed={false}>

            <div>
                <label htmlFor="invite-target">
                    <span className={hasTitleStyle} title="Did of your target agent">Identity</span>
                </label>
                <input
                    id="invite-target"
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
                    onValidDateChanged={this.onValidExpiryChanged}
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
                {
                    defaultGroup === null || typeof defaultGroup === "undefined"
                        ? <div>Pick a group from the list above</div>
                        : <PermissionGroupView
                            group={defaultGroup.current}
                        />
                }
            </div>

            <button
                className="submit invite-agent"
                disabled={!canInvite}
                onClick={this.onInviteAgent}>
                Invite agent
            </button>

        </CollapsibleFieldsetView >
    }
}