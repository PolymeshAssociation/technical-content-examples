import { Component } from "react";
import {
    CustomPermissionGroupInfoJson,
    KnownPermissionGroupInfoJson,
    PermissionsInfoJson,
    TokenInfoJson,
} from "../../types";
import { BasicProps } from "../BasicProps";
import { InviteAgent, NewPermissionAgentView, PermissionAgentsView, RemoveAgent } from "./PermissionAgentView";
import { PermissionGroupsInfoView } from "./PermissionGroupView";

const pickedGroupKey = "pickedGroup"

interface PermissionManagerViewState {
    [pickedGroupKey]: KnownPermissionGroupInfoJson | CustomPermissionGroupInfoJson
}

export interface PermissionManagerViewProps extends BasicProps {
    myDid: string
    permissions: PermissionsInfoJson
    token: TokenInfoJson
    cardStyle: any
    hasTitleStyle: any
    isWrongStyle: any
    removeAgent: RemoveAgent
    inviteAgent: InviteAgent
}

export class PermissionManagerView extends Component<PermissionManagerViewProps, PermissionManagerViewState> {
    constructor(props: PermissionManagerViewProps) {
        super(props)
        this.state = {
            [pickedGroupKey]: props.permissions.groups.known[0],
        }
    }

    onGroupPicked = (group: KnownPermissionGroupInfoJson | CustomPermissionGroupInfoJson) => this.setState({
        [pickedGroupKey]: group,
    })

    render() {
        const {
            myDid,
            permissions,
            token,
            cardStyle,
            hasTitleStyle,
            isWrongStyle,
            removeAgent,
            inviteAgent,
            location,
            canManipulate,
        } = this.props
        return <fieldset className={cardStyle}>
            <legend>Permissions For: {token.current?.ticker}</legend>

            <fieldset className={cardStyle}>
                <legend>Agent Groups</legend>

                <div className="submit">
                    <PermissionGroupsInfoView
                        groups={permissions.groups}
                        onGroupPicked={this.onGroupPicked}
                        location={[...location, "permissions", "groups"]}
                        canManipulate={canManipulate}
                    />
                </div>

            </fieldset>

            <fieldset className={cardStyle}>
                <legend>External Agents</legend>

                <div className="submit">
                    <PermissionAgentsView
                        agents={permissions.agents.current}
                        myDid={myDid}
                        knownGroups={permissions.groups.known}
                        customGroups={permissions.groups.custom}
                        removeAgent={removeAgent}
                        location={[...location, "permissions", "agents"]}
                        canManipulate={canManipulate}
                    />
                </div>

            </fieldset>

            <NewPermissionAgentView
                cardStyle={cardStyle}
                hasTitleStyle={hasTitleStyle}
                isWrongStyle={isWrongStyle}
                inviteAgent={inviteAgent}
                defaultGroup={this.state.pickedGroup}
                canManipulate={canManipulate}
            />

        </fieldset>
    }
}
