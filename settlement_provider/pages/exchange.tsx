import { BigNumber } from "@polymathnetwork/polymesh-sdk"
import Head from "next/head"
import React, { useState } from "react"
import { AssignedOrderJson } from "../src/orderInfo"
import { FullSettlementJson } from "../src/settlementInfo"
import styles from "../styles/Home.module.css"

export default function Home() {
  const [myInfo, setMyInfo] = useState({
    info: {
      orders: [] as AssignedOrderJson[],
    },
    picked: {
      sell: "" as string,
      buy: "" as string,
    },
  })

  function setStatus(content: string) {
    const element = document.getElementById("status") as HTMLElement
    element.innerHTML = content
  }

  async function getOrdersInfo(): Promise<Response> {
    const response = await fetch(`/api/trades`, { method: "GET" })
    if (response.status == 200) {
      setStatus("Info fetched")
      const body: AssignedOrderJson[] = await response.json()
      setMyInfo((prevInfo) => ({
        ...prevInfo,
        info: {
          orders: body,
        },
      }))
    } else {
      setStatus(`Something went wrong ${response.status}`)
    }
    return response
  }

  async function submitGetOrdersInfo(e): Promise<void> {
    await getOrdersInfo()
  }

  function onTradeSelected(isBuy: boolean) {
    return function (e: React.MouseEvent<HTMLElement, MouseEvent>): void {
      const tradeId: string = e.currentTarget.getAttribute("data-order-id")
      setMyInfo((prevInfo) => ({
        ...prevInfo,
        picked: {
          ...prevInfo.picked,
          [isBuy ? "buy" : "sell"]: tradeId,
        },
      }))
    }
  }

  async function createMatch(): Promise<Response> {
    setStatus("Sending settlement")
    const settlementResponse = await fetch(`/api/settlements/?buyerId=${myInfo.picked.buy}&sellerId=${myInfo.picked.sell}`, {
      method: "POST"
    })
    if (settlementResponse.status == 200) {
      const settlement: FullSettlementJson = await settlementResponse.json()
      console.log(`Settlement posted at instruction ${settlement.instructionId}`)
      setStatus(`Settlement posted at instruction ${settlement.instructionId}`)
    } else {
      console.log(settlementResponse.json())
      setStatus("Something went wrong")
    }
    return settlementResponse
  }

  async function submitMatch(e): Promise<void> {
    e.preventDefault() // prevent page from submitting form
    await createMatch()
    await getOrdersInfo()
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>NextDaq Exchange Page</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Hello NextDaq Matching Algorithm
        </h1>

        <div className="submit">
          <button className="submit loadTrades" onClick={submitGetOrdersInfo}>Load pending orders</button>
        </div>

        <h2>Pick 2 orders to match</h2>

        <form lang="en">

          <div className="submit">
            <button className="submit match" onClick={submitMatch} disabled={myInfo.picked.buy === "" || myInfo.picked.sell === ""}>Submit the match</button>
          </div>

          <div className={styles.row}>

            <div className={styles.column}>
              <div className='sell-column'>

                <h3>Pick 1 sell order</h3>

                {
                  myInfo.info.orders
                    .filter((order: AssignedOrderJson) => !order.isBuy)
                    .sort((left: AssignedOrderJson, right: AssignedOrderJson) => new BigNumber(left.price).minus(new BigNumber(right.price)).toNumber())
                    .map((order: AssignedOrderJson) => <div className={`${styles.card} ${styles.unbreakable} ${myInfo.picked.sell === order.id ? styles.selected : ""}`} key={`order-sell-${order.id}`} data-order-id={order.id} onClick={onTradeSelected(false)}>
                      <span title="Trader id">{order.id} - </span>
                      <span title="Quantity">{order.quantity} </span>
                      of <span title="Ticker">{order.token}</span>,
                      <b title="Price in USD / token"> @ {order.price} </b>
                    </div>)
                }

              </div>
            </div>

            <div className={styles.column}>
              <div className='buy-column'>

                <h3>Pick 1 buy order</h3>

                {
                  myInfo.info.orders
                    .filter((order: AssignedOrderJson) => order.isBuy)
                    .sort((left: AssignedOrderJson, right: AssignedOrderJson) => new BigNumber(right.price).minus(new BigNumber(left.price)).toNumber())
                    .map((order: AssignedOrderJson) => <div className={`${styles.card} ${styles.unbreakable} ${myInfo.picked.buy === order.id ? styles.selected : ""}`} key={`order-buy-${order.id}`} data-order-id={order.id} onClick={onTradeSelected(true)}>
                      <b title="Price in USD / token"> @ {order.price}</b>,
                      <span title="Quantity"> {order.quantity}</span> of
                      <span title="Ticker"> {order.token}</span>
                      <span title="Trader id"> - {order.id}</span>
                    </div>)
                }

              </div>
            </div>

          </div>

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
