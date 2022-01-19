import Head from "next/head"
import { ChangeEvent, MouseEvent, useState } from "react"
import styles from "../styles/Home.module.css"
import { FullSettlementJson, } from "../src/settlementInfo"
import { SettlementListJson, } from "../src/ui-types"

export default function Home() {
  const [myInfo, setMyInfo] = useState({
    traderId: "",
    info: {
      settlements: [],
    },
  })

  function setStatus(content: string) {
    const element: HTMLElement = document.getElementById("status")
    element.innerHTML = content
  }

  function onTraderIdChanged(e: ChangeEvent<HTMLInputElement>): void {
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      traderId: e.target.value,
    }))
  }

  async function getPendingSettlements(traderId: string): Promise<Response> {
    const response = await fetch(`/api/settlements/?traderId=${traderId}`, { method: "GET" })
    if (response.status == 200) {
      setStatus("Settlements fetched")
      const body: SettlementListJson = await response.json()
      setMyInfo((prevInfo) => ({
        ...prevInfo,
        info: body,
      }))
    } else {
      setStatus("Something went wrong")
    }
    return response
  }

  async function submitGetPendingSettlements(e: MouseEvent<HTMLButtonElement>): Promise<void> {
    e.preventDefault() // prevent page from submitting form
    await getPendingSettlements(myInfo.traderId)
  }

  async function sendSettlementAction(settlement: FullSettlementJson, settlementSide: string): Promise<Response> {
    const response: Response = await fetch(`/api/settlement/${settlement.id}?${settlementSide}`, { method: "PATCH" })
    if (response.status == 200) {
      setStatus("Settlement updated")
      await getPendingSettlements(myInfo.traderId)
    } else {
      setStatus("Something went wrong")
    }
    return response
  }

  function submitSettlementActionCreator(settlement: FullSettlementJson, settlementSide: string): (e: MouseEvent<HTMLButtonElement>) => Promise<void> {
    return async function (e: MouseEvent<HTMLButtonElement>): Promise<void> {
      e.preventDefault()
      await sendSettlementAction(settlement, settlementSide)
    }
  }

  async function sendSettlementReject(settlement: FullSettlementJson): Promise<Response> {
    const response: Response = await fetch(`/api/settlement/${settlement.id}`, { method: "DELETE" })
    if (response.status == 200) {
      setStatus("Settlement deleted")
      await getPendingSettlements(myInfo.traderId)
    } else {
      setStatus("Something went wrong")
    }
    return response
  }

  function submitSettlementRejectCreator(settlement: FullSettlementJson): (e: MouseEvent<HTMLButtonElement>) => Promise<void> {
    return async function (e: MouseEvent<HTMLButtonElement>): Promise<void> {
      e.preventDefault()
      await sendSettlementReject(settlement)
    }
  }

  function getInstructionHtml(settlement: FullSettlementJson): JSX.Element {
    const buyerTitle: string = settlement.buyer.id
    const sellerTitle: string = settlement.seller.id
    const isBuyerRelevant: boolean = myInfo.traderId === settlement.buyer.id && !settlement.isPaid
    const isSellerRelevant: boolean = myInfo.traderId === settlement.seller.id && !settlement.isTransferred
    return <fieldset className={`${styles.card} ${styles.unbreakable}`}>
      <legend title="Instruction id">{settlement.id}</legend>

      <div data-trader-id={settlement.buyer.id}>
        <b title={buyerTitle}>Buyer {settlement.buyer.id}</b>
        <span> to pay </span>
        <span title="amount"> {parseInt(settlement.price) * parseInt(settlement.quantity)} </span>
        <span title="currency"> USD </span>
        <span> to </span>
        <span title={sellerTitle}> seller {settlement.seller.id} </span>
        <button className="submit paid" onClick={submitSettlementActionCreator(settlement, "isPaid")} disabled={!isBuyerRelevant || settlement.isPaid}>
          {settlement.isPaid ? " Paid" : " Mark as paid"}
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
          {settlement.isTransferred ? " Transferred" : " Mark as transferred"}
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

            <p>Accept what you recognise</p>

            {
              (() => {
                if (myInfo.info.settlements.length === 0) return "No instructions"
                else return myInfo.info.settlements.map((settlement: FullSettlementJson) => getInstructionHtml(settlement))
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
