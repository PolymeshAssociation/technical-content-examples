import {
    CustomPermissionGroup,
    InviteExternalAgentParams,
    KnownPermissionGroup,
    RemoveExternalAgentParams,
} from "@polymathnetwork/polymesh-sdk/internal";
import { AssetTx } from "@polymathnetwork/polymesh-sdk/polkadot/types";
import {
    GroupPermissions,
    ModuleName,
    PermissionGroupType,
    TxTag
} from "@polymathnetwork/polymesh-sdk/types";
import { Component } from "react";
import {
    AgentInfoJson,
    CustomPermissionGroupInfoJson,
    isCustomPermissionGroup,
    isKnownPermissionGroup,
    KnownPermissionGroupInfoJson,
} from "../../types";
import { EnumSelectView } from "../EnumView";
import { IdentityView } from "../identity/IdentityView";
import { CustomPermissionGroupView, KnownPermissionGroupView } from "./PermissionGroupView";

function isOwner(group: KnownPermissionGroup | CustomPermissionGroup): boolean {
    return isKnownPermissionGroup(group) && group.type === PermissionGroupType.Full
}

function isIssuanceAgent(group: KnownPermissionGroupInfoJson | CustomPermissionGroupInfoJson): boolean {
    return (isKnownPermissionGroup(group.current) && group.current.type === PermissionGroupType.PolymeshV1Pia) ||
        (isCustomPermissionGroup(group.current) && areIssuanceAgentPermissions(group.permissions))
}

const issuanceKey = "issuance"
const patternAgentTags: { [key: string]: (TxTag | ModuleName)[] } = {
    [issuanceKey]: [
        AssetTx.ControllerTransfer,
        AssetTx.Issue,
        AssetTx.Redeem,
        ModuleName.Sto
    ]
};

function areIssuanceAgentPermissions(permissions: GroupPermissions): boolean {
    return new Set(permissions.transactions
        ?.values
        ?.map((value: TxTag | ModuleName) => patternAgentTags.issuance.indexOf(value)))
        .size === patternAgentTags.issuance.length
}

declare enum GroupType {
    Known = "Knwon",
    Custom = "Custom",
}

const agentKey = "agent"
const groupTypeKey = "groupType"
const knownGroupKey = "knownGroup"
const customGroupKey = "customGroup"

interface PermissionAgentViewState {
    [agentKey]: AgentInfoJson
    [groupTypeKey]: GroupType
    [knownGroupKey]: KnownPermissionGroup
    [customGroupKey]: CustomPermissionGroup
}

export interface PermissionAgentViewProps {
    myDid: string
    agent: AgentInfoJson
    knownGroups: KnownPermissionGroupInfoJson[]
    customGroups: CustomPermissionGroupInfoJson[]
    canManipulate: boolean
}

export class PermissionAgentView extends Component<PermissionAgentViewProps, PermissionAgentViewState> {
    constructor(props: PermissionAgentViewProps) {
        super(props)
        const currentGroup: KnownPermissionGroup | CustomPermissionGroup = props.agent.group.current
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
        const { agent } = this.state
        const { myDid } = this.props
        return <ul>
            <li key="did">
                Did: <IdentityView value={agent.current} lut={{ [myDid]: "me" }} />
            </li>
            <li key="isOwner">Is owner: {isOwner(agent.group.current) ? "true" : "false"}</li>
            <li key="isIssuanceAgent">Is issuance agent: {isIssuanceAgent(agent.group) ? "true" : "false"}</li>
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
                        if (isKnownPermissionGroup(agent.group.current)) return <KnownPermissionGroupView
                            group={agent.group.current}
                        />
                        else if (isCustomPermissionGroup(agent.group.current)) return <CustomPermissionGroupView
                            group={agent.group.current}
                        />
                    })()
                }
            </li>
        </ul>
    }
}

export type RemoveAgent = (params: RemoveExternalAgentParams) => Promise<void>

export interface PermissionAgentsViewProps {
    agents: AgentInfoJson[]
    myDid: string
    knownGroups: KnownPermissionGroupInfoJson[]
    customGroups: CustomPermissionGroupInfoJson[]
    canManipulate: boolean
    removeAgent: RemoveAgent
}

