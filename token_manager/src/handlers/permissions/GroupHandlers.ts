import { CustomPermissionGroup } from "@polymathnetwork/polymesh-sdk/api/entities/CustomPermissionGroup";
import { KnownPermissionGroup } from "@polymathnetwork/polymesh-sdk/api/entities/KnownPermissionGroup";
import { PermissionGroupInfoJson, PermissionGroupsInfo } from "../../types";

export type OnPermissionGroupPicked = (group: PermissionGroupInfoJson<KnownPermissionGroup | CustomPermissionGroup>) => void
export type OnCustomGroupCreated = (group: CustomPermissionGroup) => void
export type OnCustomGroupUpdated = (group: CustomPermissionGroup) => void
export type OnCustomGroupsUpdated = (groups: CustomPermissionGroup[]) => void
export type OnGroupsInfoUpdated = (groupInfo: PermissionGroupsInfo) => void