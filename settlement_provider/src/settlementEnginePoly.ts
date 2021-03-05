import BigNumber from "bignumber.js"
import { Polymesh } from "@polymathnetwork/polymesh-sdk"
import {
    CurrentIdentity,
    Instruction,
    PortfolioLike,
    Venue,
} from "@polymathnetwork/polymesh-sdk/types"
import { TransactionQueue } from "@polymathnetwork/polymesh-sdk/internal"
import {
    ISettlementEngine,
    NonExistentVenueError,
} from "./settlementEngine"
import { ISettlementInfo } from "./settlementInfo"

export class SettlementEnginePoly implements ISettlementEngine {

    constructor(public api: Polymesh, public venueId: string, public usdToken: string) {
    }

    async getVenue(): Promise<Venue> {
        const nextDaq: CurrentIdentity = await this.api.getCurrentIdentity()
        if (nextDaq === null) throw new NonExistentAccountError(this.api.getAccount().address)
        const venues: Venue[] = await nextDaq.getVenues()
        const venue: Venue = venues.find((found: Venue) => found.id.toString(10) === this.venueId)
        if (typeof venue === "undefined") throw new NonExistentVenueError(this.venueId)
        return venue
    }

    async publish(settlement: ISettlementInfo): Promise<Instruction> {
        const seller: PortfolioLike = settlement.seller.portfolioId === null
            ? settlement.seller.polymeshDid
            : {
                "identity": settlement.seller.polymeshDid,
                "id": new BigNumber(settlement.seller.portfolioId),
            }
        const buyer: PortfolioLike = settlement.buyer.portfolioId === null
            ? settlement.buyer.polymeshDid
            : {
                "identity": settlement.buyer.polymeshDid,
                "id": new BigNumber(settlement.buyer.portfolioId),
            }
        const legs = [
            {
                "token": settlement.token,
                "amount": new BigNumber(settlement.quantity.toString(10)),
                "from": seller,
                "to": buyer,
            },
            {
                "token": this.usdToken,
                "amount": new BigNumber(settlement.quantity.toString(10)).multipliedBy(new BigNumber(settlement.price.toString(10))),
                "from": buyer,
                "to": seller,
            },
        ]
        const venue: Venue = await this.getVenue()
        const settlementQueue: TransactionQueue<Instruction> = await venue.addInstruction({ "legs": legs })
        return await settlementQueue.run()
    }

}

export class SettlementEnginePolyError {
    constructor () {
        Error.apply(this, arguments)
    }
}

export class NonExistentAccountError extends SettlementEnginePolyError {
    constructor (public address: string) {
        super()
    }
}
