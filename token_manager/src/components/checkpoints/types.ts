import { CheckpointInfoJson, MyInfoPath } from "../../types"

export type LoadBalanceAtCheckpoint = (checkpoint: CheckpointInfoJson, whoseBalance: string, location: MyInfoPath) => Promise<string>
