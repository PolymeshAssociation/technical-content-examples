import Head from "next/head"
import React, { useState } from "react"
import Select from "react-select"
import styles from "../styles/Home.module.css"
import {
  ClaimData,
  ClaimType,
  CountryCode,
  CurrentIdentity,
  IdentityWithClaims,
  ResultSet,
  ScopedClaim,
} from "@polymathnetwork/polymesh-sdk/types"
import { Polymesh } from '@polymathnetwork/polymesh-sdk'
import { CountryInfo, getCountryList, } from "../src/types"
import { CustomerJson } from "../src/customerInfo"
import { getPolyWalletApi } from "../src/ui-helpers"

export default function Home() {
  const [myInfo, setMyInfo] = useState({
    id: "",
    info: {
      name: "",
      country: "",
      passport: "",
      valid: false,
      jurisdiction: "",
      polymeshDid: "",
    } as CustomerJson,
    modified: false,
    myAttestations: [] as IdentityWithClaims[],
  })
  const countryList: CountryInfo[] = getCountryList()

  function setStatus(content: string) {
    const element = document.getElementById("status") as HTMLElement
    element.innerHTML = content
  }

  async function getEzKycDid(): Promise<string> {
    setStatus("Fetching EzKyc did")
    const response = await fetch("/api/kycProvider", { method: "GET" })
    if (response.status != 200) {
      setStatus("Something went wrong when getting the EzKyc information")
      console.log(response)
      throw new Error("Failed to get EzKyc did")
    }
    setStatus("Received EzKyc did")
    return (await response.json())["did"]
  }

  async function getMyInfo(): Promise<Response> {
    setStatus("Fetching your information")
    const response = await fetch(`/api/kycCustomer/${myInfo.id}`, { method: "GET" })
    if (response.status == 404) {
      setStatus("Customer not found, enter your information")
    } else if (response.status == 200) {
      setStatus("Info fetched")
      const body: CustomerJson = await response.json()
      setMyInfo((prevInfo) => ({
        ...prevInfo,
        info: body,
      }))
    } else {
      const body = await response.json()
      setStatus(`Something went wrong ${body.status}`)
    }
    return response
  }

  async function submitGetMyInfo(e): Promise<void> {
    e.preventDefault() // prevent page from submitting form
    await getMyInfo()
  }

  async function sendMyInfo(): Promise<void> {
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      modified: false,
    }))
    setStatus("Submitting info...")
    const response = await fetch(`/api/kycCustomer/${myInfo.id}`, {
      method: "PUT",
      body: JSON.stringify(myInfo.info),
    })
    const body = await response.json()
    if (response.status == 200) {
      setStatus(`Info submitted and saved. ${JSON.stringify(body.result)}`)
    } else {
      setStatus(`Something went wrong: ${body.status}`)
      setMyInfo((prevInfo) => ({
        ...prevInfo,
        modified: true,
      }))
    }
  }

  async function submitMyInfo(e): Promise<void> {
    e.preventDefault()
    sendMyInfo()
  }

  function onMyIdChanged(e: React.ChangeEvent<HTMLInputElement>): void {
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      id: e.target.value,
    }))
  }

  function onMyInfoChanged(e: React.ChangeEvent<HTMLInputElement>): void {
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      info: {
        ...prevInfo.info,
        [e.target.name]: e.target.value,
      },
      modified: true,
    }))
  }

  function onCountryChanged(countryCode: CountryInfo, target: object): void {
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      info: {
        ...prevInfo.info,
        [target["name"]]: countryCode.value,
      },
      modified: true,
    }))
  }

  async function setDidFromPolyWallet(): Promise<string> {
    setStatus("Getting your PolyWallet")
    const api: Polymesh = await getPolyWalletApi(setStatus)
    setStatus("Fetching your account")
    const did: string = (await api.getCurrentIdentity()).did
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      info: {
        ...prevInfo.info,
        polymeshDid: did,
      },
      modified: true,
    }))
    setStatus("Account fetched")
    return did
  }

  async function submitDidFromPolyWallet(e): Promise<string> {
    e.preventDefault()
    return setDidFromPolyWallet()
  }

  async function fetchMyAttestations(e): Promise<IdentityWithClaims[]> {
    e.preventDefault() // prevent page from submitting form
    const [ezKycDid, api]: [string, Polymesh] = await Promise.all([
      getEzKycDid(),
      getPolyWalletApi(setStatus)
    ])
    setStatus("Fetching your identity")
    const me: CurrentIdentity = await api.getCurrentIdentity()
    setStatus("Fetching your jurisdiction claims from EzKyc")
    const issuedClaims: ResultSet<IdentityWithClaims> = await api.claims.getIdentitiesWithClaims({
      targets: [me.did],
      trustedClaimIssuers: [ezKycDid],
      claimTypes: [ClaimType.Jurisdiction],
      includeExpired: true,
      start: 0,
      size: 20
    })
    setStatus("Fetched your jurisdiction claims from EzKyc")
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      myAttestations: issuedClaims.data,
    }))
    return issuedClaims.data
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
              <input name="id" id="customer-id" type="number" placeholder="1" defaultValue={myInfo.id} onChange={onMyIdChanged}></input>
            </div>

            <div className="submit">
              <button className="submit customerId" onClick={submitGetMyInfo}>Fetch your info</button>
            </div>

          </fieldset>

          <div id="status" className={styles.status}>
            Latest status will show here
          </div>

          <fieldset className={styles.card}>
            <legend>What we need from you</legend>

            <div>
              <label htmlFor="customer-name">Your name</label>
              <input name="name" id="customer-name" type="text" placeholder="John Doe" defaultValue={myInfo.info.name} onChange={onMyInfoChanged} disabled={myInfo.id === "" || myInfo.info.valid}></input>
            </div>

            <div>
              <label htmlFor="customer-country">Your country</label>
              <Select name="country" id="customer-country" instanceId="customer-country" options={countryList} isClearable={true} isSearchable={true} hasValue={true} value={countryList.find((el: CountryInfo) => el.value === myInfo.info.country)} onChange={onCountryChanged} isDisabled={myInfo.id === "" || myInfo.info.valid} />
            </div>

            <div>
              <label htmlFor="customer-passport">Your passport number</label>
              <input name="passport" id="customer-passport" type="text" placeholder="12345" defaultValue={myInfo.info.passport} onChange={onMyInfoChanged} disabled={myInfo.id === "" || myInfo.info.valid}></input>
            </div>

            <div>
              <label htmlFor="customer-jurisdiction">Your jurisdiction of residence</label>
              <Select name="jurisdiction" id="customer-jurisdiction" instanceId="customer-jurisdiction" options={countryList} isClearable={true} isSearchable={true} hasValue={true} value={countryList.find((el: CountryInfo) => el.value === myInfo.info.jurisdiction)} onChange={onCountryChanged} isDisabled={myInfo.id === "" || myInfo.info.valid} />
            </div>

            <div className="submit">
              <button className="submit myInfo" disabled={!(myInfo.modified)} onClick={submitMyInfo}>Submit your info</button>
            </div>

          </fieldset>

          <fieldset className={styles.card}>
            <legend>EzKyc's decision</legend>

            <div>
              <label htmlFor="customer-valid">
                <span className={styles.hasTitle} title="Fetch your info again to see EzKyc decision">Verified</span>?
              </label>
              <input name="valid" type="checkbox" checked={myInfo.info.valid} disabled={true} ></input>
            </div>

          </fieldset>

          <fieldset className={styles.card}>
            <legend>Your info relevant to Polymesh</legend>

            <div>
              <label htmlFor="customer-polymeshDid">Your Polymesh did</label>
              <input name="polymeshDid" id="customer-polymeshDid" type="text" placeholder="0x12345" value={myInfo.info.polymeshDid} onChange={onMyInfoChanged} disabled={myInfo.id === ""}></input>
              &nbsp;
              <button className="submit polymeshDid" onClick={submitDidFromPolyWallet} disabled={myInfo.id === ""}>Pick it from PolyWallet</button>
            </div>

            <div className="submit">
              <button className="submit myUpdates" disabled={!myInfo.modified} onClick={submitMyInfo}>Submit your updated situation</button>
            </div>

          </fieldset>

          <fieldset className={styles.card}>
            <legend>Your attestations</legend>

            <div className="submit">
              <button className="submit myClaim" disabled={myInfo.info.polymeshDid === ""} onClick={fetchMyAttestations}>Fetch My Attestations</button>
            </div>

            <div>{(() => {
              if (myInfo.myAttestations.length === 0) return <div>There are no attestations</div>
              return <ul>{myInfo.myAttestations
                .map((attestation: IdentityWithClaims, index: number) => <li key={index}>
                  Attestation {index}:<ul>
                    <li key="identity">Identity:&nbsp;{attestation.identity.did}</li>
                    <li key="claims">Claims:{(() => {
                      if (attestation.claims.length === 0) return "There are no claims"
                      return <ul>{attestation.claims
                        .map((claim: ClaimData<ScopedClaim>, claimIndex: number) => <li key={claimIndex}>
                          Claim {claimIndex}:<ul>
                            <li key="issuer">Issuer:&nbsp;{claim.issuer.did}</li>
                            <li key="issuedAt">Issued at:&nbsp;{claim.issuedAt.toISOString()}</li>
                            <li key="expiry">Expiry:&nbsp;{claim.expiry?.toISOString() || "None"}</li>
                            <li key="type">Type:&nbsp;{claim.claim.type}</li>
                            <li key="jurisdiction">Jurisdiction:&nbsp;{(() => {
                              if (claim.claim.type !== ClaimType.Jurisdiction) return "Wrongly not a jurisdiction claim"
                              const countryCode: CountryCode = claim.claim.code
                              const country: CountryInfo = countryList.find((countryInfo: CountryInfo) => countryInfo.value === countryCode.toString())
                              return `${countryCode.toString()} - ${country.label}`
                            })()}</li>
                            <li key="scope">Scope:&nbsp;{claim.claim.scope.type} = {claim.claim.scope.value}</li>
                          </ul>
                        </li>)}
                      </ul>
                    })()}</li>
                  </ul>
                </li>)}
              </ul>
            })()}</div>

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
          <img src="/polymath.svg" alt="Polymath Logo" className={styles.logo} />
        </a>
      </footer>

    </div>
  )
}
