import { CustomPermissionGroup, KnownPermissionGroup } from "@polymathnetwork/polymesh-sdk/internal";
import { Component } from "react";
import { PermissionGroupsInfo } from "../../types";
import { BasicProps } from "../BasicProps";

export interface KnownPermissionGroupViewProps extends BasicProps {
    group: KnownPermissionGroup
}

export class KnownPermissionGroupView extends Component<KnownPermissionGroupViewProps> {
    render() {
        const { group } = this.props
        return <ul>
            <li>Type: {group.type}</li>
            <li>Ticker: {group.ticker}</li>
            <li>Uuid: {group.uuid}</li>
        </ul>
    }
}

export interface KnownPermissionGroupsViewProps extends BasicProps {
    groups: KnownPermissionGroup[]
}

export class KnownPermissionGroupsView extends Component<KnownPermissionGroupsViewProps> {
    render() {
        const { groups, location, canManipulate } = this.props
        if (groups.length === 0) return <span> None</span>
        else return <ol>{
            groups
                .map((group: KnownPermissionGroup, groupIndex: number) => <KnownPermissionGroupView
                    group={group}
                    location={[...location, groupIndex]}
                    canManipulate={canManipulate} />)
                .map((presented: JSX.Element, groupIndex: number) => <li key={groupIndex}>
                    {presented}
                </li>)
        }</ol>
    }
}

export interface CustomPermissionGroupViewProps extends BasicProps {
    group: CustomPermissionGroup
}

export class CustomPermissionGroupView extends Component<CustomPermissionGroupViewProps> {
    render() {
        const { group } = this.props
        return <ul>
            <li>Id: {group.id.toString(10)}</li>
            <li>Ticker: {group.ticker}</li>
            <li>Uuid: {group.uuid}</li>
        </ul>
    }
}

export interface CustomPermissionGroupsViewProps extends BasicProps {
    groups: CustomPermissionGroup[]
}

export class CustomPermissionGroupsView extends Component<CustomPermissionGroupsViewProps> {
    render() {
        const { groups, location, canManipulate } = this.props
        if (groups.length === 0) return <span> None</span>
        else return <ol>{
            groups
                .map((group: CustomPermissionGroup, groupIndex: number) => <CustomPermissionGroupView
                    group={group}
                    location={[...location, groupIndex]}
                    canManipulate={canManipulate} />)
                .map((presented: JSX.Element, groupIndex: number) => <li key={groupIndex}>
                    {presented}
                </li>)
        }</ol>
    }
}

export interface PermissionGroupsViewProps extends BasicProps {
    groups: PermissionGroupsInfo
}

export class PermissionGroupsView extends Component<PermissionGroupsViewProps> {
    render() {
        const { groups, location, canManipulate } = this.props
        if (typeof groups === "undefined" || groups === null) return <div>No permission groups</div>
        return <div>
            <div>
                Known:
                <KnownPermissionGroupsView
                    groups={groups.known}
                    location={[...location, "known"]}
                    canManipulate={canManipulate} />
            </div>
            <div>
                Custom:
                <CustomPermissionGroupsView
                    groups={groups.custom}
                    location={[...location, "custom"]}
                    canManipulate={canManipulate} />
            </div>
        </div>
    }
}
