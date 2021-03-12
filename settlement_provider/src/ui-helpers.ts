import getConfig from "next/config"
import { Keyring, Polymesh } from "@polymathnetwork/polymesh-sdk"
import { NetworkMeta, PolyWallet } from "./ui-types"

export async function getPolyWalletApi(setStatus: (content: string) => void): Promise<Polymesh> {
    if (typeof (window || {})["api"] !== "undefined") return (window || {})["api"]
    setStatus("Getting your Polymesh Wallet")
    // Move to top of the file when compilation error no longer present.
    const {
        web3Accounts,
        web3AccountsSubscribe,
        web3Enable,
        web3FromAddress,
        web3ListRpcProviders,
        web3UseRpcProvider,
    } = require('@polkadot/extension-dapp')

    const {
        publicRuntimeConfig: {
            appName,
            polymesh: { nodeUrl },
        }
    } = getConfig()
    setStatus(`Enabling the app ${appName}`)
    const polkaDotExtensions = await web3Enable(appName)
    const polyWallets: PolyWallet[] = polkaDotExtensions.filter(injected => injected["name"] === "polywallet")
    if (polyWallets.length == 0) {
        setStatus("You need to install the Polymesh Wallet extension")
        throw new Error("No Polymesh Wallet")
    }
    const polyWallet: PolyWallet = polyWallets[0]
    setStatus("Verifying network")
    const network: NetworkMeta = await polyWallet.network.get()
    if (network["wssUrl"].replace(/\/$/, '') !== nodeUrl.replace(/\/$/, '')) {
        setStatus(`Your network needs to match ${nodeUrl}`);
        throw new Error(`Incompatible nodeUrl ${network["wssUrl"]} / ${nodeUrl}`)
    }
    polyWallet.network.subscribe(() => window.location.reload())
    web3AccountsSubscribe(() => window.location.reload())
    setStatus("Fetching your account")
    const myAccounts = await polyWallet.accounts.get()
    if (myAccounts.length == 0) {
        setStatus("You need to create an account in the Polymesh Wallet extension")
        return
    }
    const myAccount = myAccounts[0]
    const myKeyring = new Keyring({
        type: 'ed25519',
    })
    myKeyring.addFromAddress(myAccount.address)
    const mySigner = polyWallet["signer"]
    setStatus("Building your API");
    (window || {})["api"] = await Polymesh.connect({
        nodeUrl,
        keyring: myKeyring,
        signer: mySigner,
    })
    return (window || {})["api"]
}
