import { ModuleName, TransactionPermissions, TxGroup, TxTag, TxTags } from "@polymathnetwork/polymesh-sdk/types"

export type OnTxGroupsChanged = (groups: TxGroup[]) => void
export type OnTxTagChanged = (txTag: TxTag) => void
export type OnModuleNameChanged = (moduleName: ModuleName) => void
export type OnTxTagOrModuleNamesChanged = (newList: (ModuleName | TxTag)[]) => void
export type OnTxTagsChanged = (newList: TxTag[]) => void
export type OnTransactionPermissionsChanged = (perms: TransactionPermissions) => void

export const getTxTagEnum = (tag: TxTag): TxTagParsed => {
    const [groupName, actionName]: string[] = tag.split(".")
    const groupEnum = TxTags[groupName]
    return {
        groupName: groupName,
        actionName: `${actionName.charAt(0).toUpperCase()}${actionName.slice(1)}`,
        groupEnum: groupEnum,
    }
}

export interface TxTagParsed {
    groupName: string // key of TxTags
    actionName: string
    groupEnum: any // a sub-enum of TxTag
}
