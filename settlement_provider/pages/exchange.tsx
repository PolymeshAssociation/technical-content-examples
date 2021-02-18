import Head from "next/head"
import React, { useState } from "react"
import styles from "../styles/Home.module.css"

export default function Home() {
  const [myInfo, setMyInfo] = useState({
    "info": {
      "trades": []
    },
    "picked": {
      "sell": "",
      "buy": ""
    }
  })

  function setStatus(content: string) {
    const element = document.getElementById("status") as HTMLElement
    element.innerHTML = content
  }

  async function getOrdersInfo(): Promise<Response> {
    const response = await fetch(`/api/trades`, { "method": "GET" })
    if (response.status == 200) {
      setStatus("Info fetched")
      const body = await response.json()
      setMyInfo({
        ...myInfo,
        "info": {
          "trades": body
        }
      })
    } else {
      setStatus(`Something went wrong ${response.status}`)
    }
    return response
  }

  async function submitGetOrdersInfo(e): Promise<void> {
    await getOrdersInfo()
  }

  function onTradeSelected(isBuy: boolean) {
    return function(e: React.MouseEvent<HTMLElement, MouseEvent>): void {
      setMyInfo({
        ...myInfo,
        "picked": {
          ...myInfo["picked"],
          [ isBuy ? "buy" : "sell" ]: e.currentTarget.getAttribute("data-trade-id")
        }
      })
    }
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

        <h2>Pick a sell order and a buy order to match</h2>

        <form lang="en">

          <div className={styles.row}>

            <div className={styles.column}>
              <div className='sell-column'>

                <h3>Select 1 sell order</h3>

                {
                  myInfo.info.trades
                    .filter((trade) => !trade["isBuy"])
                    .sort((left, right) => left.price - right.price)
                    .map((trade) => <div className={`${styles.card} ${styles.unbreakable} ${myInfo["picked"]["sell"] === trade.id ? styles.selected : ""}`} key={`order-sell-${trade.id}`} data-trade-id={trade.id} onClick={onTradeSelected(false)}>
                      <span title="Trader id">{trade.id} - </span>
                      <span title="Quantity">{trade.quantity} </span>
                      of <span title="Ticker">{trade.token}</span>, 
                      <b title="Price in USD / token"> @ {trade.price} </b>
                    </div>)
                }

              </div>
            </div>

            <div className={styles.column}>
              <div className='buy-column'>

              <h3>Select 1 buy order</h3>

                {
                  myInfo.info.trades
                    .filter((trade) => trade["isBuy"])
                    .sort((left, right) => right.price - left.price)
                    .map((trade) => <div className={`${styles.card} ${styles.unbreakable} ${myInfo["picked"]["buy"] === trade.id ? styles.selected : ""}`} key={`order-buy-${trade.id}`} data-trade-id={trade.id} onClick={onTradeSelected(true)}>
                      <b title="Price in USD / token"> @ {trade.price}</b>,
                      <span title="Quantity"> {trade.quantity}</span> of
                      <span title="Ticker"> {trade.token}</span>
                      <span title="Trader id"> - {trade.id}</span>
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