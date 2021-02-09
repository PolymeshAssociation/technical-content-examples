import Head from "next/head"
import React, { useState } from "react"
import styles from "../styles/Home.module.css"

export default function Home() {
  const [myInfo, setMyInfo] = useState({
    "id": "",
    "info": {
      "name": "",
      "country": "",
      "passport": "",
      "valid": false,
      "jurisdiction": "",
      "polymeshId": ""
    },
    "modified": false
  } as object);

  function setStatus(content: string) {
    const element = document.getElementById("status") as HTMLElement
    element.innerHTML = content
  }

  async function getMyInfo(): Promise<Response> {
    const response = await fetch(`/api/kycCustomer/${myInfo["id"]}`, { "method": "GET" })
    if (response.status == 404) {
      setStatus("Customer not found, enter your information")
    } else if (response.status == 200) {
      setStatus("Info fetched")
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

  async function submitGetMyInfo(e): Promise<void> {
    e.preventDefault() // prevent page from submitting form
    await getMyInfo()
  }

  async function sendMyInfo(): Promise<void> {
    setMyInfo({
      ...myInfo,
      "modified": false
    })
    setStatus("Submitting info")
    const response = await fetch(`/api/kycCustomer/${myInfo["id"]}`, {
      "method": "PUT",
      "body": JSON.stringify(myInfo["info"])
    })
    if (response.status == 200) {
      setStatus("Info submitted and saved")
    } else {
      setStatus("Something went wrong")
      setMyInfo({
        ...myInfo,
        "modified": true
      })
    }
  }

  async function submitMyInfo(e): Promise<void> {
    e.preventDefault()
    sendMyInfo()
  }

  function onMyIdChanged(e: React.ChangeEvent<HTMLInputElement>): void {
    setMyInfo({
      ...myInfo,
      "id": e.target.value
    })
    console.log(myInfo);
    
  }

  function onMyInfoChanged(e: React.ChangeEvent<HTMLInputElement>): void {
    setMyInfo({
      ...myInfo,
      "info": {
        ...myInfo["info"],
        [e.target.name]: e.target.value
      },
      "modified": true
    })
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
              <input name="id" id="customer-id" type="number" placeholder="1" value={myInfo["id"]} onChange={onMyIdChanged}></input>
            </div>

            <div className="submit">
              <button className="submit customerId" onClick={submitGetMyInfo}>Fetch your info</button>
            </div>

          </fieldset>

          <fieldset className={styles.card}>
            <legend>What we need from you</legend>

            <div>
              <label htmlFor="customer-name">Your name</label>
              <input name="name" id="customer-name" type="text" placeholder="John Doe" value={myInfo["info"]["name"]} onChange={onMyInfoChanged} disabled={myInfo["id"] === "" || myInfo["info"]["valid"]}></input>
            </div>

            <div>
              <label htmlFor="customer-country">Your country</label>
              <input name="country" id="customer-country" type="text" placeholder="UK" value={myInfo["info"]["country"]} onChange={onMyInfoChanged} disabled={myInfo["id"] === "" || myInfo["info"]["valid"]}></input>
            </div>

            <div>
              <label htmlFor="customer-passport">Your passport number</label>
              <input name="passport" id="customer-passport" type="text" placeholder="12345" value={myInfo["info"]["passport"]} onChange={onMyInfoChanged} disabled={myInfo["id"] === "" || myInfo["info"]["valid"]}></input>
            </div>

            <div>
              <label htmlFor="customer-jurisdiction">Your jurisdiction of residence</label>
              <input name="jurisdiction" id="customer-jurisdiction" type="text" placeholder="IE" value={myInfo["info"]["jurisdiction"]} onChange={onMyInfoChanged} disabled={myInfo["id"] === "" || myInfo["info"]["valid"]}></input>
            </div>

            <div className="submit">
              <button className="submit myInfo" disabled={!(myInfo["modified"])} onClick={submitMyInfo}>Submit your info</button>
            </div>

          </fieldset>

          <fieldset className={styles.card}>
            <legend>EzKyc's decision</legend>

            <div>
              <label htmlFor="customer-valid">
                <span className={styles.hasTitle} title="Fetch your info again to see EzKyc decision">Verified</span>?
              </label>
              <input name="valid" type="checkbox" checked={myInfo["info"]["valid"]} disabled={true} ></input>
            </div>

          </fieldset>

          <fieldset className={styles.card}>
            <legend>Your info relevant to Polymesh</legend>

            <div>
              <label htmlFor="customer-polymeshId">Your Polymesh id</label>
              <input name="polymeshId" id="customer-polymeshId" type="text" placeholder="0x12345" value={myInfo["info"]["polymeshId"]} onChange={onMyInfoChanged} disabled={myInfo["id"] === ""}></input>
            </div>

            <div className="submit">
              <button className="submit myUpdates" disabled={!(myInfo["modified"])} onClick={submitMyInfo}>Submit your updated situation</button>
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
