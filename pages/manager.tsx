import Head from "next/head"
import React, { useState } from "react"
import Select from "react-select"
import styles from "../styles/Home.module.css"
import countries from "i18n-iso-countries"
countries.registerLocale(require("i18n-iso-countries/langs/en.json"))

export default function Home() {
  const [myInfo, setMyInfo] = useState({
    "id": "",
    "info": {
      "name": "",
      "country": "",
      "passport": "",
      "valid": false,
    }
  } as object)
  const countryList = Object.entries(countries.getNames("en", { select: "official" })).map(([code, countryName]) => {
    return {
      "value": code.charAt(0) + code.charAt(1).toLocaleLowerCase(),
      "label": countryName
    }
  })

  function setStatus(content: string) {
    const element = document.getElementById("status") as HTMLElement
    element.innerHTML = content
  }

  function onCustomerIdChanged(e: React.ChangeEvent<HTMLInputElement>): void {
    setMyInfo({
      ...myInfo,
      "id": e.target.value
    })
  }

  async function getCustomerInfo(): Promise<Response> {
    const response = await fetch(`/api/kycCustomer/${myInfo["id"]}`, { "method": "GET" })
    if (response.status == 404) {
      setStatus("Customer not found, reload the page and enter your information")
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

  async function submitGetCustomerInfo(e): Promise<void> {
    e.preventDefault() // prevent page from submitting form
    await getCustomerInfo()
  }

  async function sendValidInfo(valid: boolean): Promise<void> {
    setMyInfo({
      ...myInfo,
      "info": {
        ...myInfo["info"],
        "valid": valid
      }
    })
    setStatus("Submitting info...")
    const response = await fetch(`/api/kycCustomer/${myInfo["id"]}`, {
      "method": "PATCH",
      "body": JSON.stringify({
        "valid": valid
      })
    })
    if (response.status == 200) {
      setStatus("Info submitted and saved")
    } else {
      setStatus("Something went wrong")
      await getCustomerInfo()
    }
  }

  async function submitValid(e: React.MouseEvent<HTMLButtonElement, MouseEvent>): Promise<void> {
    await sendValidInfo((e.target as HTMLButtonElement).getAttribute("data-valid") === "true")
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>EzKyc Management Tool</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
        EzKyc Management Tool
        </h1>

        <h2>Pick the customer to manage</h2>

        <form lang="en">

          <fieldset className={styles.card}>
            <legend>Id of your customer</legend>

            <div>
              <label htmlFor="customer-id">Id</label>
              <input name="id" id="customer-id" type="number" placeholder="1" value={myInfo["id"]} onChange={onCustomerIdChanged}></input>
            </div>

            <div className="submit">
              <button className="submit customerId" onClick={submitGetCustomerInfo}>Fetch their info</button>
            </div>

          </fieldset>

          <fieldset className={styles.card}>
            <legend>What the customer filled in</legend>

            <div>
              <label htmlFor="customer-name">Their name</label>
              <input name="name" id="customer-name" type="text" placeholder="John Doe" value={myInfo["info"]["name"]} readOnly={true}></input>
            </div>

            <div>
              <label htmlFor="customer-country">Their country</label>
              <Select name="country" id="customer-country" options={countryList} isClearable={true} isSearchable={true} hasValue={true} value={countryList.find(el => el.value === myInfo["info"]["country"])} isDisabled={true}/>            
            </div>

            <div>
              <label htmlFor="customer-passport">Their passport number</label>
              <input name="passport" id="customer-passport" type="text" placeholder="12345" value={myInfo["info"]["passport"]} readOnly={true}></input>
            </div>

          </fieldset>

          <fieldset className={styles.card}>
            <legend>Act on your decision</legend>

            <div>After careful review of the documents, we have decided to:</div>

            <div className="submit">
              <button className="submit" disabled={myInfo["id"] === "" || myInfo["info"]["valid"]} onClick={submitValid} data-valid="true">Accept</button>
              <button className="submit" disabled={!(myInfo["info"]["valid"])} onClick={submitValid} data-valid="false">Reject</button>
            </div>

          </fieldset>

          <fieldset className={styles.card}>
            <legend>Your stored decision</legend>

            <div>
              <label htmlFor="customer-valid">Verified by you</label>
              <input name="valid" type="checkbox" checked={myInfo["info"]["valid"]} disabled={true} ></input>
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
          <img src="/polymath.svg" alt="Vercel Logo" className={styles.logo} />
        </a>
      </footer>
    </div>
  )
}
