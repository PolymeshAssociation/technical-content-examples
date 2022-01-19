import Head from "next/head"
import { ChangeEvent, MouseEvent, useState } from "react"
import styles from "../styles/Home.module.css"
import { AssignedOrderJson, OrderJson } from "../src/orderInfo"

export default function Home() {
  const emptyOrder: OrderJson = {
    isBuy: true,
    quantity: "",
    token: "",
    price: "",
  }
  const [myInfo, setMyInfo] = useState({
    id: "",
    order: Object.assign({}, emptyOrder),
    modified: false,
  })

  function setStatus(content: string) {
    const element: HTMLElement = document.getElementById("status")
    element.innerHTML = content
  }

  async function getMyOrder(): Promise<Response> {
    const response: Response = await fetch(`/api/trader/${myInfo.id}`, { method: "GET" })
    if (response.status == 404) {
      setStatus("Order not found, enter your order info")
      setMyInfo((prevInfo) => ({
        ...prevInfo,
        order: Object.assign({}, emptyOrder),
        modified: false,
      }))
    } else if (response.status == 200) {
      setStatus("Order fetched")
      const body: AssignedOrderJson = await response.json()
      setMyInfo((prevInfo) => ({
        ...prevInfo,
        order: body,
      }))
    } else {
      setStatus("Something went wrong")
    }
    return response
  }

  async function submitGetMyOrder(e: MouseEvent<HTMLElement>): Promise<void> {
    e.preventDefault() // prevent page from submitting form
    await getMyOrder()
  }

  async function deleteMyOrder(): Promise<Response> {
    const response: Response = await fetch(`/api/trader/${myInfo.id}`, { method: "DELETE" })
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

  async function submitDeleteMyOrder(e: MouseEvent<HTMLElement>): Promise<void> {
    e.preventDefault() // prevent page from submitting form
    await deleteMyOrder()
  }

  async function sendMyOrder(): Promise<void> {
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      modified: false,
    }))
    setStatus("Submitting order...")
    const response: Response = await fetch(`/api/trader/${myInfo.id}`, {
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

  async function submitMyOrder(e: MouseEvent<HTMLElement>): Promise<void> {
    e.preventDefault()
    sendMyOrder()
  }

  function onMyIdChanged(e: ChangeEvent<HTMLInputElement>): void {
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      id: e.target.value,
    }))
  }

  async function changeMyOrder(field: string, value: any): Promise<void> {
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      order: {
        ...prevInfo.order,
        [field]: value,
      },
      modified: true,
    }))
  }

  async function onMyOrderChanged(e: ChangeEvent<HTMLInputElement>): Promise<void> {
    await changeMyOrder(e.target.name, e.target.value)
  }

  function onBuyChanged(e: ChangeEvent<HTMLInputElement>): void {
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      order: {
        ...prevInfo.order,
        isBuy: e.target.value === "true",
      },
      modified: true,
    }))
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
              <input name="quantity" id="order-quantity" type="number" placeholder="12345" value={myInfo.order.quantity} onChange={onMyOrderChanged}></input>
            </div>

            <div>
              <label htmlFor="order-token">Of the token</label>
              <input name="token" id="order-token" type="text" placeholder="ACME" value={myInfo.order.token} onChange={onMyOrderChanged}></input>
            </div>

            <div>
              <label htmlFor="order-price">At the USD price of</label>
              <input name="price" id="order-price" type="number" placeholder="12345" value={myInfo.order.price} onChange={onMyOrderChanged}></input>
            </div>

            <div className="submit">
              <button className="submit myInfo" disabled={!(myInfo.modified)} onClick={submitMyOrder}>Submit your order</button>
            </div>

          </fieldset>

          <div id="status" className={styles.status}>
            Latest status will show here
          </div>

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
