import { CustomPermissionGroup, KnownPermissionGroup } from "@polymathnetwork/polymesh-sdk/internal";
import { Component } from "react";
import {
    CustomPermissionGroupInfoJson,
    KnownPermissionGroupInfoJson,
    PermissionGroupsInfoJson
} from "../../types";
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

export interface KnownPermissionGroupInfoViewProps extends BasicProps {
    group: KnownPermissionGroupInfoJson
}

export class KnownPermissionGroupInfoView extends Component<KnownPermissionGroupInfoViewProps> {
    render() {
        const { group, location, canManipulate } = this.props
        return <ul>
            <li>
                Group: <KnownPermissionGroupView
                    group={group.current}
                    location={[...location, "current"]}
                    canManipulate={canManipulate}
                />
            </li>
            <li>Exists: {group.exists ? "true" : "false"}</li>
        </ul>
    }
}

export interface KnownPermissionGroupInfosViewProps extends BasicProps {
    groups: KnownPermissionGroupInfoJson[]
}

export class KnownPermissionGroupInfosView extends Component<KnownPermissionGroupInfosViewProps> {
    render() {
        const { groups, location, canManipulate } = this.props
        if (groups.length === 0) return <span> None</span>
        else return <ol>{
            groups
                .map((group: KnownPermissionGroupInfoJson, groupIndex: number) => <KnownPermissionGroupInfoView
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

export interface CustomPermissionGroupInfoViewProps extends BasicProps {
    group: CustomPermissionGroupInfoJson
}

export class CustomPermissionGroupInfoView extends Component<CustomPermissionGroupInfoViewProps> {
    render() {
        const { group, location, canManipulate } = this.props
        return <ul>
            <li>
                Group: <CustomPermissionGroupView
                    group={group.current}
                    location={[...location, "current"]}
                    canManipulate={canManipulate}
                />
            </li>
            <li>Exists: {group.exists ? "true" : "false"}</li>
            <li>
                Permissions:

            </li>
        </ul>
    }
}

export interface CustomPermissionGroupInfosViewProps extends BasicProps {
    groups: CustomPermissionGroupInfoJson[]
}

export class CustomPermissionGroupInfosView extends Component<CustomPermissionGroupInfosViewProps> {
    render() {
        const { groups, location, canManipulate } = this.props
        if (groups.length === 0) return <span> None</span>
        else return <ol>{
            groups
                .map((group: CustomPermissionGroupInfoJson, groupIndex: number) => <CustomPermissionGroupInfoView
                    group={group}
                    location={[...location, groupIndex]}
                    canManipulate={canManipulate} />)
                .map((presented: JSX.Element, groupIndex: number) => <li key={groupIndex}>
                    {presented}
                </li>)
        }</ol>
    }
}

export interface PermissionGroupsInfoViewProps extends BasicProps {
    groups: PermissionGroupsInfoJson
}

export class PermissionGroupsInfoView extends Component<PermissionGroupsInfoViewProps> {
    render() {
        const { groups, location, canManipulate } = this.props
        if (typeof groups === "undefined" || groups === null) return <div>No permission groups</div>
        return <div>
            <div>
                Known:
                <KnownPermissionGroupInfosView
                    groups={groups.known}
                    location={[...location, "known"]}
                    canManipulate={canManipulate} />
            </div>
            <div>
                Custom:
                <CustomPermissionGroupInfosView
                    groups={groups.custom}
                    location={[...location, "custom"]}
                    canManipulate={canManipulate} />
            </div>
        </div>
    }
}
