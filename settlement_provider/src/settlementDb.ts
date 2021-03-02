import { throws } from "assert";
import { ISettlementInfo, IFullSettlementInfo } from "./settlementInfo"

export interface ISettlementDb {
    getSettlements(): Promise<IFullSettlementInfo[]>
    getSettlementInfoById(id: any): Promise<ISettlementInfo>
    setSettlementInfo(id: any, info: ISettlementInfo): Promise<void>
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

export class WrongOrderTypeError extends SettlementDbError {
    constructor(public expectedIsBuy: boolean, message?: string) {
        super(message)
    }
}

export class IncompatibleOrderTypeError extends SettlementDbError {
    constructor(public buyToken: string, public sellToken: string, message?: string) {
        super(message)
    }
}
