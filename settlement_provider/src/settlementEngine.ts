import { Venue, } from "@polymathnetwork/polymesh-sdk/types"
import { IPublishedSettlementInfo, ISettlementInfo, } from "./settlementInfo"

export interface ISettlementEngine {
    getVenue(): Promise<Venue>
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
