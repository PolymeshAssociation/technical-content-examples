import { CustomPermissionGroup } from "@polymathnetwork/polymesh-sdk/api/entities/CustomPermissionGroup";
import { KnownPermissionGroup } from "@polymathnetwork/polymesh-sdk/api/entities/KnownPermissionGroup";
import { Identity } from "@polymathnetwork/polymesh-sdk/types";
import { Component } from "react";
import { OnAgentChanged } from "../../handlers/permissions/AgentHandlers";
import { fetchPermissions, OnPermissionsInfoJsonChanged } from "../../handlers/permissions/PermissionsHandlers";
import {
    getEmptyPermissionsInfoJson,
    PermissionGroupInfoJson,
    PermissionsInfoJson,
    TokenInfoJson,
} from "../../types";
import { showFetchCycle, ShowFetchCycler } from "../../ui-helpers";
import { CollapsibleFieldsetView } from "../presentation/CollapsibleFieldsetView";
import { NewPermissionAgentView, PermissionAgentWithGroupsView } from "./PermissionAgentView";
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
    onPermissionsInfoJsonChanged: OnPermissionsInfoJsonChanged
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

    componentDidUpdate(prevProps: Readonly<PermissionManagerViewProps>, _: Readonly<PermissionManagerViewState>): void {
        if (this.props.token.current === null && prevProps.token.current === null) {
            // Do nothing
        } else if (this.props.token.current === null || prevProps.token.current === null) {
            this.loadPermissionsDelayed()
        } else if (!this.props.token.current.isEqual(prevProps.token.current)) {
            this.loadPermissionsDelayed()
        }
    }

    loadPermissionsDelayed = () => setTimeout(this.loadPermissions, 100)
    loadPermissions = async (): Promise<PermissionsInfoJson> => {
        const cycler: ShowFetchCycler = showFetchCycle("Token permissions")
        const permissionsInfo = await fetchPermissions(this.props.token.current)
        cycler.fetched()
        this.setState({
            permissions: permissionsInfo,
        })
        this.props.onPermissionsInfoJsonChanged(permissionsInfo)
        return permissionsInfo
    }
    onGroupPicked = (group: PermissionGroupInfoJson<KnownPermissionGroup | CustomPermissionGroup>): void => this.setState({
        pickedGroup: group,
    })

    onAgentChanged = (agent: Identity): void => {
        this.loadPermissionsDelayed()
        this.props.onAgentChanged(agent)
    }

    render() {
        const {
            permissions: {
                original,
                groups,
                agents,
            },
            pickedGroup,
        } = this.state
        const { myDid, token, cardStyle, hasTitleStyle, isWrongStyle } = this.props
        const canManipulate: boolean = token.details?.owner?.did === myDid
        const canInvite: boolean = canManipulate && original !== null
        return <CollapsibleFieldsetView
            className={cardStyle}
            legend={`Permissions For: ${token.current?.ticker}`}
            collapsed={true}>

            <CollapsibleFieldsetView
                className={cardStyle}
                legend="Agent Groups"
                collapsed={false}>

                <PermissionGroupsInfoView
                    permissions={original}
                    groups={groups}
                    onGroupPicked={this.onGroupPicked}
                    onGroupsInfoUpdated={this.loadPermissionsDelayed}
                    canManipulate={canManipulate}
                />

                <NewCustomPermissionGroupView
                    cardStyle={cardStyle}
                    permissions={original}
                    onGroupCreated={this.loadPermissionsDelayed}
                    canManipulate={canManipulate}
                />

            </CollapsibleFieldsetView>

            <CollapsibleFieldsetView
                className={cardStyle}
                legend="External Agents"
                collapsed={false}>

                <PermissionAgentWithGroupsView
                    permissions={original}
                    agents={agents}
                    myDid={myDid}
                    canManipulate={canManipulate}
                    onAgentChanged={this.onAgentChanged}
                />

                <NewPermissionAgentView
                    permissions={original}
                    cardStyle={cardStyle}
                    hasTitleStyle={hasTitleStyle}
                    isWrongStyle={isWrongStyle}
                    onAgentInvited={this.onAgentChanged}
                    defaultGroup={pickedGroup}
                    canManipulate={canInvite}
                />

            </CollapsibleFieldsetView>

        </CollapsibleFieldsetView>
    }
}
