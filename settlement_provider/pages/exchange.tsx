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
    return function(e: React.ChangeEvent<HTMLInputElement>): void {
      setMyInfo({
        ...myInfo,
        "picked": {
          ...myInfo["picked"],
          [ isBuy ? "buy" : "sell" ]: e.target.value
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

                <h3>Sell orders</h3>

                {
                  myInfo.info.trades
                    .filter((trade) => !trade["isBuy"])
                    .sort((left, right) => left.price - right.price)
                    .map((trade) => <fieldset className={styles.card} key={`order-sell-${trade.id}`}>
                      <legend>
                        <input name="isSell" id={`order-sell-${trade.id}`} type="radio" value={trade.id} checked={myInfo["picked"]["sell"] === trade.id} onChange={onTradeSelected(false)}/>
                        <label htmlFor={`order-sell-${trade.id}`}> Trader {trade.id}</label>
                      </legend>
      
                      <div>
                        {trade.quantity} ea of {trade.token} @ {trade.price} USD / token
                      </div>
      
                    </fieldset>)
                }

              </div>
            </div>

            <div className={styles.column}>
              <div className='buy-column'>

              <h3>Buy orders</h3>

                {
                  myInfo.info.trades
                    .filter((trade) => trade["isBuy"])
                    .sort((left, right) => left.price - right.price)
                    .map((trade) => <fieldset className={styles.card} key={`order-buy-${trade.id}`}>
                      <legend>
                        <input name="isBuy" id={`order-buy-${trade.id}`} type="radio" value={trade.id} checked={myInfo["picked"]["buy"] === trade.id} onChange={onTradeSelected(true)}/>
                        <label htmlFor={`order-buy-${trade.id}`}> Trader {trade.id}</label>
                      </legend>
      
                      <div>
                        {trade.quantity} ea of {trade.token} @ {trade.price} USD / token
                      </div>
      
                    </fieldset>)
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
