import getConfig from "next/config"
import { NotificationManager } from "react-notifications";
import type { InjectedExtension } from '@polkadot/extension-inject/types';
import { Keyring, Polymesh } from "@polymathnetwork/polymesh-sdk"
import { PolyWallet } from "./types";

export const showInfo = (message: string, title?: string, timeout?: number, callback?: () => void) => {
    return NotificationManager.info(message, title, timeout, callback)
}
export const showSuccess = (message: string, title?: string, timeout?: number, callback?: () => void) => {
    return NotificationManager.success(message, title, timeout, callback)
}
export const showWarning = (message: string, title?: string, timeout?: number, callback?: () => void) => {
    return NotificationManager.warning(message, title, timeout, callback)
}
export const showError = (message: string, title?: string, timeout?: number, callback?: () => void) => {
    return NotificationManager.error(message, title, timeout, callback)
}

export const showBuildingRequest = (message: string, timeout?: number, callback?: () => void) => {
    return showInfo(message, "Building request for", timeout, callback)
}
export const showRunningRequest = (message: string, timeout?: number, callback?: () => void) => {
    return showInfo(message, "Running request for", timeout, callback)
}
export const showRequestRun = (message: string, timeout?: number, callback?: () => void) => {
    return showSuccess(message, "Request run for", timeout, callback)
}
export interface ShowRequestCycler {
    running: () => void
    hasRun: () => void
}
export const showRequestCycle = (message: string, timeout?: number, callback?: () => void): ShowRequestCycler => {
    showBuildingRequest(message, timeout, callback)
    return {
        running: () => showRunningRequest(message, timeout, callback),
        hasRun: () => showRequestRun(message, timeout, callback),
    }
}

export const showFetchingInfo = (message: string, timeout?: number, callback?: () => void) => {
    return showInfo(message, "Fetch info of", timeout, callback)
}
export const showInfoFetched = (message: string, timeout?: number, callback?: () => void) => {
    return showSuccess(message, "Info fetched", timeout, callback)
}
export interface ShowFetchCycler {
    fetched: () => void
}
export const showFetchCycle = (message: string, timeout?: number, callback?: () => void): ShowFetchCycler => {
    showFetchingInfo(message, timeout, callback)
    return {
        fetched: () => showInfoFetched(message, timeout, callback),
    }
}

export async function getBasicPolyWalletApi(): Promise<[Polymesh, PolyWallet]> {
    showFetchingInfo("Your Polymesh Wallet")
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
        showError("You need to install the Polymesh Wallet extension", "No wallet found")
        throw new Error("No Polymesh Wallet")
    }
    const polyWallet: PolyWallet = polyWallets[0] as PolyWallet // TODO remove casting with proper type
    showFetchingInfo("Verifying network")
    const network = await polyWallet.network.get()
    polyWallet.network.subscribe(() => window.location.reload())
    web3AccountsSubscribe(() => window.location.reload())
    showFetchingInfo("Your account")
    const myAccounts = await polyWallet.accounts.get()
    if (myAccounts.length == 0) {
        showWarning("You need to create an account in the Polymesh Wallet extension", "No account found")
        return
    }
    const myAccount = myAccounts[0]
    const myKeyring = new Keyring()
    myKeyring.addFromAddress(myAccount.address)
    showInfo("This may take some time", "Building your API");
    const api: Polymesh = await Polymesh.connect({
        nodeUrl: network.wssUrl,
        keyring: myKeyring,
        signer: polyWallet.signer,
        middleware: {
            link: middlewareLink,
            key: middlewareKey,
        }
    });
    return [api, polyWallet]
}
