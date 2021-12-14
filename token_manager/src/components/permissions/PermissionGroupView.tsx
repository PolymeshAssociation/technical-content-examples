import { CustomPermissionGroup, KnownPermissionGroup } from "@polymathnetwork/polymesh-sdk/internal";
import {
    GroupPermissions,
    ModuleName,
    PermissionGroupType,
    PermissionType,
    TransactionPermissions,
    TxGroup,
    TxTag
} from "@polymathnetwork/polymesh-sdk/types";
import React, { Component } from "react";
import {
    CustomPermissionGroupInfoJson,
    KnownPermissionGroupInfoJson,
    PermissionGroupsInfoJson
} from "../../types";
import { EnumSelectView } from "../EnumView";
import { LongHexView } from "../LongHexView";

export interface TransactionGroupsViewProps {
    transactionGroups: TxGroup[]
}

export class TransactionGroupsView extends Component<TransactionGroupsViewProps> {
    render() {
        const { transactionGroups } = this.props
        if (transactionGroups.length === 0) return <span>None</span>
        return <ol>{transactionGroups
            .map((transactionGroup: TxGroup, index: number) => <li key={index}>
                <EnumSelectView<TxGroup>
                    theEnum={TxGroup}
                    defaultValue={transactionGroup}
                    onChange={undefined}
                    canManipulate={false}
                />
            </li>)
        }</ol>
    }
}

export interface TransactionPermissionsViewProps {
    transactions: TransactionPermissions | null
}

export class TransactionPermissionsView extends Component<TransactionPermissionsViewProps> {
    render() {
        const { transactions } = this.props
        if (transactions === null) return <span>null</span>
        return <ul>
            <li key="values">
                Values: <ol>{transactions.values
                    .map((tag: TxTag | ModuleName, index: number) => <li key={index}>{tag}</li>)
                }</ol>
            </li>
            <li key="type">
                Type: <EnumSelectView<PermissionType>
                    theEnum={PermissionType}
                    defaultValue={transactions.type}
                    onChange={undefined}
                    canManipulate={false}
                />
            </li>
            <li key="exceptions">
                Exceptions: {(function () {
                    if (typeof transactions.exceptions === "undefined") return "None"
                    return <ol>{transactions.exceptions
                        .map((tag: TxTag, index: number) => <li key={index}>{tag}</li>)
                    }</ol>
                })()}
            </li>
        </ul>
    }
}

export interface GroupPermissionsViewProps {
    permissions: GroupPermissions
    canManipulate: boolean
}

export class GroupPermissionsView extends Component<GroupPermissionsViewProps> {
    render() {
        const { permissions, canManipulate } = this.props
        return <ul>
            <li key="transactionGroups">
                Transaction Groups: <TransactionGroupsView
                    transactionGroups={permissions.transactionGroups}
                />
            </li>
            <li key="transactions">
                Transactions: <TransactionPermissionsView
                    transactions={permissions.transactions}
                />
            </li>
        </ul>
    }
}

export interface KnownPermissionGroupViewProps {
    group: KnownPermissionGroup
}

export class KnownPermissionGroupView extends Component<KnownPermissionGroupViewProps> {
    render() {
        const { group } = this.props
        return <ul>
            <li key="type"><EnumSelectView<PermissionGroupType>
                theEnum={PermissionGroupType}
                defaultValue={group.type}
                onChange={undefined}
                canManipulate={false}
            /></li>
            <li key="ticker">Ticker: {group.ticker}</li>
            <li key="uuid">
                Uuid: <LongHexView value={group.uuid} lut={null} />
            </li>
        </ul>
    }
}

export interface KnownPermissionGroupInfoViewProps {
    group: KnownPermissionGroupInfoJson
    canManipulate: boolean
}

export class KnownPermissionGroupInfoView extends Component<KnownPermissionGroupInfoViewProps> {
    render() {
        const { group, canManipulate } = this.props
        return <ul>
            <li key="current">
                Group: <KnownPermissionGroupView
                    group={group.current}
                />
            </li>
            <li key="exists">Exists: {group.exists ? "true" : "false"}</li>
            <li key="permissions">
                Permissions: <GroupPermissionsView
                    permissions={group.permissions}
                    canManipulate={canManipulate}
                />
            </li>
        </ul>
    }
}

