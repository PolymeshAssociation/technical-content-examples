import { IFullSettlementInfo, IPublishedSettlementInfo } from "./settlementInfo"

export interface ISettlementDb {
    getSettlements(): Promise<IFullSettlementInfo[]>
    getSettlementInfoById(id: any): Promise<IPublishedSettlementInfo>
    setSettlementInfo(id: any, info: IPublishedSettlementInfo): Promise<void>
    deleteSettlementInfo(id: any): Promise<void>
}

export class SettlementDbError extends Error {
    constructor(message?: string) {
        super(message)
        Error.apply(this, arguments);
    }
}

export class UnknownSettlementError extends SettlementDbError {
    constructor(public id: any, message?: string) {
        super(message)
    }
}
