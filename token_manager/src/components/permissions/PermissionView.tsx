import { CustomPermissionGroup } from "@polymathnetwork/polymesh-sdk/api/entities/CustomPermissionGroup";
import { KnownPermissionGroup } from "@polymathnetwork/polymesh-sdk/api/entities/KnownPermissionGroup";
import { InviteExternalAgentParams } from "@polymathnetwork/polymesh-sdk/api/procedures/inviteExternalAgent";
import { AgentWithGroup, GroupPermissions, Identity, SecurityToken } from "@polymathnetwork/polymesh-sdk/types";
import { Component } from "react";
import { OnAgentChanged } from "../../handlers/permissions/AgentHandlers";
import { OnPermissionsChanged } from "../../handlers/permissions/PermissionsHandlers";
import {
    AgentInfoJson,
    AgentsInfoJson,
    getEmptyPermissionsInfoJson,
    PermissionGroupInfoJson,
    PermissionGroupsInfo,
    PermissionGroupsInfoJson,
    PermissionsInfoJson,
    TokenInfoJson,
} from "../../types";
import { NewPermissionAgentView, PermissionAgentsView } from "./PermissionAgentView";
import { NewCustomPermissionGroupView, PermissionGroupsInfoView } from "./PermissionGroupView";

interface PermissionManagerViewState {
    pickedGroup: PermissionGroupInfoJson<KnownPermissionGroup | CustomPermissionGroup> | null
    permissions: PermissionsInfoJson
}

export interface PermissionManagerViewProps {
    myDid: string
    token: TokenInfoJson
    cardStyle: any
    hasTitleStyle: any
    isWrongStyle: any
    onAgentChanged: OnAgentChanged
    onPermissionsChanged: OnPermissionsChanged
}

export class PermissionManagerView extends Component<PermissionManagerViewProps, PermissionManagerViewState> {
    constructor(props: PermissionManagerViewProps) {
        super(props)
        this.state = {
            pickedGroup: null,
            permissions: getEmptyPermissionsInfoJson(),
        }
        this.loadPermissionsDelayed()
    }

    componentDidUpdate(prevProps: Readonly<PermissionManagerViewProps>, prevState: Readonly<PermissionManagerViewState>, snapshot?: any): void {
        if (this.props.token.current?.ticker !== prevProps.token.current?.ticker) {
            this.loadPermissionsDelayed()
        } else if (this.props.token.current?.ticker === prevProps.token.current?.ticker) {
            if (this.props.token.details?.owner !== prevProps.token.details?.owner) {
                this.loadPermissionsDelayed()
            }
        }
    }

    loadPermissionsDelayed = () => setTimeout(this.loadPermissions, 100)
    loadPermissions = async (): Promise<PermissionsInfoJson> => {
        const token: SecurityToken = this.props.token.current
        const permissionsInfo = token === null
            ? getEmptyPermissionsInfoJson()
            : {
                original: token.permissions,
                groups: await this.fetchPermissionGroups(await token.permissions.getGroups()),
                agents: await this.fetchPermissionAgents(await token.permissions.getAgents()),
            }
        this.setState({
            permissions: permissionsInfo,
        })
        this.props.onPermissionsChanged(permissionsInfo)
        return permissionsInfo
    }
    fetchPermissionGroup = async <GroupType extends KnownPermissionGroup | CustomPermissionGroup>(group: GroupType): Promise<PermissionGroupInfoJson<GroupType>> => {
        console.log(group)
        const [permissions, exists]: [GroupPermissions, boolean] = await Promise.all([group.getPermissions(), group.exists()])
        return {
            current: group,
            permissions: permissions,
            exists: exists,
        }
    }
    fetchPermissionGroups = async (groups: PermissionGroupsInfo): Promise<PermissionGroupsInfoJson> => {
        const [known, custom]: [PermissionGroupInfoJson<KnownPermissionGroup>[], PermissionGroupInfoJson<CustomPermissionGroup>[]] = await Promise.all([
            Promise.all(groups.known.map(this.fetchPermissionGroup)),
            Promise.all(groups.custom.map(this.fetchPermissionGroup)),
        ])
        return {
            known: known,
            custom: custom,
        }
    }
    fetchPermissionAgents = async (agentWithGroups: AgentWithGroup[]): Promise<AgentsInfoJson> => ({
        current: agentWithGroups.map((agentWithGroup: AgentWithGroup): AgentInfoJson => ({
            current: agentWithGroup,
        }))
    })
    onGroupPicked = (group: PermissionGroupInfoJson<KnownPermissionGroup | CustomPermissionGroup>): void => this.setState({
        pickedGroup: group,
    })

    onAgentChanged = (agent: Identity): void => {
        this.loadPermissionsDelayed()
        this.props.onAgentChanged(agent)
    }
    onInviteAgent = async (params: InviteExternalAgentParams): Promise<void> => {
        await (await this.state.permissions.original.inviteAgent(params)).run()
    }


    render() {
        const { permissions, pickedGroup } = this.state
        const { myDid, token, cardStyle, hasTitleStyle, isWrongStyle } = this.props
        const canManipulate: boolean = token.details?.owner?.did === myDid
        const canInvite: boolean = canManipulate && permissions.original !== null
        return <fieldset className={cardStyle}>
            <legend>Permissions For: {token.current?.ticker}</legend>

            <fieldset className={cardStyle}>
                <legend>Agent Groups</legend>

                <div className="submit">
                    <PermissionGroupsInfoView
                        permissions={permissions.original}
                        groups={permissions.groups}
                        onGroupPicked={this.onGroupPicked}
                        onGroupsInfoUpdated={this.loadPermissionsDelayed}
                        canManipulate={canManipulate}
                    />
                </div>

            </fieldset>

            <NewCustomPermissionGroupView
                cardStyle={cardStyle}
                permissions={permissions.original}
                onGroupCreated={this.loadPermissionsDelayed}
                canManipulate={canManipulate}
            />

            <fieldset className={cardStyle}>
                <legend>External Agents</legend>

                <div className="submit">
                    <PermissionAgentsView
                        permissions={permissions.original}
                        agents={permissions.agents.current}
                        myDid={myDid}
                        knownGroups={permissions.groups.known}
                        customGroups={permissions.groups.custom}
                        canManipulate={canManipulate}
                        onAgentChanged={this.onAgentChanged}
                    />
                </div>

            </fieldset>

            <NewPermissionAgentView
                cardStyle={cardStyle}
                hasTitleStyle={hasTitleStyle}
                isWrongStyle={isWrongStyle}
                onInviteAgent={this.onInviteAgent}
                defaultGroup={pickedGroup}
                canManipulate={canInvite}
            />

        </fieldset>
    }
}
