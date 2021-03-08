import Head from "next/head"
import getConfig from "next/config"
import React, { useState } from "react"
import styles from "../styles/Home.module.css"
import { Polymesh, Keyring } from '@polymathnetwork/polymesh-sdk'
import { TransactionQueue } from '@polymathnetwork/polymesh-sdk/internal'
import {
  Identity,
  Instruction,
  Venue,
} from '@polymathnetwork/polymesh-sdk/types'
import { NetworkMeta, PolyWallet } from "../src/ui-types"

export default function Home() {
  const [myInfo, setMyInfo] = useState({
    "traderId": "",
    "info": {
      "settlements": [],
      "venue": {
        "ownerDid": "",
        "venueId": ""
      }
    }
  })

  function setStatus(content: string) {
    const element = document.getElementById("status") as HTMLElement
    element.innerHTML = content
  }

  function onTraderIdChanged(e: React.ChangeEvent<HTMLInputElement>): void {
    setMyInfo({
      ...myInfo,
      "traderId": e.target.value
    })
  }

  async function getPendingSettlements(traderId: string): Promise<Response> {
    const response = await fetch(`/api/settlements/?traderId=${traderId}`, { "method": "GET" })
    if (response.status == 200) {
      setStatus("Settlements fetched")
      const body = await response.json()
      setMyInfo({
        ...myInfo,
        "info": body
      })
    } else {
      setStatus("Something went wrong")
    }
    return response
  }

  async function submitGetPendingSettlements(e): Promise<void> {
    e.preventDefault() // prevent page from submitting form
    await getPendingSettlements(myInfo["traderId"])
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
    myKeyring.addFromAddress(myAccount.address)
    const mySigner = polyWallet["signer"]
    setStatus("Building your API")
    return await Polymesh.connect({
      nodeUrl,
      keyring: myKeyring,
      signer: mySigner,
    })
  }

  async function affirm(instructionId: string): Promise<Instruction> {
    const {
      publicRuntimeConfig: {
        polymesh: { venueId, usdToken }
      }
    } = getConfig()
    const api: Polymesh = await getPolyWalletApi()
    setStatus("Getting exchange account")
    const trader: Identity = await api.getIdentity({ "did": myInfo["info"]["venue"]["ownerDid"]})
    setStatus("Getting the exchange venue")
    const tradingVenue: Venue = (await trader.getVenues())
    .find((venue: Venue) => venue.id.toString(10) == myInfo["info"]["venue"]["venueId"])
    setStatus("Finding the pending instruction")
    const myInstruction: Instruction = (await tradingVenue.getPendingInstructions())
      .find((instruction: Instruction) => instruction.id.toString(10) == instructionId)
    if (myInstruction == null) {
      setStatus(`Instruction ${instructionId} not found in the venue, or not pending`)
      throw new Error(`Instruction not found ${instructionId}`)
    }
    setStatus("Setting up affirmation queue")
    const affirmQueue: TransactionQueue<Instruction> = await myInstruction.affirm()
    setStatus("Affirming transaction")
    const updatedInstruction: Instruction = await affirmQueue.run()
    setStatus("Transaction affirmed")
    return updatedInstruction
  }

  async function sendBuyerPays(settlementId: string): Promise<Response> {
    const mySettlement = myInfo.info.settlements.find((settlement) => settlement["id"] === settlementId)
    const instructionId: string = mySettlement["instructionId"]
    const updatedInstruction: Instruction = await affirm(instructionId)
    const response = await fetch(`/api/settlement/${settlementId}?isPaid`, { "method": "PATCH" })
    if (response.status == 200) {
      setStatus("Settlement updated")
      await getPendingSettlements(myInfo["traderId"])
    } else {
      setStatus("Something went wrong")
    }
    return response
  }

  async function submitBuyerPays(e): Promise<void> {
    e.preventDefault()
    await sendBuyerPays(e.target.getAttribute("data-settlement-id"))
  }

  async function sendSellerTransfers(settlementId: string): Promise<Response> {
    const mySettlement = myInfo.info.settlements.find((settlement) => settlement["id"] === settlementId)
    const instructionId: string = mySettlement["instructionId"]
    const updatedInstruction: Instruction = await affirm(instructionId)
    const response = await fetch(`/api/settlement/${settlementId}?isTransferred`, { "method": "PATCH" })
    if (response.status == 200) {
      setStatus("Settlement updated")
      await getPendingSettlements(myInfo["traderId"])
    } else {
      setStatus("Something went wrong")
    }
    return response
  }

  async function submitSellerTransfers(e): Promise<void> {
    e.preventDefault()
    await sendSellerTransfers(e.target.getAttribute("data-settlement-id"))
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>NextDaq Settlements Page</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Hello Custodians
        </h1>

        <h2>Update the settlements that are about you or your trader</h2>

        <form lang="en">

          <fieldset className={styles.card}>
            <legend>The trader you cover</legend>

            <div>
              <label htmlFor="custodian-traderId" className={styles.hasTitle} title="Given to the trader when they registered with NextDaq. As of now, just pick one.">Their id</label>
              <input name="traderId" id="custodian-traderId" type="number" placeholder="1" value={myInfo["traderId"]} onChange={onTraderIdChanged}></input>
            </div>

            <div className="submit">
              <button className="submit traderId" onClick={submitGetPendingSettlements} disabled={myInfo["traderId"] === ""}>Fetch their pending settlements</button>
            </div>

          </fieldset>

          <fieldset className={`${styles.card} ${styles.row}`}>
            <legend>Settlements</legend>

            <div className={styles.column}>
              <div className='sell-column'>

                <h3>Affirm what you recognise</h3>

                {
                  myInfo["info"]["settlements"]
                    .map((settlement) => <div className={`${styles.card} ${styles.unbreakable}`}>
                      <div data-trader-id={settlement["buyer"]["id"]}>
                        Buyer <b title="buyer id">{settlement["buyer"]["id"]}</b>
                        <span> to pay </span>
                        <span title="amount"> {settlement["price"] * settlement["quantity"]} </span>
                        <span title="currency"> USD </span>
                        <span> to seller </span>
                        <span title="seller id"> {settlement["seller"]["id"]} </span>
                        <span> with the reference </span>
                        <span title="transfer reference">{settlement["id"]} </span>
                        <button className="submit paid" onClick={submitBuyerPays} disabled={myInfo["traderId"] !== settlement["buyer"]["id"] || settlement["isPaid"]} data-settlement-id={settlement["id"]}>
                          {settlement["isPaid"] ? " Paid" : "Affirm payment"}
                        </button>
                      </div>

                      <div data-trader-id={settlement["seller"]["id"]}>
                        Seller <b title="seller id"> {settlement["seller"]["id"]}</b>
                        <span> to transfer </span>
                        <span title="quantity"> {settlement["quantity"]} </span>
                        <span title="token"> {settlement["token"]} </span>
                        <span> to buyer </span>
                        <span title="buyer id"> {settlement["buyer"]["id"]} </span>
                        <button className="submit transferred" onClick={submitSellerTransfers} disabled={myInfo["traderId"] !== settlement["seller"]["id"] || settlement["isTransferred"]} data-settlement-id={settlement["id"]}>
                          {settlement["isTransferred"] ? " Transferred" : "Affirm transfer"}
                        </button>
                      </div>
                    </div>)
                }

              </div>
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
          <img src="/polymath.svg" alt="Vercel Logo" className={styles.logo} />
        </a>
      </footer>
    </div>
  )
}
