import { AssetTx, SystemTx } from "@polymathnetwork/polymesh-sdk/polkadot/types"
import {
    ModuleName,
    PermissionType,
    TransactionPermissions,
    TxGroup,
    TxTag,
    TxTags,
} from "@polymathnetwork/polymesh-sdk/types"
import { Component } from "react"
import {
    getTxTagEnum,
    OnModuleNameChanged,
    OnTransactionPermissionsChanged,
    OnTxGroupsChanged,
    OnTxTagChanged,
    OnTxTagOrModuleNamesChanged,
    OnTxTagsChanged,
} from "../../handlers/permissions/TransactionPermissionHandlers"
import { assertUnreachable, isModuleNameNotTxTag, isTxTagNotModuleName } from "../../types"
import { EnumSelectView } from "../EnumView"

export interface TxGroupsViewProps {
    txGroups: TxGroup[]
    onTxGroupsChanged: OnTxGroupsChanged
    canManipulate: boolean
}

export class TxGroupsView extends Component<TxGroupsViewProps> {

    onAddTxGroup = () => this.props.onTxGroupsChanged([
        TxGroup.AdvancedTokenManagement,
        ...this.props.txGroups,
    ])
    onRemoveTxGroup = (index: number) => () => {
        const list: TxGroup[] = this.props.txGroups
        list.splice(index, 1)
        this.props.onTxGroupsChanged(list)
    }
    onTxGroupChanged = (index: number) => async (e) => {
        const list: TxGroup[] = this.props.txGroups
        list[index] = e.target.value
        this.props.onTxGroupsChanged(list)
    }

    render() {
        const { txGroups, canManipulate } = this.props
        const addButton: JSX.Element = <button
            className="submit add-tx-group"
            onClick={this.onAddTxGroup}
            disabled={!canManipulate}>
            Add 1 TxGroup
        </button>
        if (txGroups.length === 0) return <div>None&nbsp;{addButton}</div>
        return <div>
            {addButton}
            <ol>{txGroups
                .map((txGroup: TxGroup, index: number) => <li key={index}>
                    <button className="submit remove-tx-group"
                        onClick={this.onRemoveTxGroup(index)}
                        disabled={!canManipulate}>
                        Remove
                    </button>
                    &nbsp;
                    <EnumSelectView<TxGroup>
                        theEnum={TxGroup}
                        defaultValue={txGroup}
                        onChange={this.onTxGroupChanged(index)}
                        canManipulate={canManipulate}
                    />
                </li>)
            }</ol>
        </div>
    }
}

export interface ModuleNameViewProps {
    value: ModuleName
    onModuleNameChanged: OnModuleNameChanged
    canManipulate: boolean
}

export class ModuleNameView extends Component<ModuleNameViewProps> {

    onModuleNameChanged = async (e) => this.props.onModuleNameChanged(e.target.value)

    render() {
        const { value, canManipulate } = this.props
        const capitalized: string = `${value.charAt(0).toUpperCase()}${value.slice(1)}`
        return <EnumSelectView
            defaultValue={capitalized}
            theEnum={ModuleName}
            onChange={this.onModuleNameChanged}
            canManipulate={canManipulate}
        />
    }
}

interface TxTagViewState {
    txTagsKeys: string[]
}

export interface TxTagViewProps {
    value: TxTag
    onTxTagChanged: OnTxTagChanged
    canManipulate: boolean
}

export class TxTagView extends Component<TxTagViewProps, TxTagViewState> {

    constructor(props: TxTagViewProps) {
        super(props)
        this.state = {
            txTagsKeys: Object.keys(TxTags),
        }
    }

    onTxTagGroupChanged = (e) => {
        const nextEnum = TxTags[e.target.value]
        const firstOfNextEnum: TxTag = Object.values(nextEnum)[0] as TxTag
        this.props.onTxTagChanged(firstOfNextEnum)
    }
    onTxTagChanged = async (e) => {
        const value = getTxTagEnum(this.props.value).groupEnum[e.target.value]
        this.props.onTxTagChanged(value)
    }

