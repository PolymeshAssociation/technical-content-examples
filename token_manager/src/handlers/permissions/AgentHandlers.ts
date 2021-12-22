import { CustomPermissionGroup } from "@polymathnetwork/polymesh-sdk/api/entities/CustomPermissionGroup"
import { KnownPermissionGroup } from "@polymathnetwork/polymesh-sdk/api/entities/KnownPermissionGroup"
import { AssetTx } from "@polymathnetwork/polymesh-sdk/polkadot/types"
import {
    AgentWithGroup,
    GroupPermissions,
    Identity,
    ModuleName,
    PermissionGroupType,
    TxTag,
} from "@polymathnetwork/polymesh-sdk/types"
import {
    AgentInfoJson,
    AgentsInfoJson,
    isCustomPermissionGroup,
    isKnownPermissionGroup,
    PermissionGroupInfoJson,
} from "../../types"

export type OnAgentChanged = (agent: Identity) => void

export const patternAgentTags: { [key: string]: (TxTag | ModuleName)[] } = {
    issuance: [
        AssetTx.ControllerTransfer,
        AssetTx.Issue,
        AssetTx.Redeem,
        ModuleName.Sto
    ]
}

export const isOwner = (group: KnownPermissionGroup | CustomPermissionGroup): boolean =>
    isKnownPermissionGroup(group) && group.type === PermissionGroupType.Full

export const isIssuanceAgentGroup = (group: PermissionGroupInfoJson<KnownPermissionGroup | CustomPermissionGroup>): boolean =>
    (isKnownPermissionGroup(group.current) && group.current.type === PermissionGroupType.PolymeshV1Pia) ||
    (isCustomPermissionGroup(group.current) && areIssuanceAgentGroupPermissions(group.permissions))

export const areIssuanceAgentGroupPermissions = (permissions: GroupPermissions): boolean =>
    new Set(permissions.transactions
        ?.values
        ?.map((value: TxTag | ModuleName) => patternAgentTags.issuance.indexOf(value)))
        .size === patternAgentTags.issuance.length

export const fetchPermissionAgents = async (agentWithGroups: AgentWithGroup[]): Promise<AgentsInfoJson> => ({
    current: agentWithGroups.map((agentWithGroup: AgentWithGroup): AgentInfoJson => ({
        current: agentWithGroup,
    }))
})
