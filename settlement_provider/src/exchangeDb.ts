import { IAssignedOrderInfo, IOrderInfo } from "./orderInfo"

export interface IExchangeDb {
    getOrders: () => Promise<IAssignedOrderInfo[]>
    getOrderInfoById: (id: any) => Promise<IOrderInfo>
    setOrderInfo: (id: any, info: IOrderInfo) => Promise<void>
    deleteOrderInfoById: (id: any) => Promise<void>
}

export class ExchangeDbError extends Error {
    constructor(message?: string) {
        super(message)
        Error.apply(this, arguments)
    }
}

export class UnknownTraderError extends ExchangeDbError {
    constructor(public id: string, message?: string) {
        super(message)
    }
}
