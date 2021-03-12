import Head from "next/head"
import React, { useState } from "react"
import { AssignedOrderJson, OrderJson } from "../src/orderInfo"
import styles from "../styles/Home.module.css"
import { Polymesh, } from '@polymathnetwork/polymesh-sdk'
import {
  Authorization,
  AuthorizationRequest,
  AuthorizationType,
  Portfolio,
  ResultSet,
} from '@polymathnetwork/polymesh-sdk/types'
import {
  CurrentIdentity,
  DefaultPortfolio,
  Identity,
  NumberedPortfolio,
  TransactionQueue,
} from "@polymathnetwork/polymesh-sdk/internal"
import { getPolyWalletApi } from "../src/ui-helpers"
import { AssignedOrderJson, OrderJson } from "../src/orderInfo"

export default function Home() {
  const emptyOrder: OrderJson = {
    isBuy: true as boolean,
    quantity: "" as string,
    token: "" as string,
    price: "" as string,
    polymeshDid: "" as string,
    portfolioId: null as null | string,
  }
  const [myInfo, setMyInfo] = useState({
    id: "" as string,
    order: Object.assign({}, emptyOrder) as OrderJson,
    modified: false as boolean,
    portfolios: [] as ShortPortfolioPresentation[],
    custodianDid: "" as string,
    custodianValid: false as boolean,
    custodiedPortfolios: [] as PortfolioPresentation[],
    custodyRequests: [] as AuthorizationRequestInPresentation[],
    custodyRequestsOut: [] as AuthorizationRequestOutPresentation[],
  })

  interface ShortPortfolioPresentation {
    id: string | null
    name: string
  }

  type PortfolioPresentation = string | (ShortPortfolioPresentation & {
    owner: string
  })

  interface AuthorizationRequestPresentation {
    target: string
    owner: string
    portfolioId: string | null
    name: string
    request: AuthorizationRequest
  }

  type AuthorizationRequestInPresentation = string | Omit<AuthorizationRequestPresentation, "target">

  type AuthorizationRequestOutPresentation = string | Omit<AuthorizationRequestPresentation, "owner">

  function setStatus(content: string) {
    const element = document.getElementById("status") as HTMLElement
    element.innerHTML = content
  }

  async function setDidFromPolyWallet(): Promise<string> {
    setStatus("Getting your PolyWallet")
    const api: Polymesh = await getPolyWalletApi(setStatus)
    setStatus("Fetching your account")
    const did: string = (await api.getCurrentIdentity()).did
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      order: {
        ...prevInfo.order,
        polymeshDid: did,
      },
      modified: true,
      portfolios: [{ id: "", name: "Loading" }],
    }))
    setStatus("Account fetched")
    await setPortfolioChoices(did)
    await setCustodianFor(did, myInfo.order.portfolioId)
    return did
  }

  async function setPortfolioChoices(did: string): Promise<string[]> {
    if (did === "") return []
    const api: Polymesh = await getPolyWalletApi(setStatus)
    setStatus("Getting the account")
    const account: Identity = api.getIdentity({ did: did })
    setStatus("Getting the portfolios")
    const portfolios: Portfolio[] = (await account.portfolios.getPortfolios()).slice(1)
    setStatus("Getting portfolio names")
    const folioNames: ShortPortfolioPresentation[] = await Promise.all(portfolios.map((portfolio: NumberedPortfolio) => {
      return portfolio.getName()
        .then((name: string) => ({
          id: portfolio.id.toString(10),
          name: name,
        }))
    }))
    folioNames.unshift({ id: null, name: "default" })
    setStatus("Populating portfolios")
    setMyInfo((prevInfo) => {
      const found: ShortPortfolioPresentation = folioNames
        .find((folio: ShortPortfolioPresentation) => folio.id === myInfo.order.portfolioId)
      const newPortfolioId: string | null = typeof found === "undefined" ? null : found.id
      setCustodianFor(did, newPortfolioId)
      return {
        ...prevInfo,
        order: {
          ...prevInfo.order,
          portfolioId: newPortfolioId,
        },
        portfolios: folioNames,
      }
    })
    setStatus("Portfolios populated")
  }

  async function submitDidFromPolyWallet(e): Promise<string> {
    e.preventDefault()
    return setDidFromPolyWallet()
  }

  async function getMyOrder(): Promise<Response> {
    const response = await fetch(`/api/trader/${myInfo.id}`, { method: "GET" })
    if (response.status == 404) {
      setStatus("Order not found, enter your order info")
      setMyInfo((prevInfo) => ({
        ...prevInfo,
        order: Object.assign({}, emptyOrder),
        modified: false,
        portfolios: [],
      }))
    } else if (response.status == 200) {
      setStatus("Order fetched")
      const body: AssignedOrderJson = await response.json()
      const portfolios: ShortPortfolioPresentation[] = [{ id: null, name: "default" }]
      if (typeof body.portfolioId === "string") portfolios.push({
        id: body.portfolioId,
        name: "Loading",
      })
      setMyInfo((prevInfo) => ({
        ...prevInfo,
        order: body,
        portfolios: portfolios,
      }))
      await setPortfolioChoices(body.polymeshDid)
      await setCustodianFor(body.polymeshDid, body.portfolioId)
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
    const response = await fetch(`/api/trader/${myInfo.id}`, { method: "DELETE" })
    if (response.status == 200) {
      setStatus("Order deleted")
      setMyInfo((prevInfo) => ({
        ...prevInfo,
        order: Object.assign({}, emptyOrder),
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
      modified: false,
    }))
    setStatus("Submitting order...")
    const response = await fetch(`/api/trader/${myInfo.id}`, {
      method: "PUT",
      body: JSON.stringify(myInfo.order),
    })
    if (response.status == 200) {
      setStatus("Order submitted and saved")
    } else {
      setStatus("Something went wrong")
      setMyInfo((prevInfo) => ({
        ...prevInfo,
        modified: true,
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
      id: e.target.value,
    }))
  }

  async function changeMyOrder(field: string, value: any): Promise<void> {
    if (field === "portfolioId" && value === "") value = null
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      order: {
        ...prevInfo.order,
        [field]: value,
      },
      modified: true,
      portfolios: field === "polymeshDid" ? [{ id: "", name: "Loading" }] : prevInfo.portfolios,
    }))
    if (field === "polymeshDid") await setPortfolioChoices(value)
    else if (field === "portfolioId") await setCustodianFor(myInfo.order.polymeshDid, value)
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
      order: {
        ...prevInfo.order,
        isBuy: e.target.value === "true",
      },
      modified: true,
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
    const api: Polymesh = await getPolyWalletApi(setStatus)
    const who: Identity = api.getIdentity({ did: polymeshDid })
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
      custodianDid: toUse,
      custodianValid: false,
    }))
  }

  async function onCustodianChanged(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const newCustodian: string = e.target.value
    const myDid: string = (await (await getPolyWalletApi(setStatus)).getCurrentIdentity()).did
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      custodianDid: newCustodian,
      custodianValid: prevInfo.order.polymeshDid === myDid && newCustodian !== myDid
    }))
  }

  async function inviteCustodian(): Promise<void> {
    setStatus(`Inviting custodian ${myInfo.custodianDid}...`)
    const api: Polymesh = await getPolyWalletApi(setStatus)
    setStatus("Getting your identity")
    const me: CurrentIdentity = await api.getCurrentIdentity()
    setStatus("Fetching your portfolios")
    const found: Portfolio = await findPortfolio(me, myInfo.order.portfolioId)
    if (typeof found === "undefined") {
      setStatus(`Could not find your portfolio ${myInfo.order.portfolioId}`)
    }
    const custodianQueue: TransactionQueue<void> = await found.setCustodian({ targetIdentity: myInfo.custodianDid })
    await custodianQueue.run()
  }

  async function submitInviteCustodian(e): Promise<void> {
    e.preventDefault()
    inviteCustodian()
  }

  async function loadCustodiedPortfolios(): Promise<void> {
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      custodiedPortfolios: ["Loading custodied portfolios..."],
    }))
    const api: Polymesh = await getPolyWalletApi(setStatus)
    setStatus("Fetching your identity")
    const me: CurrentIdentity = await api.getCurrentIdentity()
    setStatus("Fetching your custodied portfolios")
    const custodied: ResultSet<DefaultPortfolio | NumberedPortfolio> = await me.portfolios.getCustodiedPortfolios()
    setStatus(`Fetching ${custodied.data.length} names of custodied portfolios`)
    const withNames: PortfolioPresentation[] = custodied.data.length === 0
      ? ["No custodied portfolios"]
      : await Promise.all(custodied.data.map((portfolio: DefaultPortfolio | NumberedPortfolio) => {
        if (portfolio instanceof NumberedPortfolio) return portfolio.getName().then((name: string) => ({
          owner: portfolio.owner.did,
          id: portfolio.id.toString(10),
          name: name,
        }))
        else return Promise.resolve({
          owner: portfolio.owner.did,
          id: null,
          name: "default",
        })
      }))
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      custodiedPortfolios: withNames,
    }))
  }

  function getPortfolioPresentation(portfolio: PortfolioPresentation): string {
    if (typeof portfolio === "string") return portfolio
    return `${portfolio.owner} - ${portfolio.id} - ${portfolio.name}`
  }

  async function submitLoadCustodiedPortfolios(e): Promise<void> {
    e.preventDefault()
    await loadCustodiedPortfolios()
  }

  function getCustodiedPortfolioButton(portfolio: PortfolioPresentation) {
    if (typeof portfolio === "string") return ""
    else return <div>
      <button className="submit custodiedportfolio pick" disabled={myInfo.id === ""} onClick={submitPickCustodiedPortfolioBuilder(portfolio)}>Pick it</button>
    </div>
  }

  async function setPortfolio(portfolio: PortfolioPresentation): Promise<void> {
    if (typeof portfolio === "string") return
    await changeMyOrder("polymeshDid", portfolio.owner)
    await changeMyOrder("portfolioId", portfolio.id)
  }

  function submitPickCustodiedPortfolioBuilder(portfolio: PortfolioPresentation): (e: any) => Promise<void> {
    return async function (e): Promise<void> {
      e.preventDefault()
      await setPortfolio(portfolio)
    }
  }

  async function loadCustodyRequests(): Promise<void> {
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      custodyRequests: ["Loading custody requests..."],
    }))
    const api: Polymesh = await getPolyWalletApi(setStatus)
    setStatus("Fetching your identity")
    const me: CurrentIdentity = await api.getCurrentIdentity()
    setStatus("Fetching your custody requests")
    const requests: AuthorizationRequest[] = await me.authorizations.getReceived({
      type: AuthorizationType.PortfolioCustody,
      includeExpired: false
    })
    const presentations: AuthorizationRequestInPresentation[] = requests.length === 0
      ? ["No custody requests"]
      : await Promise.all(requests.map((request: AuthorizationRequest) => {
        const data: Authorization = request.data
        if (data.type !== AuthorizationType.PortfolioCustody) throw new Error(`Expected "PortfolioCustody", not ${data.type}`)
        if (data.value instanceof NumberedPortfolio) return data.value.getName().then((name: string) => ({
          owner: data.value.owner.did,
          portfolioId: (data.value as NumberedPortfolio).id.toString(10),
          name: name,
          request: request,
        }))
        else return Promise.resolve({
          owner: data.value.owner.did,
          portfolioId: null,
          name: "default",
          request: request,
        })
      }))
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      custodyRequests: presentations,
    }))
  }

  function getAuthorisationPresentation(request: AuthorizationRequestInPresentation): string {
    if (typeof request === "string") return request
    return `${request.owner} - ${request.portfolioId} - ${request.name}`
  }

  async function submitLoadCustodyRequestsIn(e): Promise<void> {
    e.preventDefault()
    await loadCustodyRequests()
  }

  function getCustodyRequestInButtons(request: AuthorizationRequestInPresentation) {
    if (typeof request === "string") return ""
    else return <div>
      <button className="submit custodyRequest accept" onClick={submitCustodyRequestBuilder(request.request, true)}>Accept</button>
        &nbsp;&nbsp;
        <button className="submit custodyRequest reject" onClick={submitCustodyRequestBuilder(request.request, false)}>Reject</button>
    </div>
  }

  async function handleCustodyRequestIn(request: AuthorizationRequest, acceptIt: boolean): Promise<void> {
    let handleQueue: TransactionQueue<void> = null
    if (acceptIt) handleQueue = await request.accept()
    else handleQueue = await request.remove()
    await handleQueue.run()
    await Promise.all([
      loadCustodiedPortfolios(),
      loadCustodyRequests(),
      loadCustodyRequestsOut(),
    ])
  }

  function submitCustodyRequestBuilder(request: AuthorizationRequest, acceptIt: boolean): (e: any) => Promise<void> {
    return async function (e): Promise<void> {
      e.preventDefault()
      await handleCustodyRequestIn(request, acceptIt)
    }
  }

  async function loadCustodyRequestsOut(): Promise<void> {
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      custodyRequestsOut: ["Loading custody requests..."],
    }))
    const api: Polymesh = await getPolyWalletApi(setStatus)
    setStatus("Fetching your identity")
    const me: CurrentIdentity = await api.getCurrentIdentity()
    setStatus("Fetching your outgoing custody requests")
    const requests: ResultSet<AuthorizationRequest> = await me.authorizations.getSent({
      size: 10
    })
    const presentations: AuthorizationRequestOutPresentation[] = requests.data.length === 0
      ? ["No custody requests"]
      : await Promise.all(requests.data.map((request: AuthorizationRequest) => {
        const data: Authorization = request.data
        if (data.type !== AuthorizationType.PortfolioCustody) throw new Error(`Expected "PortfolioCustody", not ${data.type}`)
        const target: string = request.target instanceof Identity ? request.target.did : request.target.address
        if (data.value instanceof NumberedPortfolio) return data.value.getName().then((name: string) => ({
          target: target,
          portfolioId: (data.value as NumberedPortfolio).id.toString(10),
          name: name,
          request: request,
        }))
        else return Promise.resolve({
          target: target,
          portfolioId: null,
          name: "default",
          request: request,
        })
      }))
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      custodyRequestsOut: presentations,
    }))
  }

  function getAuthorisationOutPresentation(request: AuthorizationRequestOutPresentation): string {
    if (typeof request === "string") return request
    return `${request.target} - ${request.portfolioId} - ${request.name}`
  }

  async function submitLoadCustodyRequestsOut(e): Promise<void> {
    e.preventDefault()
    await loadCustodyRequestsOut()
  }

  function getCustodyRequestOutButtons(request: AuthorizationRequestOutPresentation) {
    if (typeof request === "string") return ""
    else return <div>
      <button className="submit custodyRequestOut reject" onClick={submitCustodyRequestBuilder(request.request, false)}>Revoke</button>
    </div>
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
              <input name="id" id="trader-id" type="number" placeholder="1" value={myInfo.id} onChange={onMyIdChanged}></input>
            </div>

            <div className="submit">
              <button className="submit customerId" onClick={submitGetMyOrder} disabled={myInfo.id === ""}>Fetch your order</button>
              &nbsp;&nbsp;
              <button className="submit danger customerId" onClick={submitDeleteMyOrder} disabled={myInfo.id === ""}>Delete your order</button>
            </div>

          </fieldset>

          <fieldset className={styles.card}>
            <legend>Order info</legend>

            <div>
              <label htmlFor="order-is-buy">Buy</label>
              <input name="isBuy" id="order-is-buy" type="radio" value="true" checked={myInfo.order.isBuy} onChange={onBuyChanged} />
              <br />
              <label htmlFor="order-is-sell">Sell</label>
              <input name="isSell" id="order-is-sell" type="radio" value="false" checked={!myInfo.order.isBuy} onChange={onBuyChanged} />
            </div>

            <div>
              <label htmlFor="order-quantity">The quantity</label>
              <input name="quantity" id="order-quantity" type="number" placeholder="12345" value={myInfo.order.quantity} onChange={onMyOrderNumberChanged}></input>
            </div>

            <div>
              <label htmlFor="order-token">Of the token</label>
              <input name="token" id="order-token" type="text" placeholder="ACME" value={myInfo.order.token} onChange={onMyOrderChanged}></input>
            </div>

            <div>
              <label htmlFor="order-price">At the USD price of</label>
              <input name="price" id="order-price" type="number" placeholder="12345" value={myInfo.order.price} onChange={onMyOrderNumberChanged}></input>
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
              <button className="submit myInfo" disabled={!(myInfo.modified)} onClick={submitMyOrder}>Submit your order</button>
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

          <div id="status" className={styles.status}>
            Latest status will show here
          </div>

          <fieldset className={styles.card}>
            <legend>Your custodied portfolios</legend>

            <div className="submit">
              <button className="submit custodied" onClick={submitLoadCustodiedPortfolios}>Load them</button>
            </div>

            <ul>
              {
                myInfo["custodiedPortfolios"].map((portfolio: PortfolioPresentation) => <li>
                  <span>{getPortfolioPresentation(portfolio)}</span>
                  {getCustodiedPortfolioButton(portfolio)}
                </li>)
              }
            </ul>

          </fieldset>

          <fieldset className={styles.card}>
            <legend>Your incoming custody authorisation requests</legend>

            <div className="submit">
              <button className="submit custodyRequests" onClick={submitLoadCustodyRequestsIn}>Load them</button>
            </div>

            <ul>
              {
                myInfo["custodyRequests"].map((request: AuthorizationRequestInPresentation) => <li>
                  <span>{getAuthorisationPresentation(request)}</span>
                  {getCustodyRequestInButtons(request)}
                </li>)
              }
            </ul>

          </fieldset>

          <fieldset className={styles.card}>
            <legend>Your outgoing custody authorisation requests</legend>

            <div className="submit">
              <button className="submit custodyRequestsOut" onClick={submitLoadCustodyRequestsOut}>Load them</button>
            </div>

            <ul>
              {
                myInfo["custodyRequestsOut"].map((request: AuthorizationRequestOutPresentation) => <li>
                  <span>{getAuthorisationOutPresentation(request)}</span>
                  {getCustodyRequestOutButtons(request)}
                </li>)
              }
            </ul>

          </fieldset>

        </form>

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
