import Head from "next/head"
import getConfig from "next/config"
import React, { useState } from "react"
import styles from "../styles/Home.module.css"
import { Polymesh, Keyring } from '@polymathnetwork/polymesh-sdk'
import { Identity, NumberedPortfolio, Portfolio, } from '@polymathnetwork/polymesh-sdk/types'
import { NetworkMeta, PolyWallet } from "../src/ui-types"
import {
  CurrentIdentity,
  DefaultPortfolio,
  NumberedPortfolio,
  TransactionQueue,
} from "@polymathnetwork/polymesh-sdk/internal"

export default function Home() {
  const emptyOrder = {
    "isBuy": true as boolean,
    "quantity": "" as string,
    "token": "" as string,
    "price": "" as string,
    "polymeshDid": "" as string,
    "portfolioId": null as null | string,
  }
  const [myInfo, setMyInfo] = useState({
    "id": "" as string,
    "order": Object.assign({}, emptyOrder),
    "modified": false as boolean,
    "portfolios": [] as ShortPortfolioPresentation[],
    "custodianDid": "" as string,
    "custodianValid": false as boolean,
    "custodiedPortfolios": [] as PortfolioPresentation[],
  })

  interface ShortPortfolioPresentation {
    id: string | null
    name: string
  }

  type PortfolioPresentation = string | (ShortPortfolioPresentation & {
    owner: string
  })

  function setStatus(content: string) {
    const element = document.getElementById("status") as HTMLElement
    element.innerHTML = content
  }

  async function getPolyWalletApi(): Promise<Polymesh> {
    if (typeof (window || {})["api"] !== "undefined") return (window || {})["api"]
    setStatus("Getting your Polymesh Wallet")
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
        polymesh: { nodeUrl, },
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

  async function setDidFromPolyWallet(): Promise<string> {
    setStatus("Getting your PolyWallet")
    const api: Polymesh = await getPolyWalletApi()
    setStatus("Fetching your account")
    const did: string = (await api.getCurrentIdentity()).did
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      "order": {
        ...prevInfo["order"],
        "polymeshDid": did,
      },
      "modified": true,
      "portfolios": [{ "id": "", "name": "Loading" }],
    }))
    setStatus("Account fetched")
    await setPortfolioChoices(did)
    await setCustodianFor(did, myInfo["order"]["portfolioId"])
    return did
  }

  async function setPortfolioChoices(did: string): Promise<string[]> {
    if (did === "") return []
    const api: Polymesh = await getPolyWalletApi()
    setStatus("Getting the account")
    const account: Identity = api.getIdentity({ "did": did })
    setStatus("Getting the portfolios")
    const portfolios: Portfolio[] = (await account.portfolios.getPortfolios()).slice(1)
    setStatus("Getting portfolio names")
    const folioNames: ShortPortfolioPresentation[] = await Promise.all(portfolios.map((portfolio: NumberedPortfolio) => {
      return portfolio.getName()
        .then((name: string) => ({
          "id": portfolio.id.toString(10),
          "name": name,
        }))
    }))
    folioNames.unshift({ "id": null, "name": "default" })
    setStatus("Populating portfolios")
    setMyInfo((prevInfo) => {
      const found: ShortPortfolioPresentation = folioNames
        .find((folio: ShortPortfolioPresentation) => folio.id === myInfo["order"]["portfolioId"])
      const newPortfolioId: string | null = typeof found === "undefined" ? null : found.id
      setCustodianFor(did, newPortfolioId)
      return {
        ...prevInfo,
        "order": {
          ...prevInfo["order"],
          "portfolioId": newPortfolioId,
        },
        "portfolios": folioNames,
      }
    })
    setStatus("Portfolios populated")
  }

  async function submitDidFromPolyWallet(e): Promise<string> {
    e.preventDefault()
    return setDidFromPolyWallet()
  }

  async function getMyOrder(): Promise<Response> {
    const response = await fetch(`/api/trader/${myInfo["id"]}`, { "method": "GET" })
    if (response.status == 404) {
      setStatus("Order not found, enter your order info")
      setMyInfo((prevInfo) => ({
        ...prevInfo,
        "order": Object.assign({}, emptyOrder),
        "modified": false,
        "portfolios": [],
      }))
    } else if (response.status == 200) {
      setStatus("Order fetched")
      const body = await response.json()
      const portfolios: ShortPortfolioPresentation[] = [{ "id": null, "name": "default" }]
      if (typeof body["portfolioId"] === "string") portfolios.push({
        "id": body["portfolioId"],
        "name": "Loading",
      })
      setMyInfo((prevInfo) => ({
        ...prevInfo,
        "order": body,
        "portfolios": portfolios,
      }))
      await setPortfolioChoices(body["polymeshDid"])
      await setCustodianFor(body["polymeshDid"], body["portfolioId"])
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
      setMyInfo((prevInfo) => ({
        ...prevInfo,
        "order": Object.assign({}, emptyOrder),
      }))
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
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      "modified": false,
    }))
    setStatus("Submitting order...")
    const response = await fetch(`/api/trader/${myInfo["id"]}`, {
      "method": "PUT",
      "body": JSON.stringify(myInfo["order"]),
    })
    if (response.status == 200) {
      setStatus("Order submitted and saved")
    } else {
      setStatus("Something went wrong")
      setMyInfo((prevInfo) => ({
        ...prevInfo,
        "modified": true,
      }))
    }
  }

  async function submitMyOrder(e): Promise<void> {
    e.preventDefault()
    sendMyOrder()
  }

  function onMyIdChanged(e: React.ChangeEvent<HTMLInputElement>): void {
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      "id": e.target.value,
    }))
  }

  async function changeMyOrder(field: string, value: any): Promise<void> {
    if (field === "portfolioId" && value === "") value = null
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      "order": {
        ...prevInfo["order"],
        [field]: value,
      },
      "modified": true,
      "portfolios": field === "polymeshDid" ? [{ "id": "", "name": "Loading" }] : prevInfo["portfolios"],
    }))
    if (field === "polymeshDid") await setPortfolioChoices(value)
    else if (field === "portfolioId") await setCustodianFor(myInfo["order"]["polymeshDid"], value)
  }

  async function onMyOrderChanged(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): Promise<void> {
    await changeMyOrder(e.target.name, e.target.value)
  }

  function onMyOrderNumberChanged(e: React.ChangeEvent<HTMLInputElement>): void {
    changeMyOrder(e.target.name, parseInt(e.target.value))
  }

  function onBuyChanged(e: React.ChangeEvent<HTMLInputElement>): void {
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      "order": {
        ...prevInfo["order"],
        "isBuy": e.target.value === "true",
      },
      "modified": true,
    }))
  }

  async function findPortfolio(who: Identity, portfolioId: string | null): Promise<DefaultPortfolio | NumberedPortfolio> {
    const theirPortfolios: [DefaultPortfolio, ...NumberedPortfolio[]] = await who.portfolios.getPortfolios()
    return theirPortfolios.find((portfolio: DefaultPortfolio | NumberedPortfolio) => {
      if (portfolio instanceof DefaultPortfolio && portfolioId === null) return true
      if (portfolio instanceof NumberedPortfolio && portfolio.id.toString(10) === portfolioId) return true
      return false
    })
  }

  async function setCustodianFor(polymeshDid: string, portfolioId: string | null) {
    const api: Polymesh = await getPolyWalletApi()
    const who: Identity = api.getIdentity({ "did": polymeshDid })
    setStatus(`Finding selected portfolio ${portfolioId}`)
    const found: Portfolio = await findPortfolio(who, portfolioId)
    if (typeof found === "undefined") {
      setStatus(`Could not find portfolio ${polymeshDid} - ${portfolioId}`)
      return
    }
    setStatus("Fetching custodian")
    const custodian: Identity = await found.getCustodian()
    const toUse: string = custodian.did === polymeshDid ? "" : custodian.did
    if (toUse === "") setStatus("No custodian found")
    else setStatus("Custodian found")
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      "custodianDid": toUse,
      "custodianValid": false,
    }))
  }

  async function onCustodianChanged(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const newCustodian: string = e.target.value
    const myDid: string = (await (await getPolyWalletApi()).getCurrentIdentity()).did
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      "custodianDid": newCustodian,
      "custodianValid": prevInfo["order"]["polymeshDid"] === myDid && newCustodian !== myDid 
    }))
  }

  async function inviteCustodian(): Promise<void> {
    setStatus(`Inviting custodian ${myInfo["custodianDid"]}...`)
    const api: Polymesh = await getPolyWalletApi()
    setStatus("Getting your identity")
    const me: CurrentIdentity = await api.getCurrentIdentity()
    setStatus("Fetching your portfolios")
    const found: Portfolio = await findPortfolio(me, myInfo["order"]["portfolioId"])
    if (typeof found === "undefined") {
      setStatus(`Could not find your portfolio ${myInfo["order"]["portfolioId"]}`)
    }
    const custodianQueue: TransactionQueue<void> = await found.setCustodian({ "targetIdentity": myInfo["custodianDid"] })
    await custodianQueue.run()
  }

  async function submitInviteCustodian(e): Promise<void> {
    e.preventDefault()
    inviteCustodian()
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
            <legend>Order info</legend>

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
              <label htmlFor="order-polymeshDid">Trader's Polymesh did</label>
              <input name="polymeshDid" id="order-polymeshDid" type="text" placeholder="0x12345" value={myInfo["order"]["polymeshDid"]} onChange={onMyOrderChanged}></input>
              &nbsp;
              <button className="submit polymeshDid" onClick={submitDidFromPolyWallet} disabled={myInfo["id"] === ""} title="No copy and paste, just click">Pick it from PolyWallet</button>
            </div>

            <div>
              <label htmlFor="order-portfolioId">Trading portfolio</label>
              <select name="portfolioId" id="order-portfolioId" onChange={onMyOrderChanged} defaultValue={myInfo["order"]["portfolioId"]}>
                {
                  myInfo["portfolios"].map((portfolio: ShortPortfolioPresentation, index: number) => <option value={portfolio.id || ""} key={index}>
                      {portfolio.id} - {portfolio.name}
                    </option>)
                }
              </select>
            </div>

            <div className="submit">
              <button className="submit myInfo" disabled={!(myInfo["modified"])} onClick={submitMyOrder}>Submit your order</button>
            </div>

            <div>
              <label htmlFor="order-custodianDid">Custodian's Polymesh did</label>
              <input name="custodianDid" id="order-custodianDid" type="text" placeholder="0x12345" value={myInfo["custodianDid"]} onChange={onCustodianChanged}></input>
              &nbsp;
              <button className="submit custodianDid" disabled={!(myInfo["custodianValid"])} onClick={submitInviteCustodian}>Invite custodian</button>
            </div>

            <div className="submit">
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
