import { GroupPermissions } from "@polymathnetwork/polymesh-sdk/types";
import { PermissionsInfoJson } from "../../types";

export type OnGroupPermissionsChanged = (permissions: GroupPermissions) => void
export type OnPermissionsChanged = (permissionsInfo: PermissionsInfoJson) => void