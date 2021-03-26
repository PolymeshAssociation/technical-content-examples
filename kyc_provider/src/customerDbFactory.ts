import getConfig from 'next/config'
import { ICustomerDb } from "./customerDb"
import { CustomerDbFs } from "./customerDbFs"

export default async function(): Promise<ICustomerDb> {
    const { serverRuntimeConfig: { kycDbPath } } = getConfig() || {
        serverRuntimeConfig: {
            kycDbPath: process.env.KYC_DB_PATH
        }
    }
    return Promise.resolve(new CustomerDbFs(kycDbPath))
}
