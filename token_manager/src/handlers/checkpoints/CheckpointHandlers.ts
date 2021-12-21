import { BigNumber } from "@polymathnetwork/polymesh-sdk";
import { Checkpoint } from "@polymathnetwork/polymesh-sdk/api/entities/Checkpoint";
import { CheckpointSchedule } from "@polymathnetwork/polymesh-sdk/internal";
import {
    CheckpointWithData,
    Identity,
    ScheduleDetails,
    ScheduleWithDetails,
} from "@polymathnetwork/polymesh-sdk/types";
import {
    CheckpointInfoJson,
    CheckpointScheduleDetailsInfoJson,
    CheckpointsInfoJson,
    getEmptyCheckpointsInfoJson,
    isCheckpointWithData,
    isScheduleWithDetails,
    TokenInfoJson,
} from "../../types";

export type OnCheckpointsChanged = (checkpoints: CheckpointInfoJson[]) => void
export type OnCheckpointSchedulesChanged = (checkpointSchedules: CheckpointScheduleDetailsInfoJson[]) => void

export interface CheckpointLoadBalanceParams {
    identity: string | Identity
}

export async function fetchCheckpointInfoJson(checkpointWith: CheckpointWithData | Checkpoint): Promise<CheckpointInfoJson> {
    const [checkpoint, exists, totalSupply, createdAt]: [Checkpoint, boolean, BigNumber, Date] = await Promise.all([
        isCheckpointWithData(checkpointWith) ? checkpointWith.checkpoint : checkpointWith,
        isCheckpointWithData(checkpointWith) ? checkpointWith.checkpoint.exists() : checkpointWith.exists(),
        isCheckpointWithData(checkpointWith) ? checkpointWith.totalSupply : checkpointWith.totalSupply(),
        isCheckpointWithData(checkpointWith) ? checkpointWith.createdAt : checkpointWith.createdAt(),
    ])
    return {
        checkpoint: checkpoint,
        exists: exists,
        totalSupply: totalSupply,
        createdAt: createdAt,
    }
}

export async function fetchCheckpointInfoJsons(checkpointWiths: (CheckpointWithData | Checkpoint)[]): Promise<CheckpointInfoJson[]> {
    return Promise.all(checkpointWiths.map(fetchCheckpointInfoJson))
}

export async function fetchCheckpointScheduleInfoJson(schedule: CheckpointSchedule | ScheduleWithDetails): Promise<CheckpointScheduleDetailsInfoJson> {
    const [createdCheckpointInfos, exists, details]: [CheckpointInfoJson[], boolean, ScheduleDetails] = await Promise.all([
        Promise.all((await (isScheduleWithDetails(schedule) ? schedule.schedule : schedule).getCheckpoints()).map(fetchCheckpointInfoJson)),
        (isScheduleWithDetails(schedule) ? schedule.schedule : schedule).exists(),
        isScheduleWithDetails(schedule) ? schedule.details : schedule.details(),
    ])
    return {
        schedule: isScheduleWithDetails(schedule) ? schedule.schedule : schedule,
        createdCheckpoints: createdCheckpointInfos,
        exists: exists,
        remainingCheckpoints: details.remainingCheckpoints,
        nextCheckpointDate: details.nextCheckpointDate,
    }

}

export async function fetchCheckpointScheduleInfoJsons(schedules: (CheckpointSchedule | ScheduleWithDetails)[]): Promise<CheckpointScheduleDetailsInfoJson[]> {
    return Promise.all(schedules.map(fetchCheckpointScheduleInfoJson))
}

export async function fetchCheckpointsInfo(token: TokenInfoJson): Promise<CheckpointsInfoJson> {
    if (token.current === null) return getEmptyCheckpointsInfoJson()
    // TODO handle pagination
    const checkpoints: CheckpointWithData[] = (await token.current.checkpoints.get()).data
    const infos: CheckpointInfoJson[] = await fetchCheckpointInfoJsons(checkpoints)
    const schedules: ScheduleWithDetails[] = await token.current.checkpoints.schedules.get()
    const scheduleInfos: CheckpointScheduleDetailsInfoJson[] = await fetchCheckpointScheduleInfoJsons(schedules)
    return {
        current: checkpoints.map((withData: CheckpointWithData) => withData.checkpoint),
        details: infos,
        currentSchedules: schedules.map((withDetails: ScheduleWithDetails) => withDetails.schedule),
        scheduleDetails: scheduleInfos,
    }
}