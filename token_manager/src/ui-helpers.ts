import getConfig from "next/config"
import type { InjectedExtension } from '@polkadot/extension-inject/types';
import { Keyring, Polymesh } from "@polymathnetwork/polymesh-sdk"
import { PolyWallet } from "./types";

export async function getBasicPolyWalletApi(setStatus: (content: string) => void): Promise<[Polymesh, PolyWallet]> {
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
    const polyWallet: PolyWallet = polyWallets[0] as PolyWallet // TODO remove casting with proper type
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
    return [api, polyWallet]
}
