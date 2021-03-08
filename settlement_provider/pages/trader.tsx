import Head from "next/head"
import getConfig from "next/config"
import React, { useState } from "react"
import styles from "../styles/Home.module.css"
import { Polymesh, Keyring } from '@polymathnetwork/polymesh-sdk'
import { NetworkMeta, PolyWallet } from "../src/ui-types"

export default function Home() {
  const emptyOrder = {
    "isBuy": true,
    "quantity": "",
    "token": "",
    "price": "",
    "polymeshDid": "",
    "portfolioId": null,
  }
  const [myInfo, setMyInfo] = useState({
    "id": "",
    "order": Object.assign({}, emptyOrder),
    "modified": false,
  })

  function setStatus(content: string) {
    const element = document.getElementById("status") as HTMLElement
    element.innerHTML = content
  }

  async function getPolyWalletApi(): Promise<Polymesh> {
    setStatus("Getting your Polymesh Wallet")
    // Move to top of the file when compilation error no longer present.
    const {
      web3Accounts,
      web3Enable,
      web3FromAddress,
      web3ListRpcProviders,
      web3UseRpcProvider
    } = require('@polkadot/extension-dapp')
    
    const { 
      publicRuntimeConfig: { 
        appName,
        polymesh: { nodeUrl }
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
    // The above fails
    // error - ./node_modules/@polkadot/keyring/node_modules/@polkadot/util-crypto/hd/ledger/derivePrivate.mjs
    // Can't import the named export 'BN_EIGHT' from non EcmaScript module (only default export is available)

    myKeyring.addFromAddress(myAccount.address)
    const mySigner = polyWallet["signer"]
    setStatus("Building your API")
    return await Polymesh.connect({
      nodeUrl,
      keyring: myKeyring,
      signer: mySigner,
    })
  }

  async function setDidFromPolyWallet(): Promise<string> {
    setStatus("Getting your PolyWallet")
    const api: Polymesh = await getPolyWalletApi()
    setStatus("Fetching your account")
    const did: string = (await api.getCurrentIdentity()).did
    setMyInfo({
      ...myInfo,
      "order": {
        ...myInfo["order"],
        "polymeshDid": did
      },
      "modified": true
    })
    return did
  }

  async function submitDidFromPolyWallet(e): Promise<string> {
    e.preventDefault()
    return setDidFromPolyWallet()
  }

  async function getMyOrder(): Promise<Response> {
    const response = await fetch(`/api/trader/${myInfo["id"]}`, { "method": "GET" })
    if (response.status == 404) {
      setStatus("Order not found, enter your order info")
    } else if (response.status == 200) {
      setStatus("Order fetched")
      const body = await response.json()
      setMyInfo({
        ...myInfo,
        "order": body
      })

    } else {
      setStatus("Something went wrong")
    }
    return response
  }

  async function submitGetMyOrder(e): Promise<void> {
    e.preventDefault() // prevent page from submitting form
    await getMyOrder()
  }

  async function deleteMyOrder(): Promise<Response> {
    const response = await fetch(`/api/trader/${myInfo["id"]}`, { "method": "DELETE" })
    if (response.status == 200) {
      setStatus("Order deleted")
      setMyInfo({
        ...myInfo,
        "order": Object.assign({}, emptyOrder)
      })
    } else {
      setStatus("Something went wrong")
    }
    return response
  }

  async function submitDeleteMyOrder(e): Promise<void> {
    e.preventDefault() // prevent page from submitting form
    await deleteMyOrder()
  }

  async function sendMyOrder(): Promise<void> {
    setMyInfo({
      ...myInfo,
      "modified": false
    })
    setStatus("Submitting order...")
    const response = await fetch(`/api/trader/${myInfo["id"]}`, {
      "method": "PUT",
      "body": JSON.stringify(myInfo["order"])
    })
    if (response.status == 200) {
      setStatus("Order submitted and saved")
    } else {
      setStatus("Something went wrong")
      setMyInfo({
        ...myInfo,
        "modified": true
      })
    }
  }

  async function submitMyOrder(e): Promise<void> {
    e.preventDefault()
    sendMyOrder()
  }

  function onMyIdChanged(e: React.ChangeEvent<HTMLInputElement>): void {
    setMyInfo({
      ...myInfo,
      "id": e.target.value
    })
  }

  function changeMyOrder(field: string, value: any): void {
    setMyInfo({
      ...myInfo,
      "order": {
        ...myInfo["order"],
        [field]: value
      },
      "modified": true
    })
  }

  function onMyOrderChanged(e: React.ChangeEvent<HTMLInputElement>): void {
    changeMyOrder(e.target.name, e.target.value)
  }

  function onMyOrderNumberChanged(e: React.ChangeEvent<HTMLInputElement>): void {
    changeMyOrder(e.target.name, parseInt(e.target.value))
  }

  function onBuyChanged(e: React.ChangeEvent<HTMLInputElement>): void {
    setMyInfo({
      ...myInfo,
      "order": {
        ...myInfo["order"],
        "isBuy": e.target.value === "true"
      },
      "modified": true
    })
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>NextDaq Trader Page</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to NextDaq
        </h1>

        <h2>Tell us about your order</h2>

        <form lang="en">

          <fieldset className={styles.card}>
            <legend>Your trader id</legend>

            <div>
              <label htmlFor="trader-id" className={styles.hasTitle} title="Given to you when you registered. As of now, just pick one.">Your id</label>
              <input name="id" id="trader-id" type="number" placeholder="1" value={myInfo["id"]} onChange={onMyIdChanged}></input>
            </div>

            <div className="submit">
              <button className="submit customerId" onClick={submitGetMyOrder} disabled={myInfo["id"] === ""}>Fetch your order</button>
              &nbsp;&nbsp;
              <button className="submit danger customerId" onClick={submitDeleteMyOrder} disabled={myInfo["id"] === ""}>Delete your order</button>
            </div>

          </fieldset>

          <fieldset className={styles.card}>
            <legend>Your order info</legend>

            <div>
              <label htmlFor="order-is-buy">Buy</label>
              <input name="isBuy" id="order-is-buy" type="radio" value="true" checked={myInfo["order"]["isBuy"]} onChange={onBuyChanged}/>
              <br/>
              <label htmlFor="order-is-sell">Sell</label>
              <input name="isSell" id="order-is-sell" type="radio" value="false" checked={!myInfo["order"]["isBuy"]} onChange={onBuyChanged}/>
            </div>

            <div>
              <label htmlFor="order-quantity">The quantity</label>
              <input name="quantity" id="order-quantity" type="number" placeholder="12345" value={myInfo["order"]["quantity"]} onChange={onMyOrderNumberChanged}></input>
            </div>

            <div>
              <label htmlFor="order-token">Of the token</label>
              <input name="token" id="order-token" type="text" placeholder="ACME" value={myInfo["order"]["token"]} onChange={onMyOrderChanged}></input>
            </div>

            <div>
              <label htmlFor="order-price">At the USD price of</label>
              <input name="price" id="order-price" type="number" placeholder="12345" value={myInfo["order"]["price"]} onChange={onMyOrderNumberChanged}></input>
            </div>

            <div>
              <label htmlFor="order-polymeshDid">Your Polymesh did</label>
              <input name="polymeshDid" id="order-polymeshDid" type="text" placeholder="0x12345" value={myInfo["order"]["polymeshDid"]} onChange={onMyOrderChanged}></input>
              &nbsp;
              <button className="submit polymeshDid" onClick={submitDidFromPolyWallet} disabled={myInfo["id"] === ""}>Pick it from PolyWallet</button>
            </div>

            <div>
              <label htmlFor="order-portfolioId">The trading portfolio id</label>
              <input name="portfolioId" id="order-portfolioId" type="text" placeholder="1" value={myInfo["order"]["portfolioId"]} onChange={onMyOrderChanged}></input>
            </div>

            <div className="submit">
              <button className="submit myInfo" disabled={!(myInfo["modified"])} onClick={submitMyOrder}>Submit your order</button>
            </div>

          </fieldset>

        </form>

        <div id="status" className={styles.status}>
          Latest status will show here
        </div>
      </main>

      <footer className={styles.footer}>
        <a
          href="http://polymath.network"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <img src="/polymath.svg" alt="Polymath Logo" className={styles.logo} />
        </a>
      </footer>

    </div>
  )
}
