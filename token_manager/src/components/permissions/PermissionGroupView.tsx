import { BigNumber } from "@polymathnetwork/polymesh-sdk";
import { Permissions } from "@polymathnetwork/polymesh-sdk/api/entities/SecurityToken/Permissions"
import {
    CreateGroupParams,
    CustomPermissionGroup,
    KnownPermissionGroup,
    PermissionGroup,
    SetGroupPermissionsParams,
} from "@polymathnetwork/polymesh-sdk/internal";
import {
    GroupPermissions,
    PermissionGroupType,
    PermissionType,
    TransactionPermissions,
    TxGroup,
} from "@polymathnetwork/polymesh-sdk/types";
import React, { Component } from "react";
import {
    OnCustomGroupCreated,
    OnCustomGroupUpdated,
    OnCustomGroupsUpdated,
    OnPermissionGroupPicked,
    OnGroupsInfoUpdated,
} from "../../handlers/permissions/GroupHandlers";
import { OnGroupPermissionsChanged } from "../../handlers/permissions/PermissionsHandlers";
import {
    PermissionGroupInfoJson,
    PermissionGroupsInfoJson
} from "../../types";
import { EnumSelectView } from "../EnumView";
import { LongHexView } from "../LongHexView";
import { TxGroupsView, TransactionPermissionsView } from "./TransactionPermissionView";

export interface GroupPermissionsViewProps {
    permissions: GroupPermissions
    onPermissionsChanged: OnGroupPermissionsChanged
    canManipulate: boolean
}

export class GroupPermissionsView extends Component<GroupPermissionsViewProps> {

    onTxGroupsChanged = (groups: TxGroup[]) => this.props.onPermissionsChanged({
        ...this.props.permissions,
        transactionGroups: groups,
    })
    onTransactionPermissionsChanged = (perms: TransactionPermissions) => this.props.onPermissionsChanged({
        ...this.props.permissions,
        transactions: perms,
    })
    render() {
        const { permissions, canManipulate } = this.props
        return <ul>
            <li key="transactionGroups">
                Transaction Groups: <TxGroupsView
                    txGroups={permissions.transactionGroups}
                    onTxGroupsChanged={this.onTxGroupsChanged}
                    canManipulate={canManipulate}
                />
            </li>
            <li key="transactions">
                Transactions: <TransactionPermissionsView
                    transactions={permissions.transactions}
                    onTransactionPermissionsChanged={this.onTransactionPermissionsChanged}
                    canManipulate={canManipulate}
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
    group: PermissionGroupInfoJson<KnownPermissionGroup>
}

export class KnownPermissionGroupInfoView extends Component<KnownPermissionGroupInfoViewProps> {
    render() {
        const { group } = this.props
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
                    onPermissionsChanged={undefined}
                    canManipulate={false}
                />
            </li>
        </ul>
    }
}

export interface KnownPermissionGroupInfosViewProps {
    groups: PermissionGroupInfoJson<KnownPermissionGroup>[]
    groupPicked: PermissionGroup
    onGroupPicked: OnPermissionGroupPicked
    canManipulate: boolean
}

export class KnownPermissionGroupInfosView extends Component<KnownPermissionGroupInfosViewProps> {
    onGroupPicked = (group: PermissionGroupInfoJson<KnownPermissionGroup>) => (e) => this.props.onGroupPicked(group)