export class PermissionAgentsView extends Component<PermissionAgentsViewProps> {
    onRemoveAgent = (agent: AgentInfoJson) => (e) => this.props.removeAgent({
        target: agent.current,
    })

    render() {
        const {
            agents,
            myDid,
            knownGroups,
            customGroups,
            canManipulate,
        } = this.props
        if (agents.length === 0) return <span> None</span>
        else return <ol>{
            agents.map((agent: AgentInfoJson, index: number) => <li key={index}>
                <button
                    className="submit"
                    onClick={this.onRemoveAgent(agent)}>
                    Remove it
                </button>
                <PermissionAgentView
                    agent={agent}
                    myDid={myDid}
                    knownGroups={knownGroups}
                    customGroups={customGroups}
                    canManipulate={canManipulate} />
            </li>)
        }</ol>
    }
}

export type InviteAgent = (params: InviteExternalAgentParams) => Promise<void>

const inviteTargetKey = "inviteTarget"
const hasExpiryKey = "hasExpiry"
const expiryKey = "expiry"
const isExpiryValidKey = "isExpiryValid"

interface NewPermissionAgentViewState {
    [inviteTargetKey]: string
    [hasExpiryKey]: boolean
    [expiryKey]: string
    [isExpiryValidKey]: boolean
}

export interface NewPermissionAgentViewProps {
    cardStyle: any
    hasTitleStyle: any
    isWrongStyle: any
    defaultGroup: KnownPermissionGroupInfoJson | CustomPermissionGroupInfoJson | null | undefined
    canManipulate: boolean
    inviteAgent: InviteAgent
}

export class NewPermissionAgentView extends Component<NewPermissionAgentViewProps, NewPermissionAgentViewState> {
    constructor(props: NewPermissionAgentViewProps) {
        super(props)
        this.state = {
            [inviteTargetKey]: "",
            [hasExpiryKey]: true,
            [expiryKey]: new Date().toISOString(),
            [isExpiryValidKey]: true,
        }
    }

    updateInviteTarget = (e) => this.setState({ inviteTarget: e.target.value })
    updateExpiry = (e) => {
        const newExpiry = e.target.value
        this.setState({
            [expiryKey]: newExpiry,
            [isExpiryValidKey]: new Date(newExpiry).toString() !== "Invalid Date"
        })
    }
    updateHasExpiry = (e) => this.setState({ [hasExpiryKey]: e.target.checked })
    onAgentInvited = async (e) => {
        this.props.inviteAgent({
            target: this.state.inviteTarget,
            expiry: this.state.hasExpiry ? new Date(this.state.expiry) : undefined,
            permissions: this.props.defaultGroup.current,
        })
    }

    render() {
        const {
            cardStyle,
            hasTitleStyle,
            isWrongStyle,
            defaultGroup,
            canManipulate,
        } = this.props
        return <fieldset className={cardStyle} >
            <legend>New Agent</legend>

            <div>
                <label htmlFor="invite-target">
                    <span className={hasTitleStyle} title="Long name of your security token">Name</span>
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
                    <span className={hasTitleStyle} title="Whether the invitation has an expiry">Has Expiry</span>
                </label>
                <input
                    name="invite-has-expiry"
                    type="checkbox"
                    defaultChecked={this.state.hasExpiry}
                    disabled={!canManipulate}
                    onChange={this.updateHasExpiry}
                />
            </div>
            <div>
                <label htmlFor="invite-expiry">
                    <span
                        className={hasTitleStyle}
                        title="Expiry of the invitation">
                        Expiry
                    </span>
                </label>
                <input
                    name="invite-expiry"
                    type="text"
                    className={this.state.isExpiryValid ? "" : isWrongStyle}
                    placeholder={new Date().toISOString()}
                    defaultValue={this.state.expiry}
                    disabled={!canManipulate || !this.state.hasExpiry}
                    onChange={this.updateExpiry}
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
                        return <div>Pick a group above</div>
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