export type PermissionGroupPicked = (group: KnownPermissionGroupInfoJson | CustomPermissionGroupInfoJson) => void

export interface KnownPermissionGroupInfosViewProps {
    groups: KnownPermissionGroupInfoJson[]
    onGroupPicked: PermissionGroupPicked
    canManipulate: boolean
}

export class KnownPermissionGroupInfosView extends Component<KnownPermissionGroupInfosViewProps> {
    onGroupPicked = (group: KnownPermissionGroupInfoJson) => (e) => this.props.onGroupPicked(group)

    render() {
        const { groups, canManipulate } = this.props
        if (groups.length === 0) return <span> None</span>
        else return <ol>{
            groups
                .map((group: KnownPermissionGroupInfoJson, groupIndex: number) => <li key={groupIndex}>
                    <button
                        className="submit"
                        onClick={this.onGroupPicked(group)}
                        disabled={!canManipulate}>
                        Pick it
                    </button>
                    <KnownPermissionGroupInfoView
                        group={group}
                        canManipulate={false} />
                </li>)
        }</ol>
    }
}

export interface CustomPermissionGroupViewProps {
    group: CustomPermissionGroup
}

export class CustomPermissionGroupView extends Component<CustomPermissionGroupViewProps> {
    render() {
        const { group } = this.props
        return <ul>
            <li key="id">Id: {group.id.toString(10)}</li>
            <li key="ticker">Ticker: {group.ticker}</li>
            <li key="uuid">
                Uuid: <LongHexView value={group.uuid} lut={null} />
            </li>
        </ul>
    }
}

export interface CustomPermissionGroupInfoViewProps {
    group: CustomPermissionGroupInfoJson
    canManipulate: boolean
}

export class CustomPermissionGroupInfoView extends Component<CustomPermissionGroupInfoViewProps> {
    render() {
        const { group } = this.props
        return <ul>
            <li key="current">
                Group: <CustomPermissionGroupView
                    group={group.current}
                />
            </li>
            <li key="exists">Exists: {group.exists ? "true" : "false"}</li>
            <li key="permissions">
                Permissions: <GroupPermissionsView
                    permissions={group.permissions}
                    canManipulate={false}
                />
            </li>
        </ul>
    }
}

export interface CustomPermissionGroupInfosViewProps {
    groups: CustomPermissionGroupInfoJson[]
    onGroupPicked: PermissionGroupPicked
    canManipulate: boolean
}

export class CustomPermissionGroupInfosView extends Component<CustomPermissionGroupInfosViewProps> {
    onGroupPicked = (group: CustomPermissionGroupInfoJson) => (e) => this.props.onGroupPicked(group)

    render() {
        const { groups, canManipulate } = this.props
        if (groups.length === 0) return <span> None</span>
        else return <ol>{
            groups
                .map((group: CustomPermissionGroupInfoJson, groupIndex: number) => <li key={groupIndex}>
                    <button
                        className="submit"
                        onClick={this.onGroupPicked(group)}
                        disabled={!canManipulate || !group.exists}>
                        Pick it
                    </button>
                    <CustomPermissionGroupInfoView
                        group={group}
                        canManipulate={canManipulate} />
                </li>)
        }</ol>
    }
}

export interface PermissionGroupsInfoViewProps {
    groups: PermissionGroupsInfoJson
    onGroupPicked: PermissionGroupPicked
    canManipulate: boolean
}

export class PermissionGroupsInfoView extends Component<PermissionGroupsInfoViewProps> {
    render() {
        const { groups, onGroupPicked, canManipulate } = this.props
        if (typeof groups === "undefined" || groups === null) return <div>No permission groups</div>
        return <ol>
            <li key="known">
                Known:
                <KnownPermissionGroupInfosView
                    groups={groups.known}
                    onGroupPicked={onGroupPicked}
                    canManipulate={canManipulate} />
            </li>
            <li key="custom">
                Custom:
                <CustomPermissionGroupInfosView
                    groups={groups.custom}
                    onGroupPicked={onGroupPicked}
                    canManipulate={canManipulate} />
            </li>
        </ol>
    }
}
