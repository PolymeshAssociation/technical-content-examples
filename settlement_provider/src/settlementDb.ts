import { IFullSettlementInfo, ISettlementInfo } from "./settlementInfo"

export interface ISettlementDb {
    getSettlements: () => Promise<IFullSettlementInfo[]>
    getSettlementInfoById: (id: any) => Promise<ISettlementInfo>
    setSettlementInfo: (id: any, info: ISettlementInfo) => Promise<void>
    deleteSettlementInfo: (id: any) => Promise<void>
}

export class SettlementDbError extends Error {
    constructor(message?: string) {
        super(message)
        Error.apply(this, arguments)
    }
}

export class UnknownSettlementError extends SettlementDbError {
    constructor(public id: any, message?: string) {
        super(message)
    }
}
