import { SectionPermissions } from "@polymathnetwork/polymesh-sdk/types";

export type OnSectionPermissionsChanged<T> = (value: SectionPermissions<T>) => void