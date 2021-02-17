import { IAssignedOrderInfo, IOrderInfo } from "./orderInfo"

export interface IExchangeDb {
    getOrders(): Promise<IAssignedOrderInfo[]>
    getOrderInfoById(id: any): Promise<IOrderInfo>
    setOrderInfo(id: any, info: IOrderInfo): Promise<void>
}

export class ExchangeDbError {
    constructor () {
        Error.apply(this, arguments);
    }
}

export class UnknownTraderError extends ExchangeDbError {
    constructor (public id: any) {
        super()
    }
}