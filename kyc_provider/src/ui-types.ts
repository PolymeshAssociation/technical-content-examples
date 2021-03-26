export interface AddressObject {
    address: string
    name?: string
}

export interface Accounts {
    get(): Promise<AddressObject[]>
    subscribe(handler: (update: AddressObject[]) => void | any): () => {}
}

export enum NetworkName {
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