    render() {
        const { txTagsKeys } = this.state
        const { value, canManipulate } = this.props
        const { groupName, actionName, groupEnum } = getTxTagEnum(value)
        return <div>
            <select
                value={groupName}
                onChange={this.onTxTagGroupChanged}
                disabled={!canManipulate}>
                {txTagsKeys.map((group: string) => <option key={group}>{group}</option>)}
            </select>
            &nbsp;
            <EnumSelectView
                theEnum={groupEnum}
                defaultValue={actionName}
                onChange={this.onTxTagChanged}
                canManipulate={canManipulate}
            />
        </div>
    }
}

export interface TxTagsViewProps {
    values: TxTag[]
    onTxTagsChanged: OnTxTagsChanged
    canManipulate: boolean
}

export class TxTagsView extends Component<TxTagsViewProps> {

    onAddTxTag = () => this.props.onTxTagsChanged([
        SystemTx.FillBlock,
        ...this.props.values,
    ])
    onRemoveTxTag = (index: number) => () => {
        const list = this.props.values
        list.splice(index, 1)
        this.props.onTxTagsChanged(list)
    }
    onTxTagChanged = (index: number) => (txTag: TxTag) => {
        const list = this.props.values
        list[index] = txTag
        this.props.onTxTagsChanged(list)
    }
    render() {
        const { values, canManipulate } = this.props
        const addButton: JSX.Element = <button
            className="submit add-tx-tag"
            onClick={this.onAddTxTag}
            disabled={!canManipulate}>
            Add 1 TxTag
        </button>
        if (typeof values === "undefined" || values.length < 1) return <div>None&nbsp;{addButton}</div>
        return <div>
            {addButton}&nbsp;
            <ol>{values
                .map((tag: TxTag, index: number) => <li key={index}>
                    <button
                        className="submit delete-tx-tag"
                        onClick={this.onRemoveTxTag(index)}
                        disabled={!canManipulate}>
                        Remove
                    </button>
                    &nbsp;
                    <TxTagView
                        value={tag}
                        onTxTagChanged={this.onTxTagChanged(index)}
                        canManipulate={canManipulate}
                    />
                </li>)
            }</ol>
        </div>
    }
}

export class TxTagOrModuleNameViewProps {
    value: ModuleName | TxTag
    onModuleNameChanged: OnModuleNameChanged
    onTxTagChanged: OnTxTagChanged
    canManipulate: boolean
}

export class TxTagOrModuleNameView extends Component<TxTagOrModuleNameViewProps> {
    render() {
        const { value, onModuleNameChanged, onTxTagChanged, canManipulate } = this.props
        if (isTxTagNotModuleName(value)) return <TxTagView
            value={value}
            onTxTagChanged={onTxTagChanged}
            canManipulate={canManipulate}
        />
        if (isModuleNameNotTxTag(value)) return <ModuleNameView
            value={value}
            onModuleNameChanged={onModuleNameChanged}
            canManipulate={canManipulate}
        />
        assertUnreachable(value)
    }
}

enum ModuleNameOrTxTag {
    ModuleName = "ModuleName",
    TxTag = "TxTag",
}

export class TxTagOrModuleNamesViewProps {
    values: (ModuleName | TxTag)[]
    onTxTagOrModuleNamesChanged: OnTxTagOrModuleNamesChanged
    canManipulate: boolean
}

export class TxTagOrModulesNameView extends Component<TxTagOrModuleNamesViewProps> {

