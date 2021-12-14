import { CustomPermissionGroup, KnownPermissionGroup } from "@polymathnetwork/polymesh-sdk/internal";
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
import { BasicProps } from "../BasicProps";
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

export interface PermissionAgentViewProps extends BasicProps {
    agent: AgentInfoJson
    myDid: string
}

export class PermissionAgentView extends Component<PermissionAgentViewProps> {
    render() {
        const { agent, myDid, location, canManipulate } = this.props
        return <ul>
            <li key="did">
                Did: <IdentityView value={agent.current} lut={{ [myDid]: "me" }} />
            </li>
            <li key="isOwner">Is owner: {isOwner(agent.group.current) ? "true" : "false"}</li>
            <li key="isIssuanceAgent">Is issuance agent: {isIssuanceAgent(agent.group) ? "true" : "false"}</li>
            <li key="group">
                Group: {
                    (function () {
                        if (isKnownPermissionGroup(agent.group.current)) return <KnownPermissionGroupView
                            group={agent.group.current}
                            location={[...location, "current", "group"]}
                            canManipulate={canManipulate}
                        />
                        else if (isCustomPermissionGroup(agent.group.current)) return <CustomPermissionGroupView
                            group={agent.group.current}
                            location={[...location, "current", "group"]}
                            canManipulate={canManipulate}
                        />
                    })()
                }
            </li>
        </ul>
    }
}

export interface PermissionAgentsViewProps extends BasicProps {
    agents: AgentInfoJson[]
    myDid: string
}

export class PermissionAgentsView extends Component<PermissionAgentsViewProps> {
    render() {
        const { agents, myDid, location, canManipulate } = this.props
        if (agents.length === 0) return <span> None</span>
        else return <ol>{
            agents
                .map((agent: AgentInfoJson, agentIndex: number) => <PermissionAgentView
                    agent={agent}
                    myDid={myDid}
                    location={[...location, agentIndex]}
                    canManipulate={canManipulate} />)
                .map((presented: JSX.Element, agentIndex: number) => <li key={agentIndex}>
                    {presented}
                </li>)
        }</ol>
    }
}

