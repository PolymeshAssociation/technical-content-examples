import { ICustomerInfo } from "./customerInfo"

export interface ICustomerDb {
    getCustomerInfoById: (id: any) => Promise<ICustomerInfo>
    setCustomerInfo: (id: any, info: ICustomerInfo) => Promise<void>
}

export class CustomerDbError {
    constructor() {
        Error.apply(this, arguments);
    }
}

export class UnknownCustomerError extends CustomerDbError {
    constructor(public id: any) {
        super()
    }
}
