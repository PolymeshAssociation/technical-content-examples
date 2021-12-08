import { Checkpoint } from "@polymathnetwork/polymesh-sdk/internal"
import { CheckpointSchedule } from "@polymathnetwork/polymesh-sdk/types"
import { CheckpointInfoJson, MyInfoPath } from "../../types"

export type LoadBalanceAtCheckpoint = (checkpoint: CheckpointInfoJson, whoseBalance: string, location: MyInfoPath) => Promise<string>
export type CreateCheckpoint = () => Promise<Checkpoint>
export type CreateScheduledCheckpoint = () => Promise<CheckpointSchedule>
