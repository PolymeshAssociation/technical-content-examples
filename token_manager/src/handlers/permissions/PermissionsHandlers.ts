import { GroupPermissions, SecurityToken } from "@polymathnetwork/polymesh-sdk/types";
import { getEmptyPermissionsInfoJson, PermissionsInfoJson } from "../../types";
import { fetchPermissionAgents } from "./AgentHandlers";
import { fetchPermissionGroups } from "./GroupHandlers";

export type OnGroupPermissionsChanged = (permissions: GroupPermissions) => void
export type OnPermissionsInfoJsonChanged = (permissionsInfo: PermissionsInfoJson) => void

export const fetchPermissions = async (token: SecurityToken): Promise<PermissionsInfoJson> => token === null
    ? getEmptyPermissionsInfoJson()
    : {
        original: token.permissions,
        groups: await fetchPermissionGroups(await token.permissions.getGroups()),
        agents: await fetchPermissionAgents(await token.permissions.getAgents()),
    }
