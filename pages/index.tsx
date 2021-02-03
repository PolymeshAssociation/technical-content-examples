import Head from 'next/head'
import React, { useState } from 'react'
import styles from '../styles/Home.module.css'

export default function Home() {
  const [myInfo, setMyInfo] = useState({});

  function getValue(name: string): string | boolean {
    const elements = document.getElementsByTagName('form')[0].elements
    const element = elements.namedItem(name) as HTMLInputElement
    if (element.type === "checkbox") {
      return element.checked
    }
    return element.value
  }
  function setStatus(content: string) {
    const element = document.getElementById("status") as HTMLElement
    element.innerHTML = content
  }

  async function fetchMyInfo(): Promise<Response> {
    const id = getValue("customer-id")
    if (id == "") {
      setStatus("First, enter an id")
      return
    }
    const response = await fetch(`/api/kycCustomer/${id}`, { "method": "GET" })
    if (response.status == 404) {
      setStatus("Customer not found, enter your information")
    } else if (response.status == 200) {
      setStatus("Info fetched")
      const body = await response.json()
      console.log(body);
      setMyInfo(body)
    } else {
      setStatus("Something went wrong")
    }
    return response
  }

  async function getMyInfo(e): Promise<void> {
    e.preventDefault() // prevent page from submitting form
    await fetchMyInfo()
  }

  async function sendMyInfo(): Promise<void> {
    const id = getValue("customer-id")
    const info: JSON = {
      "name": getValue("customer-name"),
      "country": getValue("customer-country"),
      "passport": getValue("customer-passport"),
      "valid": getValue("customer-valid")
    } as unknown as JSON
    setMyInfo(info)
    setStatus("Submitting info")
    const response = await fetch(`/api/kycCustomer/${id}`, {
      "method": "POST",
      "body": JSON.stringify(info)
    })
    if (response.status == 200) {
      setStatus("Info submitted and  saved")
    } else {
      setStatus("Something went wrong")
    }
  }

  async function onMyInfoChanged(e): Promise<void> {
    e.preventDefault()
    sendMyInfo()
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
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
              <label htmlFor="customer-id">Your Id</label>
              <input name="customer-id" id="customer-id" type="number" placeholder="1"></input>
              Given to you when you registered
            </div>

          </fieldset>

          <div className="submit">
            <button className="submit" onClick={getMyInfo}>Fetch Your Info</button>
          </div>

          <fieldset>
            <legend>The Info We Need From You</legend>

            <div>
              <label htmlFor="customer-name">Your Name</label>
              <input name="customer-name" id="customer-name" type="text" placeholder="John Doe" value={myInfo["name"]}></input>
            </div>

            <div>
              <label htmlFor="customer-country">Your Country</label>
              <input name="customer-country" id="customer-country" type="text" placeholder="UK" value={myInfo["country"]}></input>
            </div>

            <div>
              <label htmlFor="customer-passport">Your Passport Number</label>
              <input name="customer-passport" id="customer-passport" type="text" placeholder="12345" value={myInfo["passport"]}></input>
            </div>

          </fieldset>

          <div className="submit">
            <button className="submit" onClick={onMyInfoChanged}>Submit Your info</button>
          </div>

          <fieldset>
            <legend>Reserved For EzKyc</legend>

            <div>
              <label htmlFor="customer-valid">Is It Valid</label>
              <input name="customer-valid" type="checkbox" checked={myInfo["valid"]} onChange={sendMyInfo}></input>
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
