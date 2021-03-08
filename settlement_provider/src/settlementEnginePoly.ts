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
    VenueInfo,
} from "./settlementEngine"
import {
    IPublishedSettlementInfo,
    ISettlementInfo,
    PublishedSettlementInfo,
} from "./settlementInfo"

export class SettlementEnginePoly implements ISettlementEngine {

    constructor(public api: Polymesh, public venueId: string, public usdToken: string) {
    }

    async getVenue(): Promise<VenueInfo> {
        const nextDaq: CurrentIdentity = await this.api.getCurrentIdentity()
        if (nextDaq === null) throw new NonExistentAccountError(this.api.getAccount().address)
        const venues: Venue[] = await nextDaq.getVenues()
        const venue: Venue = venues.find((found: Venue) => found.id.toString(10) === this.venueId)
        if (typeof venue === "undefined") throw new NonExistentVenueError(this.venueId)
        return {
            "owner": nextDaq,
            "venue": venue
        }
    }

    async publish(settlement: ISettlementInfo): Promise<IPublishedSettlementInfo> {
        const seller: PortfolioLike = settlement.seller.toPortfolioLike()
        const buyer: PortfolioLike = settlement.buyer.toPortfolioLike()
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
        const venue: Venue = (await this.getVenue()).venue
        const settlementQueue: TransactionQueue<Instruction> = await venue.addInstruction({ "legs": legs })
        const instruction: Instruction = await settlementQueue.run()
        return new PublishedSettlementInfo(<JSON><unknown>{
            ...settlement.toJSON(),
            "instructionId": instruction.id.toString(10)
        })
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
