import { CustomPermissionGroup } from "@polymathnetwork/polymesh-sdk/api/entities/CustomPermissionGroup";
import { KnownPermissionGroup } from "@polymathnetwork/polymesh-sdk/api/entities/KnownPermissionGroup";
import { GroupPermissions } from "@polymathnetwork/polymesh-sdk/types";
import { PermissionGroupInfoJson, PermissionGroupsInfo, PermissionGroupsInfoJson } from "../../types";

export type OnPermissionGroupPicked = (group: PermissionGroupInfoJson<KnownPermissionGroup | CustomPermissionGroup>) => void
export type OnCustomGroupCreated = (group: CustomPermissionGroup) => void
export type OnCustomGroupUpdated = (group: CustomPermissionGroup) => void
export type OnCustomGroupsUpdated = (groups: CustomPermissionGroup[]) => void
export type OnGroupsInfoUpdated = (groupInfo: PermissionGroupsInfo) => void

export const fetchPermissionGroup = async <GroupType extends KnownPermissionGroup | CustomPermissionGroup>(group: GroupType): Promise<PermissionGroupInfoJson<GroupType>> => {
    const [permissions, exists]: [GroupPermissions, boolean] = await Promise.all([group.getPermissions(), /*group.exists()*/true]) // TODO put back
    return {
        current: group,
        permissions: permissions,
        exists: exists,
    }
}

export const fetchPermissionGroups = async (groups: PermissionGroupsInfo): Promise<PermissionGroupsInfoJson> => {
    const [known, custom]: [PermissionGroupInfoJson<KnownPermissionGroup>[], PermissionGroupInfoJson<CustomPermissionGroup>[]] = await Promise.all([
        Promise.all(groups.known.map(fetchPermissionGroup)),
        Promise.all(groups.custom.map(fetchPermissionGroup)),
    ])
    return {
        known: known,
        custom: custom,
    }
}
