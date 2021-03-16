import Head from "next/head"
import getConfig from "next/config"
import React, { useState } from "react"
import styles from "../styles/Home.module.css"
import {
  CurrentIdentity,
  KnownTokenType,
  SecurityToken,
  SecurityTokenDetails,
  TickerReservationDetails,
} from "@polymathnetwork/polymesh-sdk/types"
import { Polymesh, Keyring, BigNumber } from '@polymathnetwork/polymesh-sdk'
import { CountryInfo, getCountryList } from "../src/types"
import { PolymeshError, TickerReservation } from "@polymathnetwork/polymesh-sdk/internal"

export default function Home() {
  const [myInfo, setMyInfo] = useState({
    ticker: "",
    myDid: "",
    reservation: {
      fetchTimer: null,
      current: null as TickerReservation,
      details: null as TickerReservationDetails,
      detailsJson: {
        owner: "null" as string,
        expiryDate: "null" as string,
        status: "null" as string,
      },
    },
    token: {
      current: null as SecurityToken,
      details: null as SecurityTokenDetails,
      detailsJson: {
        name: "null" as string,
        assetType: "null" as string,
        owner: "null" as string,
        divisible: false as boolean,
        totalSupply: "null" as string,
        primaryIssuanceAgent: "null" as string,
      },
    },
  })
  const countryList: CountryInfo[] = getCountryList()

  interface HasFetchTimer {
    fetchTimer: NodeJS.Timeout | null
  }

  function setStatus(content: string): void {
    const element = document.getElementById("status") as HTMLElement
    element.innerHTML = content
  }

  function presentLongHex(hex: string): string {
    const first: string = hex.slice(0, 8)
    const last: string = hex.slice(-6)
    return `${first}...${last}`
  }

  async function getPolyWalletApi(): Promise<Polymesh> {
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
    });
    (window || {})["api"] = api
    const myIdentity: CurrentIdentity = await api.getCurrentIdentity()
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      myDid: myIdentity.did
    }))
    return (window || {})["api"]
  }

  function replaceFetchTimer(where: HasFetchTimer, todo: () => void): NodeJS.Timeout {
    if (where.fetchTimer !== null) clearTimeout(where.fetchTimer)
    const timer: NodeJS.Timeout = setTimeout(todo, 1000)
    where.fetchTimer = timer
    return timer
  }

  async function onTickerChanged(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const ticker: string = e.target.value
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      ticker,
    }))
    replaceFetchTimer(myInfo.reservation, async () => {
      await Promise.all([
        loadReservation(ticker),
        loadToken(ticker),
      ])
    })
  }

  function returnUpdated(previous: object, path: string[], field: string, value: any) {
    if (path.length == 0) return {
      ...previous,
      [field]: value,
    }
    return {
      ...previous,
      [path[0]]: returnUpdated(previous[path[0]], path.slice(1), field, value),
    }
  }

  function checkboxProcessor(e): boolean {
    return e.target.checked
  }

  function onValueChangedCreator(path: string[], field: string, valueProcessor?: (string) => any) {
    return function (e): void {
      let info = myInfo
      path.forEach((pathBit: string) => {
        info = info[pathBit]
      })
      const value = valueProcessor ? valueProcessor(e) : e.target.value
      setMyInfo((prevInfo) => returnUpdated(prevInfo, path, field, value))
    }
  }

  async function reserveTicker(): Promise<TickerReservation> {
    const api: Polymesh = await getPolyWalletApi()
    const reservation: TickerReservation = await (await api.reserveTicker({ ticker: myInfo.ticker })).run()
    await setReservation(reservation)
    return reservation
  }

  async function loadReservation(ticker: string): Promise<TickerReservation> {
    const api: Polymesh = await getPolyWalletApi()
    let reservation: TickerReservation = null
    try {
      reservation = await api.getTickerReservation({ ticker })
    } catch (e) {
      if (!(e instanceof PolymeshError)) {
        throw e
      }
    }
    await setReservation(reservation)
    return reservation
  }

  async function setReservation(reservation: TickerReservation | null): Promise<void> {
    if (reservation === null) {
      setMyInfo((prevInfo) => ({
        ...prevInfo,
        reservation: {
          ...prevInfo.reservation,
          current: null,
          details: null,
          detailsJson: {
            owner: "null",
            expiryDate: "null",
            status: "null",
          },
        },
      }))
    } else {
      const details: TickerReservationDetails = await reservation.details()
      setMyInfo((prevInfo) => ({
        ...prevInfo,
        reservation: {
          ...prevInfo.reservation,
          current: reservation,
          details: details,
          detailsJson: {
            owner: details.owner.did,
            expiryDate: details.expiryDate?.toISOString() || "null",
            status: details.status,
          },
        },
      }))
    }
  }

  async function transferReservationOwnership(): Promise<void> {
    const api: Polymesh = await getPolyWalletApi()
    alert("Not implemented in the SDK yet")
  }

  async function createSecurityToken(): Promise<SecurityToken> {
    const token: SecurityToken = await (await myInfo.reservation.current?.createToken({
      name: myInfo.token.detailsJson.name,
      totalSupply: new BigNumber("0"),
      isDivisible: myInfo.token.detailsJson.divisible,
      tokenType: KnownTokenType.EquityPreferred,
    })).run()
    await setToken(token)
    await loadReservation(myInfo.ticker)
    return token
  }

  async function loadToken(ticker: string): Promise<SecurityToken> {
    const api: Polymesh = await getPolyWalletApi()
    let token: SecurityToken = null
    try {
      token = await api.getSecurityToken({ ticker })
    } catch (e) {
      if (!(e instanceof PolymeshError)) {
        throw e
      }
    }
    await setToken(token)
    return token
  }

  async function setToken(token: SecurityToken | null): Promise<void> {
    if (token === null) {
      setMyInfo((prevInfo) => ({
        ...prevInfo,
        token: {
          ...prevInfo.token,
          current: null,
          details: null,
          detailsJson: {
            name: "null",
            assetType: "null",
            owner: "null",
            divisible: false,
            totalSupply: "null",
            primaryIssuanceAgent: "null",
          },
        },
      }))
    } else {
      const details: SecurityTokenDetails = await token.details()
      setMyInfo((prevInfo) => ({
        ...prevInfo,
        token: {
          ...prevInfo.token,
          current: token,
          details: details,
          detailsJson: {
            name: details.name,
            assetType: details.assetType,
            owner: details.owner.did,
            divisible: details.isDivisible,
            totalSupply: details.totalSupply.toString(10),
            primaryIssuanceAgent: details.primaryIssuanceAgent.did,
          },
        },
      }))
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Simple Token Manager</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to the Simple Token Manager
        </h1>

        <fieldset className={styles.card}>
          <legend>What ticker do you want to manage?</legend>

          <div>
            <input name="ticker" id="ticker" type="text" placeholder="ACME" value={myInfo.ticker} onChange={onTickerChanged} />
          </div>
          <div className="submit">
            <button className="submit reservation" onClick={reserveTicker} disabled={myInfo.reservation.current !== null}>Reserve</button>
          </div>

        </fieldset>

        <div id="status" className={styles.status}>
          Latest status will show here
        </div>

        <fieldset className={styles.card}>
          <legend>Ticker Reservation: {myInfo.reservation.current?.ticker}</legend>

          <div>{
            (() => {
              if (myInfo.reservation.current === null) return "There is no reservation"
              else return <ul>
                <li>Owned by: {myInfo.reservation.detailsJson.owner === myInfo.myDid ? "me" : presentLongHex(myInfo.reservation.detailsJson.owner)}</li>
                <li>With status: {myInfo.reservation.detailsJson.status}</li>
                <li>Valid until: {myInfo.reservation.detailsJson.expiryDate}</li>
              </ul>
            })()
          }</div>

          <div>{
            (() => {
              const canCreate: boolean = myInfo.reservation.current !== null && myInfo.reservation.detailsJson.status === "Reserved" && myInfo.reservation.detailsJson.owner === myInfo.myDid
              return <div>
                <div className="submit">
                  <button className="submit transfer-reservation" onClick={transferReservationOwnership} disabled={!canCreate}>Transfer ownership</button>
                </div>
                <br />
                <div>
                  <label htmlFor="token-name">
                    <span className={styles.hasTitle} title="Long name of your security token">Name</span>
                  </label>
                  <input name="token-name" type="text" placeholder="American CME" value={myInfo.token.detailsJson.name} disabled={!canCreate} onChange={onValueChangedCreator(["token", "detailsJson"], "name")} />
                </div>
                <div>
                  <label htmlFor="token-divisible">
                    <span className={styles.hasTitle} title="Whether it can be sub-divided">Divisible</span>
                  </label>
                  <input name="token-divisible" type="checkbox" defaultChecked={myInfo.token.detailsJson.divisible} disabled={!canCreate} onChange={onValueChangedCreator(["token", "detailsJson"], "divisible", checkboxProcessor)} />
                </div>
                <div>
                  <label htmlFor="token-assetType">
                    <span className={styles.hasTitle} title="Pick one from the list or type what you want">Asset Type</span>
                  </label>
                  <input name="token-assetType" type="text" placeholder="Equity Common" value={myInfo.token.detailsJson.assetType} disabled={!canCreate} onChange={onValueChangedCreator(["token", "detailsJson"], "assetType")} />
                  &nbsp;
                  <select name="known-assetTypes" defaultValue={myInfo.token.detailsJson.assetType} disabled={!canCreate} onChange={onValueChangedCreator(["token", "detailsJson"], "assetType")}>{
                    (() => {
                      const created = []
                      for (const knownType in KnownTokenType) {
                        created.push(<option value={knownType} key={knownType}>{knownType}</option>)
                      }
                      return created
                    })()
                  }</select>
                </div>
                <div className="submit">
                  <button className="submit create-token" onClick={createSecurityToken} disabled={!canCreate}>Create token</button>
                </div>
              </div>
            })()
          }</div>

        </fieldset>

        <fieldset className={styles.card}>
          <legend>Security Token: {myInfo.token.current?.ticker}</legend>

          <div>{
            (() => {
              if (myInfo.token.current === null) return "There is no token"
              else return <ul>
                <li>Owned by: {myInfo.token.detailsJson.owner === myInfo.myDid ? "me" : presentLongHex(myInfo.reservation.detailsJson.owner)}</li>
                <li>As asset type: {myInfo.token.detailsJson.assetType}</li>
                <li>{myInfo.token.detailsJson.divisible ? "" : "not"} divisible</li>
                <li>With PIA: {myInfo.token.detailsJson.primaryIssuanceAgent === myInfo.myDid ? "me" : presentLongHex(myInfo.token.detailsJson.primaryIssuanceAgent)}</li>
                <li>And total supply of: {myInfo.token.detailsJson.totalSupply}</li>
              </ul>
            })()
          }</div>

        </fieldset>

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
