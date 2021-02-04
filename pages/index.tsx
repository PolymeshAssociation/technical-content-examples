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
      "valid": false
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
      console.log(body);
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

          <fieldset>
            <legend>Your Customer Id</legend>

            <div>
              <label htmlFor="customer-id">Your Id </label>
              <input name="id" id="customer-id" type="number" placeholder="1" value={myInfo["id"]} onChange={onMyIdChanged}></input>
              <div>Given to you when you registered</div>
            </div>

            <div className="submit">
              <button className="submit customerId" onClick={submitGetMyInfo}>Fetch Your Info</button>
            </div>

          </fieldset>

          <fieldset>
            <legend>The Info We Need From You</legend>

            <div>
              <label htmlFor="customer-name">Your Name </label>
              <input name="name" id="customer-name" type="text" placeholder="John Doe" value={myInfo["info"]["name"]} onChange={onMyInfoChanged}></input>
            </div>

            <div>
              <label htmlFor="customer-country">Your Country </label>
              <input name="country" id="customer-country" type="text" placeholder="UK" value={myInfo["info"]["country"]} onChange={onMyInfoChanged}></input>
            </div>

            <div>
              <label htmlFor="customer-passport">Your Passport Number </label>
              <input name="passport" id="customer-passport" type="text" placeholder="12345" value={myInfo["info"]["passport"]} onChange={onMyInfoChanged}></input>
            </div>

            <div className="submit">
              <button className="submit myInfo" disabled={!(myInfo["modified"])} onClick={submitMyInfo}>Submit Your info</button>
            </div>

          </fieldset>

          <fieldset>
            <legend>What EzKyc Has To Say</legend>

            <div>
              <label htmlFor="customer-valid">Is It Valid </label>
              <input name="valid" type="checkbox" checked={myInfo["info"]["valid"]} disabled={true} ></input>
              <div>Fetch your info again to see EzKyc decision</div>
            </div>

          </fieldset>

        </form>

        <div id="status" className={styles.status}>
          Latest status will show here
        </div>

      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <img src="/vercel.svg" alt="Vercel Logo" className={styles.logo} />
        </a>
      </footer>
    </div>
  )
}
