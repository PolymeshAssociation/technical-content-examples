import Head from "next/head"
import getConfig from "next/config"
import React, { useState } from "react"
import Select from "react-select"
import styles from "../styles/Home.module.css"
import {
  Claim,
  ClaimData,
  ClaimType,
  CurrentIdentity,
  Identity,
  IdentityWithClaims,
  ResultSet,
} from "@polymathnetwork/polymesh-sdk/types"
import { Polymesh, Keyring } from '@polymathnetwork/polymesh-sdk'
import { CountryInfo, getCountryList } from "../src/types"
import { CustomerJson } from "../src/customerInfo"
import {  } from "@polymathnetwork/polymesh-sdk/middleware/types"

export default function Home() {
  const [myInfo, setMyInfo] = useState({
    id: "",
    info: {
      name: "",
      country: "",
      passport: "",
      valid: false,
      jurisdiction: "",
      polymeshDid: "",
    } as CustomerJson,
    modified: false,
  })
  const countryList: CountryInfo[] = getCountryList()

  function setStatus(content: string) {
    const element = document.getElementById("status") as HTMLElement
    element.innerHTML = content
  }

  async function getEzKycDid(): Promise<string> {
    setStatus("Fetching EzKyc did")
    const response = await fetch("/api/kycProvider", { method: "GET" })
    if (response.status != 200) {
      setStatus("Something went wrong when getting the EzKyc information")
      console.log(response)
      throw new Error("Failed to get EzKyc did");
    }
    setStatus("Received EzKyc did")
    return (await response.json())["did"]
  }

  async function getPolyWalletApi(): Promise<Polymesh> {
    setStatus("Getting your Polymesh Wallet")
    if (typeof (window || {})["api"] !== "undefined") return (window || {})["api"]
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
        // TODO remove middlewareLink and middlewareKey if still undesirable
        polymesh: { nodeUrl, middlewareLink, middlewareKey }
      }
    } = getConfig()
    const polkaDotExtensions = await web3Enable(appName)
    const polyWallets = polkaDotExtensions.filter(injected => injected.name === "polywallet")
    if (polyWallets.length == 0) {
      setStatus("You need to install the Polymesh Wallet extension")
      throw new Error("No Polymesh Wallet")
    }
    const polyWallet = polyWallets[0]
    setStatus("Verifying network")
    const network = await polyWallet.network.get()
    if (network.wssUrl !== nodeUrl) {
      setStatus(`Your network needs to match ${nodeUrl}`)
      throw new Error(`Incompatible nodeUrl ${network.wssUrl} / ${nodeUrl}`)
    }
    setStatus("Fetching your account")
    const myAccounts = await polyWallet.accounts.get()
    if (myAccounts.length == 0) {
      setStatus("You need to create an account in the Polymesh Wallet extension")
      return
    }
    const myAccount = myAccounts[0]
    const myKeyring = new Keyring()
    myKeyring.addFromAddress(myAccount.address)
    const mySigner = polyWallet.signer
    setStatus("Building your API");
    (window || {})["api"] = await Polymesh.connect({
      nodeUrl,
      keyring: myKeyring,
      signer: polyWallet.signer,
      middleware: {
        link: middlewareLink,
        key: middlewareKey
      }
    })
    return (window || {})["api"]
  }

  async function getMyInfo(): Promise<Response> {
    const response = await fetch(`/api/kycCustomer/${myInfo.id}`, { method: "GET" })
    if (response.status == 404) {
      setStatus("Customer not found, enter your information")
    } else if (response.status == 200) {
      setStatus("Info fetched")
      const body: CustomerJson = await response.json()
      setMyInfo((prevInfo) => ({
        ...prevInfo,
        info: body
      }))
    } else {
      const body = await response.json()
      setStatus(`Something went wrong ${body.status}`)
    }
    return response
  }

  async function submitGetMyInfo(e): Promise<void> {
    e.preventDefault() // prevent page from submitting form
    await getMyInfo()
  }

  async function sendMyInfo(): Promise<void> {
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      modified: false
    }))
    setStatus("Submitting info...")
    const response = await fetch(`/api/kycCustomer/${myInfo.id}`, {
      method: "PUT",
      body: JSON.stringify(myInfo.info)
    })
    const body = await response.json()
    if (response.status == 200) {
      setStatus(`Info submitted and saved. ${JSON.stringify(body.result)}`)
    } else {
      setStatus(`Something went wrong: ${body.status}`)
      setMyInfo((prevInfo) => ({
        ...prevInfo,
        modified: true
      }))
    }
  }

  async function submitMyInfo(e): Promise<void> {
    e.preventDefault()
    sendMyInfo()
  }

  function onMyIdChanged(e: React.ChangeEvent<HTMLInputElement>): void {
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      id: e.target.value,
    }))
  }

  function onMyInfoChanged(e: React.ChangeEvent<HTMLInputElement>): void {
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      info: {
        ...prevInfo.info,
        [e.target.name]: e.target.value,
      },
      modified: true,
    }))
  }

  function onCountryChanged(countryCode: CountryInfo, target: object): void {
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      info: {
        ...prevInfo.info,
        [target["name"]]: countryCode.value,
      },
      "modified": true,
    }))
  }

  async function setDidFromPolyWallet(): Promise<string> {
    setStatus("Getting your PolyWallet")
    const api: Polymesh = await getPolyWalletApi()
    setStatus("Fetching your account")
    const did: string = (await api.getCurrentIdentity()).did
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      info: {
        ...prevInfo.info,
        polymeshDid: did,
      },
      modified: true,
    }))
    setStatus("Account fetched")
    return did
  }

  async function submitDidFromPolyWallet(e): Promise<string> {
    e.preventDefault()
    return setDidFromPolyWallet()
  }

  async function fetchMyClaim(e): Promise<ClaimData<Claim> | null> {
    e.preventDefault() // prevent page from submitting form
    const [ezKycDid, api]: [string, Polymesh] = await Promise.all([
      getEzKycDid(),
      getPolyWalletApi()
    ])
    setStatus("Fetching your identity")
    const me: CurrentIdentity = await api.getCurrentIdentity()
    const issuedClaims: ResultSet<IdentityWithClaims> = await api.claims.getIdentitiesWithClaims({
      targets: [me.did],
      trustedClaimIssuers: [ezKycDid],
      claimTypes: [ClaimType.Jurisdiction],
      includeExpired: true,
      start: 0,
      size: 20
    })
    console.log(issuedClaims);
    if (issuedClaims.data.length == 0) {
      setStatus("There are no claims for you")
      return null
    } else {
      const issuedClaim: IdentityWithClaims = issuedClaims.data[0]
      return issuedClaim.claims[0]
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>EzKyc Customer Page</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to EzKyc
        </h1>

        <h2>Let's get you set up</h2>

        <form lang="en">

          <fieldset className={styles.card}>
            <legend>Your customer id</legend>

            <div>
              <label htmlFor="customer-id" className={styles.hasTitle} title="Given to you when you registered. As of now, just pick one.">Your id</label>
              <input name="id" id="customer-id" type="number" placeholder="1" value={myInfo.id} onChange={onMyIdChanged}></input>
            </div>

            <div className="submit">
              <button className="submit customerId" onClick={submitGetMyInfo}>Fetch your info</button>
            </div>

          </fieldset>

          <fieldset className={styles.card}>
            <legend>What we need from you</legend>

            <div>
              <label htmlFor="customer-name">Your name</label>
              <input name="name" id="customer-name" type="text" placeholder="John Doe" value={myInfo.info.name} onChange={onMyInfoChanged} disabled={myInfo.id === "" || myInfo.info.valid}></input>
            </div>

            <div>
              <label htmlFor="customer-country">Your country</label>
              <Select name="country" id="customer-country" options={countryList} isClearable={true} isSearchable={true} hasValue={true} value={countryList.find((el: CountryInfo) => el.value === myInfo.info.country)} onChange={onCountryChanged} isDisabled={myInfo.id === "" || myInfo.info.valid} />
            </div>

            <div>
              <label htmlFor="customer-passport">Your passport number</label>
              <input name="passport" id="customer-passport" type="text" placeholder="12345" value={myInfo.info.passport} onChange={onMyInfoChanged} disabled={myInfo.id === "" || myInfo.info.valid}></input>
            </div>

            <div>
              <label htmlFor="customer-jurisdiction">Your jurisdiction of residence</label>
              <Select name="jurisdiction" id="customer-jurisdiction" options={countryList} isClearable={true} isSearchable={true} hasValue={true} value={countryList.find((el: CountryInfo) => el.value === myInfo.info.jurisdiction)} onChange={onCountryChanged} isDisabled={myInfo.id === "" || myInfo.info.valid} />
            </div>

            <div className="submit">
              <button className="submit myInfo" disabled={!(myInfo.modified)} onClick={submitMyInfo}>Submit your info</button>
            </div>

          </fieldset>

          <fieldset className={styles.card}>
            <legend>EzKyc's decision</legend>

            <div>
              <label htmlFor="customer-valid">
                <span className={styles.hasTitle} title="Fetch your info again to see EzKyc decision">Verified</span>?
              </label>
              <input name="valid" type="checkbox" checked={myInfo.info.valid} disabled={true} ></input>
            </div>

          </fieldset>

          <fieldset className={styles.card}>
            <legend>Your info relevant to Polymesh</legend>

            <div>
              <label htmlFor="customer-polymeshDid">Your Polymesh did</label>
              <input name="polymeshDid" id="customer-polymeshDid" type="text" placeholder="0x12345" value={myInfo.info.polymeshDid} onChange={onMyInfoChanged} disabled={myInfo.id === ""}></input>
              &nbsp;
              <button className="submit polymeshDid" onClick={submitDidFromPolyWallet} disabled={myInfo.id === ""}>Pick it from PolyWallet</button>
            </div>

            <div className="submit">
              <button className="submit myUpdates" disabled={!myInfo.modified} onClick={submitMyInfo}>Submit your updated situation</button>
            </div>

            <div className="submit">
              <button className="submit myClaim" disabled={!myInfo.info.valid} onClick={fetchMyClaim}>Fetch My Claim</button>
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
