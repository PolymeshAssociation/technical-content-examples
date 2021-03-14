import Head from "next/head"
import getConfig from "next/config"
import React, { useState } from "react"
import styles from "../styles/Home.module.css"
import { BigNumber, Polymesh, } from '@polymathnetwork/polymesh-sdk'
import {
  DefaultPortfolio,
  Instruction,
  NumberedPortfolio,
  TransactionQueue,
} from '@polymathnetwork/polymesh-sdk/internal'
import {
  AffirmationStatus,
  CurrentIdentity,
  Identity,
  InstructionAffirmation,
  Leg,
  ResultSet,
  Venue,
} from '@polymathnetwork/polymesh-sdk/types'
import { getPolyWalletApi } from "../src/ui-helpers"
import { FullSettlementJson, PolymeshPartyJson, PublishedSettlementJson } from "../src/settlementInfo"
import { SettlementListJson, SimpleVenueJson, } from "../src/ui-types"

export default function Home() {
  const {
    publicRuntimeConfig: {
      polymesh: {
        usdToken,
      },
    }
  } = getConfig()
  const [myInfo, setMyInfo] = useState({
    traderId: "" as string,
    info: {
      settlements: [],
      venue: {
        ownerDid: "",
        venueId: "",
      },
    } as SettlementListJson,
    yourPortfolios: [] as PolymeshPartyJson[],
    fromVenue: [] as FullSettlementJson[],
  })

  function setStatus(content: string) {
    const element = document.getElementById("status") as HTMLElement
    element.innerHTML = content
  }

  function onTraderIdChanged(e: React.ChangeEvent<HTMLInputElement>): void {
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      traderId: e.target.value,
    }))
  }

  async function getPendingSettlements(traderId: string): Promise<Response> {
    const response = (await Promise.all([
      fetch(`/api/settlements/?traderId=${traderId}`, { method: "GET" }),
      getPolyWalletApi(setStatus)
    ]))[0]
    if (response.status == 200) {
      setStatus("Settlements fetched")
      const body: SettlementListJson = await response.json()
      setMyInfo((prevInfo) => ({
        ...prevInfo,
        info: body,
      }))
      const yourPortfolios: PolymeshPartyJson[] = await loadCustodiedPortfolios()
      await loadAllVenueInstructions(body.venue, yourPortfolios, body.settlements)
    } else {
      setStatus("Something went wrong")
    }
    return response
  }

  async function submitGetPendingSettlements(e): Promise<void> {
    e.preventDefault() // prevent page from submitting form
    await getPendingSettlements(myInfo.traderId)
  }

  function createPolymeshPartyJson(portfolio: (DefaultPortfolio | NumberedPortfolio)): PolymeshPartyJson {
    return {
      polymeshDid: portfolio.owner.did,
      portfolioId: portfolio instanceof NumberedPortfolio ? portfolio.id.toString(10) : null,
    }
  }

  async function loadCustodiedPortfolios(): Promise<PolymeshPartyJson[]> {
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      yourPortfolios: [],
    }))
    const api: Polymesh = await getPolyWalletApi(setStatus)
    setStatus("Fetching your identity")
    const me: CurrentIdentity = await api.getCurrentIdentity()
    setStatus("Fetching your portfolios")
    const yourPortfolios: PolymeshPartyJson[] = (await me.portfolios.getPortfolios())
      .map(createPolymeshPartyJson)
    setStatus("Fetching your custodied portfolios")
    const custodied: ResultSet<DefaultPortfolio | NumberedPortfolio> = await me.portfolios.getCustodiedPortfolios()
    custodied.data
      .map(createPolymeshPartyJson)
      .forEach((portfolio: PolymeshPartyJson) => yourPortfolios.push(portfolio))
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      yourPortfolios: yourPortfolios,
    }))
    return yourPortfolios
  }

  function isPortfolioSameAsParty(party: PolymeshPartyJson, portfolio: DefaultPortfolio | NumberedPortfolio): boolean {
    return party.polymeshDid == portfolio.owner.did &&
      (party.portfolioId === null && (portfolio instanceof DefaultPortfolio) ||
        portfolio instanceof NumberedPortfolio && party.portfolioId === portfolio.id.toString(10))
  }

  function isPortfolioRelevantToParties(portfolio: DefaultPortfolio | NumberedPortfolio, parties: PolymeshPartyJson[]): boolean {
    return parties.some((party: PolymeshPartyJson) => isPortfolioSameAsParty(party, portfolio))
  }

  function isLegRelevantToParties(leg: Leg, parties: PolymeshPartyJson[]): boolean {
    return isPortfolioRelevantToParties(leg.from, parties) || isPortfolioRelevantToParties(leg.to, parties)
  }

  function areLegsRelevantToParties(legs: Leg[], parties: PolymeshPartyJson[]): boolean {
    return legs.some((leg: Leg) => isLegRelevantToParties(leg, parties)) &&
      typeof getUsdLeg(legs) !== "undefined"
  }

  function getUsdLeg(legs: Leg[]): Leg | undefined {
    return legs.find((leg: Leg) => leg.token.ticker === usdToken)
  }

  async function createSettlementFromVenueJson(settlement: Instruction, legs: Leg[], parties: PolymeshPartyJson[]): Promise<PublishedSettlementJson | null> {
    // Aggressive way to weed out 
    if (legs.length != 2) return null
    if (!areLegsRelevantToParties(legs, parties)) return null
    const sellerLeg = legs.find((leg: Leg) => leg.token !== usdToken)
    const buyerLeg = getUsdLeg(legs)
    const affirmations: InstructionAffirmation[] = (await settlement.getAffirmations()).data
    const buyerAffirmation = affirmations.find((affirmation: InstructionAffirmation) => affirmation.identity.did === buyerLeg.from.owner.did)
    const sellerAffirmation = affirmations.find((affirmation: InstructionAffirmation) => affirmation.identity.did === sellerLeg.from.owner.did)
    return {
      buyer: {
        id: "NA",
        ...createPolymeshPartyJson(buyerLeg.from),
      },
      seller: {
        id: "NA",
        ...createPolymeshPartyJson(sellerLeg.from),
      },
      quantity: sellerLeg.amount.toString(10),
      token: sellerLeg.token.ticker,
      price: sellerLeg.amount.dividedBy(buyerLeg.amount).toString(10),
      instructionId: settlement.id.toString(10),
      isPaid: buyerAffirmation?.status === AffirmationStatus.Affirmed,
      isTransferred: sellerAffirmation?.status === AffirmationStatus.Affirmed,
    }
  }

  async function loadAllVenueInstructions(venue: SimpleVenueJson, parties: PolymeshPartyJson[], toExclude: FullSettlementJson[]): Promise<FullSettlementJson[]> {
    const idsToExclude: string[] = toExclude.map((instruction: FullSettlementJson) => instruction.instructionId)
    const api: Polymesh = await getPolyWalletApi(setStatus)
    setStatus("Getting exchange account")
    const trader: Identity = await api.getIdentity({ did: venue.ownerDid })
    setStatus("Getting the exchange venue")
    const tradingVenue: Venue = (await trader.getVenues())
      .find((candidate: Venue) => candidate.id.toString(10) == venue.venueId)
    setStatus("Loading pending instructions")
    const instructions: Instruction[] = await tradingVenue.getPendingInstructions()
    setStatus("Retrieving legs")
    const settlementFromVenues: FullSettlementJson[] = (await Promise.all(instructions
      .map((instruction: Instruction) => instruction.getLegs()
        .then((legs: ResultSet<Leg>) => createSettlementFromVenueJson(instruction, legs.data, parties)))))
      .filter((settlement: PublishedSettlementJson | null) => settlement !== null)
      .filter((settlement: PublishedSettlementJson) => !idsToExclude.some((id: string) => settlement.instructionId === id))
      .map((settlement: PublishedSettlementJson) => ({
        id: "NA",
        ...settlement,
      }))
    setStatus(`Found ${settlementFromVenues.length} extra instructions`)
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      fromVenue: settlementFromVenues,
    }))
    return settlementFromVenues
  }

  async function affirmOrReject(instructionId: string, affirm: boolean): Promise<Instruction> {
    const api: Polymesh = await getPolyWalletApi(setStatus)
    setStatus("Getting exchange account")
    const trader: Identity = await api.getIdentity({ did: myInfo.info.venue.ownerDid })
    setStatus("Getting the exchange venue")
    const tradingVenue: Venue = (await trader.getVenues())
      .find((venue: Venue) => venue.id.toString(10) == myInfo.info.venue.venueId)
    setStatus("Finding the pending instruction")
    const myInstruction: Instruction = (await tradingVenue.getPendingInstructions())
      .find((instruction: Instruction) => instruction.id.toString(10) == instructionId)
    if (myInstruction == null) {
      setStatus(`Instruction ${instructionId} not found in the venue, or not pending`)
      throw new Error(`Instruction not found ${instructionId}`)
    }
    setStatus("Setting up affirmation queue")
    const affirmQueue: TransactionQueue<Instruction> = await (affirm ? myInstruction.affirm() : myInstruction.reject())
    setStatus(`${affirm ? "Affirming": "Rejecting"} transaction`)
    const updatedInstruction: Instruction = await affirmQueue.run()
    setStatus("Transaction affirmed")
    return updatedInstruction
  }

  async function sendSettlementAction(settlement: FullSettlementJson, settlementSide: string): Promise<Response> {
    const instructionId: string = settlement.instructionId
    await affirmOrReject(instructionId, true)
    const response = await fetch(`/api/settlement/${settlement.id}?${settlementSide}`, { method: "PATCH" })
    if (response.status == 200) {
      setStatus("Settlement updated")
      await getPendingSettlements(myInfo.traderId)
    } else {
      setStatus("Something went wrong")
    }
    return response
  }

  function submitSettlementActionCreator(settlement: FullSettlementJson, settlementSide: string): (e) => Promise<void> {
    return async function (e): Promise<void> {
      e.preventDefault()
      await sendSettlementAction(settlement, settlementSide)
    }
  }

  async function sendSettlementReject(settlement: FullSettlementJson): Promise<Response> {
    const instructionId: string = settlement.instructionId
    await affirmOrReject(instructionId, false)
    const response = await fetch(`/api/settlement/${settlement.id}`, { method: "DELETE" })
    if (response.status == 200) {
      setStatus("Settlement deleted")
      await getPendingSettlements(myInfo.traderId)
    } else {
      setStatus("Something went wrong")
    }
    return response
  }

  function submitSettlementRejectCreator(settlement: FullSettlementJson): (e) => Promise<void> {
    return async function (e): Promise<void> {
      e.preventDefault()
      await sendSettlementReject(settlement)
    }
  }

  function isPartyRelevant(party: PolymeshPartyJson, yourPortfolios: PolymeshPartyJson[]): boolean {
    return yourPortfolios.some((portfolio: PolymeshPartyJson) => party.polymeshDid === portfolio.polymeshDid &&
      party.portfolioId === portfolio.portfolioId)
  }

  function getInstructionHtml(settlement: FullSettlementJson, yourPortfolios: PolymeshPartyJson[]) {
    const buyerTitle: string = `${settlement.buyer.polymeshDid} - ${settlement.buyer.portfolioId  || "default"}`
    const sellerTitle: string = `${settlement.seller.polymeshDid} - ${settlement.seller.portfolioId  || "default"}`
    const isBuyerRelevant: boolean = isPartyRelevant(settlement.buyer, yourPortfolios)
    const isSellerRelevant: boolean = isPartyRelevant(settlement.seller, yourPortfolios)
    return <fieldset className={`${styles.card} ${styles.unbreakable}`}>
      <legend title="Instruction id">{settlement.instructionId}</legend>

      <div data-trader-id={settlement.buyer.id}>
        <b title={buyerTitle}>Buyer {settlement.buyer.id}</b>
        <span> to pay </span>
        <span title="amount"> {new BigNumber(settlement.price).times(new BigNumber(settlement.quantity)).toString(10)} </span>
        <span title="currency"> USD </span>
        <span> to </span>
        <span title={sellerTitle}> seller {settlement.seller.id} </span>
        <button className="submit paid" onClick={submitSettlementActionCreator(settlement, "isPaid")} disabled={!isBuyerRelevant || settlement.isPaid}>
          {settlement.isPaid ? " Paid" : " Affirm payment"}
        </button>
      </div>

      <div data-trader-id={settlement.seller.id}>
        <b title={sellerTitle}>Seller {settlement.seller.id}</b>
        <span> to transfer </span>
        <span title="quantity"> {settlement.quantity} </span>
        <span title="token"> {settlement.token} </span>
        <span> to </span>
        <span title={buyerTitle}> buyer {settlement.buyer.id} </span>
        <button className="submit transferred" onClick={submitSettlementActionCreator(settlement, "isTransferred")} disabled={!isSellerRelevant || settlement.isTransferred}>
          {settlement.isTransferred ? " Transferred" : " Affirm transfer"}
        </button>
      </div>

      <div>
        <button className="submit reject" onClick={submitSettlementRejectCreator(settlement)}>
          Reject transfer
        </button>
      </div>
    </fieldset>
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
              <input name="traderId" id="custodian-traderId" type="number" placeholder="1" value={myInfo.traderId} onChange={onTraderIdChanged}></input>
            </div>

            <div className="submit">
              <button className="submit traderId" onClick={submitGetPendingSettlements} disabled={myInfo.traderId === ""}>Fetch their pending settlements</button>
            </div>

          </fieldset>

          <div id="status" className={styles.status}>
            Latest status will show here
          </div>

          <fieldset className={styles.card}>
            <legend>Settlements from db</legend>

            <p>Affirm what you recognise</p>

            {
              (() => {
                if (myInfo.info.settlements.length === 0) return "No instructions"
                else return myInfo.info.settlements.map((settlement: FullSettlementJson) => getInstructionHtml(settlement, myInfo.yourPortfolios))
              })()
            }

          </fieldset>

          <fieldset className={styles.card}>
            <legend>Settlements under your custody and missing from the list above</legend>

            <p>Affirm what you recognise</p>

            {
              (() => {
                if (myInfo.fromVenue.length === 0) return "No instructions"
                else return myInfo.fromVenue.map((settlement: FullSettlementJson) => getInstructionHtml(settlement, myInfo.yourPortfolios))
              })()
            }

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
          <img src="/polymath.svg" alt="Vercel Logo" className={styles.logo} />
        </a>
      </footer>
    </div>
  )
}
