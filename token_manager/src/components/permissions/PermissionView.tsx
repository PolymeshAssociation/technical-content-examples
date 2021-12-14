import { Component } from "react";
import { MyInfoJson } from "../../types";
import { BasicProps } from "../BasicProps";
import { PermissionAgentsView } from "./PermissionAgentView";
import { PermissionGroupsInfoView } from "./PermissionGroupView";

export interface PermissionManagerViewProps extends BasicProps {
    myInfo: MyInfoJson
    cardStyle: any
}

export class PermissionManagerView extends Component<PermissionManagerViewProps> {
    render() {
        const { myInfo, cardStyle, location, canManipulate } = this.props
        return <fieldset className={cardStyle}>
            <legend>Permissions For: {myInfo.token.current?.ticker}</legend>

            <fieldset className={cardStyle}>
                <legend>Agent Groups</legend>

                <div className="submit">
                    <PermissionGroupsInfoView
                        groups={myInfo.permissions.groups}
                        location={[...location, "permissions", "groups"]}
                        canManipulate={canManipulate}
                    />
                </div>

            </fieldset>

            <fieldset className={cardStyle}>
                <legend>External Agents</legend>

                <div className="submit">
                    <PermissionAgentsView
                        agents={myInfo.permissions.agents.current}
                        myDid={myInfo.myDid}
                        location={[...location, "permissions", "agents"]}
                        canManipulate={canManipulate}
                    />
                </div>

            </fieldset>

        </fieldset>
    }
}
