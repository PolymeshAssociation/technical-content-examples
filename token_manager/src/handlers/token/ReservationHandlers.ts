import { TickerReservation } from "@polymathnetwork/polymesh-sdk/types"
import { ReservationInfoJson } from "../../types"

export type OnTickerChanged = (ticker: string) => void
export type OnReservationInfoChanged = (changed: ReservationInfoJson) => void

export async function fetchReservationInfoJson(reservation: TickerReservation): Promise<ReservationInfoJson> {
    return {
        current: reservation,
        details: await reservation.details(),
    }
}
