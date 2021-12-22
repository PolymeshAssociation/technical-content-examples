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
    TransactionQueue,
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
    assertUnreachable,
    isCustomPermissionGroup,
    isKnownPermissionGroup,
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
                Transaction Groups:&nbsp;
                <TxGroupsView
                    txGroups={permissions.transactionGroups}
                    onTxGroupsChanged={this.onTxGroupsChanged}
                    canManipulate={canManipulate}
                />
            </li>
            <li key="transactions">
                Transactions:&nbsp;
                <TransactionPermissionsView
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
            <li key="type">
                Type:&nbsp;
                <EnumSelectView<PermissionGroupType>
                    theEnum={PermissionGroupType}
                    defaultValue={group.type}
                    onChange={async () => { }}
                    canManipulate={false}
                />
            </li>
            <li key="ticker">Ticker:&nbsp;{group.ticker}</li>
            <li key="uuid">
                Uuid:&nbsp;
                <LongHexView value={group.uuid} lut={null} />
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
                Group:&nbsp;
                <KnownPermissionGroupView
                    group={group.current}
                />
            </li>
            <li key="exists">
                Exists:&nbsp;
                <input
                    checked={group.exists}
                    type="checkbox"
                    disabled={true}
                />
            </li>
            <li key="permissions">
                Permissions:&nbsp;
                <GroupPermissionsView
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
    groupPicked: PermissionGroup | null
    onGroupPicked: OnPermissionGroupPicked
    canManipulate: boolean
}

export class KnownPermissionGroupInfosView extends Component<KnownPermissionGroupInfosViewProps> {
    onGroupPicked = (group: PermissionGroupInfoJson<KnownPermissionGroup>) => () => this.props.onGroupPicked(group)

    render() {
        const { groups, groupPicked, canManipulate } = this.props
        if (groups.length === 0) return <span> None</span>
        return <ol>{
            groups
                .map((group: PermissionGroupInfoJson<KnownPermissionGroup>, index: number) => {
                    const canPick: boolean = canManipulate && !groupPicked?.isEqual(group.current)
                    return <li key={index}>
                        <button
                            className="submit"
                            onClick={this.onGroupPicked(group)}
                            disabled={!canPick}>
                            Pick it
                        </button>
                        <KnownPermissionGroupInfoView
                            group={group} />
                    </li>
                })
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

    componentDidUpdate(prevProps: Readonly<CustomPermissionGroupInfoViewProps>, _: Readonly<CustomPermissionGroupInfoViewState>): void {
        if (!prevProps.group.current.isEqual(this.props.group.current)) this.setState(this.getStateFromProps(this.props))
    }

    getStateFromProps = (props: CustomPermissionGroupInfoViewProps) => this.getStateFromNewPerms(props.group.permissions)
    getStateFromNewPerms = (perms: GroupPermissions) => ({
        params: {
            transactionGroups: perms.transactionGroups,
            transactions: perms.transactions,

        },
        modified: false,
    })

    onPermissionsChanged = (perms: GroupPermissions) => this.setState({
        params: perms,
        modified: true,
    })
    onUpdatePerms = async () => {
        const groupId: BigNumber = this.props.group.current.id
        const queue: TransactionQueue = await this.props.group.current.setPermissions(this.getUpdatePermParams())
        this.setState({ modified: false })
        await queue.run()
        const updatedGroup = await this.props.permissions.getGroup({ id: groupId })
        this.setState(this.getStateFromNewPerms(await updatedGroup.getPermissions()))
        this.props.onGroupUpdated(updatedGroup)
    }
    getUpdatePermParams = (): SetGroupPermissionsParams => ({
        permissions: this.state.params,
    })

    render() {
        const { params, modified } = this.state
        const { group, canManipulate } = this.props
        const canUpdate: boolean = canManipulate && modified
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
                    disabled={!canUpdate}>
                    Update
                </button>
                <GroupPermissionsView
                    permissions={params}
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
    groupPicked: PermissionGroup | null
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
        return <ol>{
            groups
                .map((group: PermissionGroupInfoJson<CustomPermissionGroup>, index: number) => {
                    const canPick: boolean = canManipulate && group.exists && !groupPicked?.isEqual(group.current)
                    return <li key={index}>
                        <button
                            className="submit"
                            onClick={this.onGroupPicked(group)}
                            disabled={!canPick}>
                            Pick it
                        </button>
                        <CustomPermissionGroupInfoView
                            permissions={permissions}
                            group={group}
                            onGroupUpdated={this.onGroupUpdated(index)}
                            canManipulate={canManipulate} />
                    </li>
                })
        }</ol>
    }
}

export interface PermissionGroupViewProps {
    group: KnownPermissionGroup | CustomPermissionGroup
}

export class PermissionGroupView extends Component<PermissionGroupViewProps> {
    render() {
        const { group } = this.props
        if (isKnownPermissionGroup(group)) return <KnownPermissionGroupView
            group={group}
        />
        if (isCustomPermissionGroup(group)) return <CustomPermissionGroupView
            group={group}
        />
        assertUnreachable(group)
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
                    canManipulate={canManipulate} />
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
    modified: boolean
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
            },
            modified: false,
        }
    }

    onTxGroupsChanged = (groups: TxGroup[]): void => this.setState({
        txGroups: groups,
        modified: true,
    })
    onTxPermissionsChanged = (perms: TransactionPermissions): void => this.setState({
        transactions: perms,
        modified: true,
    })

    onCreateCustomGroup = async (): Promise<void> => {
        const params: CreateGroupParams = this.getCreateParams()
        const queue = await this.props.permissions.createGroup(params)
        this.setState({ modified: false })
        const group: CustomPermissionGroup = await queue.run()
        this.props.onGroupCreated(group)
    }
    getCreateParams = (): CreateGroupParams => ({
        permissions: {
            transactionGroups: this.state.txGroups,
            transactions: this.state.transactions,
        },
    })

    render() {
        const { txGroups, transactions, modified } = this.state
        const { cardStyle, canManipulate } = this.props
        const canCreate: boolean = canManipulate && modified
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
                disabled={!canCreate}>
                Create custom group
            </button>

        </fieldset>
    }
}