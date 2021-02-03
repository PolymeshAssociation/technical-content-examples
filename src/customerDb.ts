import { ICustomerInfo } from "./customerInfo"

export interface ICustomerDb {
    getCustomerInfoById(id: any): Promise<ICustomerInfo>
    setCustomerInfo(id: any, info: ICustomerInfo): Promise<void>
}
