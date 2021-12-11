import { CustomPermissionGroup, KnownPermissionGroup } from "@polymathnetwork/polymesh-sdk/internal";
import { AgentWithGroup, PermissionGroupType } from "@polymathnetwork/polymesh-sdk/types";
import React, { Component } from "react";
import {
    isCustomPermissionGroup,
    isKnownPermissionGroup,
} from "../../types";
import { BasicProps } from "../BasicProps";
import { CustomPermissionGroupView, KnownPermissionGroupView } from "./PermissionGroupView";

function isOwner(group: KnownPermissionGroup | CustomPermissionGroup): boolean {
    return isKnownPermissionGroup(group) && group.type === PermissionGroupType.Full
}

function isIssuanceAgent(group: KnownPermissionGroup | CustomPermissionGroup): boolean {
    return (isKnownPermissionGroup(group) && group.type === PermissionGroupType.PolymeshV1Pia)
}

export interface PermissionAgentViewProps extends BasicProps {
    agent: AgentWithGroup
}

export class PermissionAgentView extends Component<PermissionAgentViewProps> {
    render() {
        const { agent, location, canManipulate } = this.props
        return <ul>
            <li>Did: {agent.agent.did}</li>
            <li>Is owner: {isOwner(agent.group) ? "true" : "false"}</li>
            <li>
                Group: {
                    (function () {
                        if (isKnownPermissionGroup(agent.group)) return <KnownPermissionGroupView
                            group={agent.group}
                            location={[...location, "agent", "group"]}
                            canManipulate={canManipulate}
                        />
                        else if (isCustomPermissionGroup(agent.group)) return <CustomPermissionGroupView
                            group={agent.group}
                            location={[...location, "agent", "group"]}
                            canManipulate={canManipulate}
                        />
                    })()
                }
            </li>
        </ul>
    }
}

export interface PermissionAgentsViewProps extends BasicProps {
    agents: AgentWithGroup[]
}

export class PermissionAgentsView extends Component<PermissionAgentsViewProps> {
    render() {
        const { agents, location, canManipulate } = this.props
        if (agents.length === 0) return <span> None</span>
        else return <ol>{
            agents
                .map((agent: AgentWithGroup, agentIndex: number) => <PermissionAgentView
                    agent={agent}
                    location={[...location, agentIndex]}
                    canManipulate={canManipulate} />)
                .map((presented: JSX.Element, agentIndex: number) => <li key={agentIndex}>
                    {presented}
                </li>)
        }</ol>
    }
}

