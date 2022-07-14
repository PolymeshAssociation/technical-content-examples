import { AgentWithGroup, GroupPermissions, Permissions, SecurityToken } from "@polymathnetwork/polymesh-sdk/types";
import { getEmptyPermissionsInfoJson, PermissionGroupsInfoJson, PermissionsInfoJson } from "../../types";
import { fetchPermissionGroups } from "./GroupHandlers";

export type OnPermissionsChanged = (permissions: Permissions) => void
export type OnGroupPermissionsChanged = (permissions: GroupPermissions) => void
export type OnPermissionsInfoJsonChanged = (permissionsInfo: PermissionsInfoJson) => void

export const fetchPermissions = async (token: SecurityToken): Promise<PermissionsInfoJson> => {
    if (token === null) return getEmptyPermissionsInfoJson()
    const
        [
            groups,
            agents,
        ]: [
                PermissionGroupsInfoJson,
                AgentWithGroup[],
            ] = await Promise.all([
                token.permissions.getGroups().then(fetchPermissionGroups),
                token.permissions.getAgents(),
            ])
    return {
        original: token.permissions,
        groups: groups,
        agents: agents,
    }
}
