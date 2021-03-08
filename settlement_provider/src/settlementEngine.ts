import { Identity, Venue, } from "@polymathnetwork/polymesh-sdk/types"
import { IPublishedSettlementInfo, ISettlementInfo, } from "./settlementInfo"

export interface VenueInfo {
    owner: Identity
    venue: Venue
}

export interface ISettlementEngine {
    getVenue(): Promise<VenueInfo>
    publish(settlement: ISettlementInfo): Promise<IPublishedSettlementInfo>
}

export class SettlementEngineError {
    constructor () {
        Error.apply(this, arguments)
    }
}

export class NonExistentVenueError extends SettlementEngineError {
    constructor (public id: string) {
        super()
    }
}