    render() {
        const { groups, groupPicked, canManipulate } = this.props
        if (groups.length === 0) return <span> None</span>
        else return <ol>{
            groups
                .map((group: PermissionGroupInfoJson<KnownPermissionGroup>, groupIndex: number) => <li key={groupIndex}>
                    <button
                        className="submit"
                        onClick={this.onGroupPicked(group)}
                        disabled={!canManipulate || group.current === groupPicked}>
                        Pick it
                    </button>
                    <KnownPermissionGroupInfoView
                        group={group} />
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

interface CustomPermissionGroupInfoViewState {
    groupId: BigNumber
    params: GroupPermissions
    modified: boolean
}

export interface CustomPermissionGroupInfoViewProps {
    permissions: Permissions
    group: PermissionGroupInfoJson<CustomPermissionGroup>
    onGroupUpdated: OnCustomGroupUpdated
    canManipulate: boolean
}

export class CustomPermissionGroupInfoView extends Component<CustomPermissionGroupInfoViewProps, CustomPermissionGroupInfoViewState> {
    constructor(props: CustomPermissionGroupInfoViewProps) {
        super(props)
        this.state = this.getStateFromProps(props)
    }

    componentDidUpdate(prevProps: Readonly<CustomPermissionGroupInfoViewProps>, prevState: Readonly<CustomPermissionGroupInfoViewState>, snapshot?: any): void {
        if (prevProps.group.current.id.toString(10) !== prevState.groupId.toString(10)) this.setState(this.getStateFromProps(this.props))
    }

    getStateFromProps = (props: CustomPermissionGroupInfoViewProps) => ({
        groupId: props.group.current.id,
        params: {
            transactionGroups: props.group.permissions.transactionGroups,
            transactions: props.group.permissions.transactions,

        },
        modified: false,
    })

    onPermissionsChanged = (perms: GroupPermissions) => this.setState({
        params: perms,
        modified: true,
    })
    onUpdatePerms = async () => {
        const groupId: BigNumber = this.state.groupId
        await (await this.props.group.current.setPermissions(this.getUpdatePermParams())).run()
        this.props.onGroupUpdated(await this.props.permissions.getGroup({ id: groupId }))
    }
    getUpdatePermParams = (): SetGroupPermissionsParams => ({
        permissions: this.state.params,
    })

    render() {
        const { params } = this.state
        const { transactions, transactionGroups } = params
        const { group, canManipulate } = this.props
        return <ul>
            <li key="current">
                Group: <CustomPermissionGroupView
                    group={group.current}
                />
            </li>
            <li key="exists">Exists: {group.exists ? "true" : "false"}</li>
            <li key="permissions">
                Permissions:&nbsp;
                <button
                    className="submit update-permissions"
                    onClick={this.onUpdatePerms}
                    disabled={!canManipulate}>
                    Update
                </button>
                <GroupPermissionsView
                    permissions={{
                        transactionGroups: transactionGroups,
                        transactions: transactions,
                    }}
                    onPermissionsChanged={this.onPermissionsChanged}
                    canManipulate={canManipulate}
                />
            </li>
        </ul>
    }
}

export interface CustomPermissionGroupInfosViewProps {
    permissions: Permissions
    groups: PermissionGroupInfoJson<CustomPermissionGroup>[]
    groupPicked: PermissionGroup
    onGroupPicked: OnPermissionGroupPicked
    onGroupsUpdated: OnCustomGroupsUpdated
    canManipulate: boolean
}

export class CustomPermissionGroupInfosView extends Component<CustomPermissionGroupInfosViewProps> {

    onGroupPicked = (group: PermissionGroupInfoJson<CustomPermissionGroup>) => (e) => this.props.onGroupPicked(group)

    onGroupUpdated = (index: number) => (group: CustomPermissionGroup) => {
        const list = this.props.groups.map((groupInfo: PermissionGroupInfoJson<CustomPermissionGroup>) => groupInfo.current)
        list[index] = group
        this.props.onGroupsUpdated(list)
    }

    render() {
        const { permissions, groups, groupPicked, canManipulate } = this.props
        if (groups.length === 0) return <span> None</span>
        else return <ol>{
            groups
                .map((group: PermissionGroupInfoJson<CustomPermissionGroup>, index: number) => <li key={index}>
                    <button
                        className="submit"
                        onClick={this.onGroupPicked(group)}
                        disabled={!canManipulate || !group.exists || group.current === groupPicked}>
                        Pick it
                    </button>
                    <CustomPermissionGroupInfoView
                        permissions={this.props.permissions}
                        group={group}
                        onGroupUpdated={this.onGroupUpdated(index)}
                        canManipulate={canManipulate} />
                </li>)
        }</ol>
    }
}

interface PermissionGroupsInfoViewState {
    groupPicked: PermissionGroup | null
}

export interface PermissionGroupsInfoViewProps {
    permissions: Permissions
    groups: PermissionGroupsInfoJson
    onGroupPicked: OnPermissionGroupPicked
    onGroupsInfoUpdated: OnGroupsInfoUpdated
    canManipulate: boolean
}

export class PermissionGroupsInfoView extends Component<PermissionGroupsInfoViewProps, PermissionGroupsInfoViewState> {
    constructor(props: PermissionGroupsInfoViewProps) {
        super(props)
        this.state = {
            groupPicked: null,
        }
    }

    onGroupPicked = (group: PermissionGroupInfoJson<KnownPermissionGroup | CustomPermissionGroup>): void => {
        this.setState({
            groupPicked: group.current,
        })
        this.props.onGroupPicked(group)
    }
    onCustomGroupsUpdated = (customGroups: CustomPermissionGroup[]) => this.props.onGroupsInfoUpdated({
        known: this.props.groups.known.map((groupInfo: PermissionGroupInfoJson<KnownPermissionGroup>) => groupInfo.current),
        custom: customGroups,
    })

    render() {
        const { groupPicked } = this.state
        const { permissions, groups, canManipulate } = this.props
        if (typeof groups === "undefined" || groups === null) return <div>No permission groups</div>
        return <ol>
            <li key="known">
                Known:
                <KnownPermissionGroupInfosView
                    groups={groups.known}
                    groupPicked={groupPicked}
                    onGroupPicked={this.onGroupPicked}
                    canManipulate={false} />
            </li>
            <li key="custom">
                Custom:
                <CustomPermissionGroupInfosView
                    permissions={permissions}
                    groups={groups.custom}
                    groupPicked={groupPicked}
                    onGroupPicked={this.onGroupPicked}
                    onGroupsUpdated={this.onCustomGroupsUpdated}
                    canManipulate={canManipulate} />
            </li>
        </ol>
    }
}

interface NewCustomPermissionGroupViewState {
    txGroups: TxGroup[]
    transactions: TransactionPermissions
}

export interface NewCustomPermissionGroupViewProps {
    permissions: Permissions
    cardStyle: any
    onGroupCreated: OnCustomGroupCreated
    canManipulate: boolean
}

export class NewCustomPermissionGroupView extends Component<NewCustomPermissionGroupViewProps, NewCustomPermissionGroupViewState> {
    constructor(props: NewCustomPermissionGroupViewProps) {
        super(props)
        this.state = {
            txGroups: [],
            transactions: {
                type: PermissionType.Include,
                values: [],
                exceptions: [],
            }
        }
    }

    onTxGroupsChanged = (groups: TxGroup[]): void => this.setState({ txGroups: groups })
    onTxPermissionsChanged = (perms: TransactionPermissions) => this.setState({ transactions: perms })

    onCreateCustomGroup = async (): Promise<void> => {
        const params: CreateGroupParams = this.getCreateParams()
        const group: CustomPermissionGroup = await (await this.props.permissions.createGroup(params)).run()
        this.props.onGroupCreated(group)
    }
    getCreateParams = (): CreateGroupParams => ({
        permissions: {
            transactionGroups: this.state.txGroups,
            transactions: this.state.transactions,
        },
    })

    render() {
        const { txGroups, transactions } = this.state
        const { cardStyle, canManipulate } = this.props
        return <fieldset className={cardStyle}>
            <legend>Custom group to create</legend>

            <ul>
                <li key="groups">
                    Transaction groups:&nbsp;
                    <TxGroupsView
                        txGroups={txGroups}
                        onTxGroupsChanged={this.onTxGroupsChanged}
                        canManipulate={canManipulate}
                    />
                </li>

                <li key="txs">
                    Transactions:&nbsp;
                    <TransactionPermissionsView
                        transactions={transactions}
                        onTransactionPermissionsChanged={this.onTxPermissionsChanged}
                        canManipulate={canManipulate}
                    />
                </li>
            </ul>

            <button
                className="submit create-custom-group"
                onClick={this.onCreateCustomGroup}
                disabled={!canManipulate}>
                Create custom group
            </button>

        </fieldset>
    }
}