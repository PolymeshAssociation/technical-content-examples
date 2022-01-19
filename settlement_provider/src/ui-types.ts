import { FullSettlementJson } from "./settlementInfo";

export interface SimpleVenueJson {
    ownerDid: string
    venueId: string
}

export interface SettlementListJson {
    settlements: FullSettlementJson[]
    venue: SimpleVenueJson
}

export interface AddressObject {
    address: string
    name?: string
}

export interface Accounts {
    get: () => Promise<AddressObject[]>
    subscribe: (handler: (update: AddressObject[]) => void | any) => () => {}
}

export enum NetworkName {
    testnet = "testnet",
    alcyone = "alcyone",
}

export type NetworkMeta = {
    name: NetworkName
    label?: string
    wssUrl: string
}

export interface InjectedNetwork {
    get: () => Promise<NetworkMeta>
    subscribe: (cb: (network: NetworkMeta) => void) => () => void
}

export interface PolyWallet {
    network: InjectedNetwork
    accounts: Accounts
}
