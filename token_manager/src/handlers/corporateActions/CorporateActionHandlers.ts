import { Checkpoint } from "@polymathnetwork/polymesh-sdk/api/entities/Checkpoint"
import { CheckpointSchedule, CorporateAction } from "@polymathnetwork/polymesh-sdk/types"
import { CorporateActionInfoJson, isCheckpointSchedule } from "../../types"
import { fetchCheckpointInfoJson, fetchCheckpointScheduleInfoJson } from "../checkpoints/CheckpointHandlers"

export const fetchCorporateActionInfo = async (action: CorporateAction): Promise<CorporateActionInfoJson> => {
    const checkpoint: Checkpoint | CheckpointSchedule = await action.checkpoint()
    const isSchedule: boolean = isCheckpointSchedule(checkpoint)
    return {
        current: action,
        exists: await action.exists(),
        checkpoint: checkpoint === null
            ? null
            : isSchedule ? null : await fetchCheckpointInfoJson(checkpoint as Checkpoint),
        checkpointSchedule: checkpoint === null
            ? null
            : isSchedule ? await fetchCheckpointScheduleInfoJson(checkpoint as CheckpointSchedule) : null,
    }
}