    onAddTxTagOrModuleName = () => {
        const list: (ModuleName | TxTag)[] = this.props.values
        this.props.onTxTagOrModuleNamesChanged([ModuleName.Asset, ...list])
    }
    onTypeChanged = (index: number) => async (e) => {
        const list: (ModuleName | TxTag)[] = this.props.values
        const newType: ModuleNameOrTxTag = e.target.value
        switch (newType) {
            case ModuleNameOrTxTag.ModuleName:
                list[index] = ModuleName.Asset
                return this.props.onTxTagOrModuleNamesChanged(list)
            case ModuleNameOrTxTag.TxTag:
                list[index] = AssetTx.AcceptAssetOwnershipTransfer
                return this.props.onTxTagOrModuleNamesChanged(list)
            default: assertUnreachable(newType)
        }
    }
    onModuleNameChanged = (index: number) => (moduleName: ModuleName | TxTag) => {
        const list: (ModuleName | TxTag)[] = this.props.values
        list[index] = moduleName
        this.props.onTxTagOrModuleNamesChanged(list)
    }
    onRemoveTxTagOrModuleName = (index: number) => () => {
        const list: (ModuleName | TxTag)[] = this.props.values
        list.splice(index, 1)
        this.props.onTxTagOrModuleNamesChanged(list)
    }

    render() {
        const { values, canManipulate } = this.props
        const addButton: JSX.Element = <button
            className="submit add-tx-tag-or-module-name"
            onClick={this.onAddTxTagOrModuleName}
            disabled={!canManipulate}>
            Add 1
        </button>
        if (values.length === 0) return <div>There are no TxTags or ModuleNames&nbsp;{addButton}</div>
        return <div>
            {addButton}
            <ol>
                {values.map((value: ModuleName | TxTag, index: number) => {
                    const type: string = isModuleNameNotTxTag(value) ? "ModuleName" : isTxTagNotModuleName(value) ? "TxTag" : assertUnreachable(value)
                    return <li key={index}>
                        <button
                            className="submit delete-tx-tag-or-module-name"
                            onClick={this.onRemoveTxTagOrModuleName(index)}
                            disabled={!canManipulate}>
                            Remove
                        </button>
                        &nbsp;
                        <EnumSelectView
                            theEnum={ModuleNameOrTxTag}
                            defaultValue={type}
                            onChange={this.onTypeChanged(index)}
                            canManipulate={canManipulate}
                        />
                        &nbsp;
                        <TxTagOrModuleNameView
                            value={value}
                            onModuleNameChanged={this.onModuleNameChanged(index)}
                            onTxTagChanged={this.onModuleNameChanged(index)}
                            canManipulate={canManipulate}
                        />
                    </li>
                })}
            </ol>
        </div>
    }
}

export interface TransactionPermissionsViewProps {
    transactions: TransactionPermissions | null
    onTransactionPermissionsChanged: OnTransactionPermissionsChanged
    canManipulate: boolean
}

export class TransactionPermissionsView extends Component<TransactionPermissionsViewProps> {

    onValueTxTagOrModuleNamesChanged = (list: (ModuleName | TxTag)[]) => {
        this.props.onTransactionPermissionsChanged({
            ...this.props.transactions,
            values: list,
        })
    }
    onPermissionTypeChanged = async (e) => {
        const type: PermissionType = e.target.value
        this.props.onTransactionPermissionsChanged({
            ...this.props.transactions,
            type: type,
        })
    }
    onExceptionTxTagsChanged = (list: TxTag[]) => this.props.onTransactionPermissionsChanged({
        ...this.props.transactions,
        exceptions: list,
    })

    render() {
        const { transactions, canManipulate } = this.props
        if (transactions === null) return <div>null</div>
        return <ul>
            <li key="type">
                Type:&nbsp;
                <EnumSelectView<PermissionType>
                    theEnum={PermissionType}
                    defaultValue={transactions.type}
                    onChange={this.onPermissionTypeChanged}
                    canManipulate={canManipulate}
                />
            </li>
            <li key="values">
                Values:&nbsp;
                <TxTagOrModulesNameView
                    values={transactions.values}
                    onTxTagOrModuleNamesChanged={this.onValueTxTagOrModuleNamesChanged}
                    canManipulate={canManipulate}
                />
            </li>
            <li key="exceptions">
                Exceptions:&nbsp;
                <TxTagsView
                    values={transactions.exceptions}
                    onTxTagsChanged={this.onExceptionTxTagsChanged}
                    canManipulate={canManipulate}
                />
            </li>
        </ul>
    }
}
