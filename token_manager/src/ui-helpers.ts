import getConfig from "next/config"
import type { InjectedExtension } from '@polkadot/extension-inject/types';
import { Keyring, Polymesh } from "@polymathnetwork/polymesh-sdk"
import { MyInfoPath } from "./types"

export async function getBasicPolyWalletApi(setStatus: (content: string) => void): Promise<Polymesh> {
    setStatus("Getting your Polymesh Wallet")
    if (typeof (window || {})["api"] !== "undefined") return (window || {})["api"]
    // Move to top of the file when compilation error no longer present.
    const {
        web3Accounts,
        web3AccountsSubscribe,
        web3Enable,
        web3FromAddress,
        web3ListRpcProviders,
        web3UseRpcProvider
    } = require('@polkadot/extension-dapp')

    const {
        publicRuntimeConfig: {
            appName,
            // TODO remove middlewareLink and middlewareKey if still undesirable
            polymesh: { middlewareLink, middlewareKey }
        }
    } = getConfig()
    const polkaDotExtensions: InjectedExtension[] = await web3Enable(appName)
    const polyWallets: InjectedExtension[] = polkaDotExtensions.filter(injected => injected.name === "polywallet")
    if (polyWallets.length == 0) {
        setStatus("You need to install the Polymesh Wallet extension")
        throw new Error("No Polymesh Wallet")
    }
    const polyWallet: InjectedExtension = polyWallets[0]
    setStatus("Verifying network")
    const network = await polyWallet.network.get()
    polyWallet.network.subscribe(() => window.location.reload())
    web3AccountsSubscribe(() => window.location.reload())
    setStatus("Fetching your account")
    const myAccounts = await polyWallet.accounts.get()
    if (myAccounts.length == 0) {
        setStatus("You need to create an account in the Polymesh Wallet extension")
        return
    }
    const myAccount = myAccounts[0]
    const myKeyring = new Keyring()
    myKeyring.addFromAddress(myAccount.address)
    setStatus("Building your API");
    const api: Polymesh = await Polymesh.connect({
        nodeUrl: network.wssUrl,
        keyring: myKeyring,
        signer: polyWallet.signer,
        middleware: {
            link: middlewareLink,
            key: middlewareKey,
        }
    });
    (window || {})["polyWallet"] = polyWallet;
    (window || {})["api"] = api
    return (window || {})["api"]
}

export async function checkboxProcessor(e): Promise<boolean> {
    return Promise.resolve(e.target.checked)
}

export function returnUpdated(previous: object, path: MyInfoPath, value: any, deep: boolean = false) {
    if (path.length === 0) {
        if (deep && typeof value === "object" && !Array.isArray(value)) return {
            ...previous,
            ...value,
        }
        return value
    }
    if (typeof path[0] === "number" && Array.isArray(previous)) return [
        ...previous.slice(0, path[0]),
        returnUpdated(previous[path[0]], path.slice(1), value, deep),
        ...previous.slice(path[0] + 1),
    ]
    return {
        ...previous,
        [path[0]]: returnUpdated(previous ? previous[path[0]] : previous, path.slice(1), value, deep),
    }
}

export function returnUpdatedCreator(path: MyInfoPath, value: any, deep: boolean = false) {
    return (previous: object) => returnUpdated(previous, path, value, deep)
}

export function findValue(where: object, path: MyInfoPath): any {
    return path.reduce((whereLeft: object, pathBit: string | number) => whereLeft[pathBit], where)
}

export function returnAddedArrayCreator(containerLocation: MyInfoPath, dummy: any, deep: boolean = false) {
    return (prevInfo) => {
        const container = findValue(prevInfo, containerLocation) || []
        if (!Array.isArray(container)) throw new Error("Only works with arrays")
        const updatedContainer = [...container, dummy]
        return returnUpdated(prevInfo, containerLocation, updatedContainer, deep)
    }
}

export function returnRemovedArrayCreator(location: MyInfoPath) {
    return (prevInfo) => {
        const containerPath = location.slice(0, -1)
        const container = findValue(prevInfo, containerPath)
        if (!Array.isArray(container)) throw new Error("Only works with arrays")
        const lastPathBit = location[location.length - 1]
        if (typeof lastPathBit !== "number") throw new Error("Only works with an array index")
        const updatedContainer = [
            ...container.slice(0, lastPathBit),
            ...container.slice(lastPathBit + 1),
        ]
        return returnUpdated(prevInfo, containerPath, updatedContainer)
    }
}
