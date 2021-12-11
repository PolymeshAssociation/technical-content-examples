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
import { BasicProps } from "../BasicProps";
import { EnumSelectView } from "../EnumView";

export interface TransactionGroupsViewProps extends BasicProps {
    transactionGroups: TxGroup[]
}

export class TransactionGroupsView extends Component<TransactionGroupsViewProps> {
    render() {
        const { transactionGroups, location, canManipulate } = this.props
        if (transactionGroups.length === 0) return <span>None</span>
        return <ol>{transactionGroups
            .map((transactionGroup: TxGroup, index: number) => <li key={index}>
                <EnumSelectView<TxGroup>
                    theEnum={TxGroup}
                    defaultValue={transactionGroup}
                    onChangeCreator={undefined}
                    location={[...location, index]}
                    canManipulate={canManipulate}
                />
            </li>)
        }</ol>
    }
}

export interface TransactionPermissionsViewProps extends BasicProps {
    transactions: TransactionPermissions | null
}

export class TransactionPermissionsView extends Component<TransactionPermissionsViewProps> {
    render() {
        const { transactions, location, canManipulate } = this.props
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
                    onChangeCreator={undefined}
                    location={[...location, "type"]}
                    canManipulate={canManipulate}
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

export interface PermissionsViewProps extends BasicProps {
    permissions: GroupPermissions
}

export class PermissionsView extends Component<PermissionsViewProps> {
    render() {
        const { permissions, location, canManipulate } = this.props
        return <ul>
            <li key="transactionGroups">
                Transaction Groups: <TransactionGroupsView
                    transactionGroups={permissions.transactionGroups}
                    location={[...location, "transactionGroups"]}
                    canManipulate={canManipulate}
                />
            </li>
            <li key="transactions">
                Transactions: <TransactionPermissionsView
                    transactions={permissions.transactions}
                    location={[...location, "transactions"]}
                    canManipulate={canManipulate}
                />
            </li>
        </ul>
    }
}

export interface KnownPermissionGroupViewProps extends BasicProps {
    group: KnownPermissionGroup
}

export class KnownPermissionGroupView extends Component<KnownPermissionGroupViewProps> {
    render() {
        const { group, location, canManipulate } = this.props
        return <ul>
            <li key="type"><EnumSelectView<PermissionGroupType>
                theEnum={PermissionGroupType}
                defaultValue={group.type}
                onChangeCreator={undefined}
                location={[...location, "type"]}
                canManipulate={false}
            /></li>
            <li key="ticker">Ticker: {group.ticker}</li>
            <li key="uuid">Uuid: {group.uuid}</li>
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
            <li key="current">
                Group: <KnownPermissionGroupView
                    group={group.current}
                    location={[...location, "current"]}
                    canManipulate={canManipulate}
                />
            </li>
            <li key="exists">Exists: {group.exists ? "true" : "false"}</li>
            <li key="permissions">
                Permissions: <PermissionsView
                    permissions={group.permissions}
                    location={[...location, "permissions"]}
                    canManipulate={false}
                />
            </li>
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
                .map((group: KnownPermissionGroupInfoJson, groupIndex: number) => <li key={groupIndex}>
                    <KnownPermissionGroupInfoView
                        group={group}
                        location={[...location, groupIndex]}
                        canManipulate={canManipulate} />
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
            <li key="id">Id: {group.id.toString(10)}</li>
            <li key="ticker">Ticker: {group.ticker}</li>
            <li key="uuid">Uuid: {group.uuid}</li>
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
            <li key="current">
                Group: <CustomPermissionGroupView
                    group={group.current}
                    location={[...location, "current"]}
                    canManipulate={canManipulate}
                />
            </li>
            <li key="exists">Exists: {group.exists ? "true" : "false"}</li>
            <li key="permissions">
                Permissions: <PermissionsView
                    permissions={group.permissions}
                    location={[...location, "permissions"]}
                    canManipulate={false}
                />
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
                .map((group: CustomPermissionGroupInfoJson, groupIndex: number) => <li key={groupIndex}>
                    <CustomPermissionGroupInfoView
                        group={group}
                        location={[...location, groupIndex]}
                        canManipulate={canManipulate} />
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
        return <ol>
            <li key="known">
                Known:
                <KnownPermissionGroupInfosView
                    groups={groups.known}
                    location={[...location, "known"]}
                    canManipulate={canManipulate} />
            </li>
            <li key="custom">
                Custom:
                <CustomPermissionGroupInfosView
                    groups={groups.custom}
                    location={[...location, "custom"]}
                    canManipulate={canManipulate} />
            </li>
        </ol>
    }
}
