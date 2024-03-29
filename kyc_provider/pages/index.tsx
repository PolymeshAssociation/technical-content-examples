import Head from "next/head";
import getConfig from "next/config";
import React, { useState } from "react";
import Select from "react-select";
import styles from "../styles/Home.module.css";
import {
  ClaimType,
  ClaimData,
  CountryCode,
  Identity,
} from "@polymeshassociation/polymesh-sdk/types";
import { BigNumber, Polymesh } from "@polymeshassociation/polymesh-sdk";
import countries from "i18n-iso-countries";
countries.registerLocale(require("i18n-iso-countries/langs/en.json"));

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
    },
    modified: false,
  } as object);
  const countryList = Object.values(CountryCode)
    .sort()
    .map((code) => {
      return {
        value: code,
        label: countries.getName(code.toUpperCase(), "en") || code,
      };
    });

  function setStatus(content: string) {
    const element = document.getElementById("status") as HTMLElement;
    element.innerHTML = content;
  }

  async function getEzKycDid(): Promise<string> {
    setStatus("Fetching EzKyc did");
    const response = await fetch("/api/kycProvider", { method: "GET" });
    if (response.status != 200) {
      setStatus("Something went wrong when getting the EzKyc information");
      console.log(response);
      throw new Error("Failed to get EzKyc did");
    }
    setStatus("Received EzKyc did");
    return (await response.json())["did"];
  }

  async function getPolyWalletApi(): Promise<Polymesh> {
    setStatus("Getting your Polymesh Wallet");
    // Move to top of the file when compilation error no longer present.
    const {
      web3AccountsSubscribe,
      web3Enable,
    } = require("@polkadot/extension-dapp");

    const {
      BrowserExtensionSigningManager,
    } = require("@polymathnetwork/browser-extension-signing-manager");

    const {
      publicRuntimeConfig: {
        appName,
        // TODO remove middlewareLink and middlewareKey if still undesirable
        polymesh: { middlewareLink, middlewareKey },
      },
    } = getConfig();

    const polkaDotExtensions = await web3Enable(appName);

    const polyWallets = polkaDotExtensions.filter(
      (injected) => injected.name === "polywallet"
    );
    if (polyWallets.length == 0) {
      setStatus("You need to install the Polymesh Wallet extension");
      throw new Error("No Polymesh Wallet");
    }

    const polyWallet = polyWallets[0];

    setStatus("Verifying network");

    const network = await polyWallet.network.get();

    polyWallet.network.subscribe(() => window.location.reload());

    web3AccountsSubscribe(() => window.location.reload());

    setStatus("Fetching your account");

    const myAccounts = await polyWallet.accounts.get();
    if (myAccounts.length == 0) {
      setStatus(
        "You need to create an account in the Polymesh Wallet extension"
      );
      return;
    }

    const browserExtensionSigningManager =
      await BrowserExtensionSigningManager.create({
        appName,
        extensionName: "polywallet",
      });

    setStatus("Building your API");
    return await Polymesh.connect({
      nodeUrl: network.wssUrl,
      signingManager: browserExtensionSigningManager,
      middleware: {
        link: middlewareLink,
        key: middlewareKey,
      },
    });
  }

  async function getMyInfo(): Promise<Response> {
    const response = await fetch(`/api/kycCustomer/${myInfo["id"]}`, {
      method: "GET",
    });
    if (response.status == 404) {
      setStatus("Customer not found, enter your information");
    } else if (response.status == 200) {
      setStatus("Info fetched");
      const body = await response.json();
      setMyInfo({
        ...myInfo,
        info: body,
      });
    } else {
      setStatus("Something went wrong");
    }
    return response;
  }

  async function submitGetMyInfo(e): Promise<void> {
    e.preventDefault(); // prevent page from submitting form
    await getMyInfo();
  }

  async function sendMyInfo(): Promise<void> {
    setMyInfo({
      ...myInfo,
      modified: false,
    });
    setStatus("Submitting info...");
    const response = await fetch(`/api/kycCustomer/${myInfo["id"]}`, {
      method: "PUT",
      body: JSON.stringify(myInfo["info"]),
    });
    if (response.status == 200) {
      const body = await response.json();
      setStatus(`Info submitted and saved. ${JSON.stringify(body.result)}`);
    } else {
      setStatus("Something went wrong");
      setMyInfo({
        ...myInfo,
        modified: true,
      });
    }
  }

  async function submitMyInfo(e): Promise<void> {
    e.preventDefault();
    sendMyInfo();
  }

  function onMyIdChanged(e: React.ChangeEvent<HTMLInputElement>): void {
    setMyInfo({
      ...myInfo,
      id: e.target.value,
    });
  }

  function onMyInfoChanged(e: React.ChangeEvent<HTMLInputElement>): void {
    setMyInfo({
      ...myInfo,
      info: {
        ...myInfo["info"],
        [e.target.name]: e.target.value,
      },
      modified: true,
    });
  }

  function onCountryChanged(countryCode: string, target: object): void {
    setMyInfo({
      ...myInfo,
      info: {
        ...myInfo["info"],
        [target["name"]]: countryCode,
      },
      modified: true,
    });
  }

  async function fetchMyClaim(e): Promise<ClaimData | null> {
    e.preventDefault(); // prevent page from submitting form
    const [ezKycDid, api] = await Promise.all([
      getEzKycDid(),
      getPolyWalletApi(),
    ]);
    setStatus("Fetching your identity");
    const me: Identity = await api.getSigningIdentity();
    const ezKycIdentity = await api.identities.getIdentity({ did: ezKycDid });
    const issuedClaims = await api.claims.getIdentitiesWithClaims({
      targets: [me],
      trustedClaimIssuers: [ezKycIdentity],
      claimTypes: [ClaimType.Jurisdiction],
      includeExpired: false,
      start: new BigNumber(0),
      size: new BigNumber(20),
    });
    if (issuedClaims.data.length == 0) {
      setStatus("There are no claims for you");
      return null;
    } else {
      const issuedClaim = issuedClaims.data[0].claims[0];
      return issuedClaim;
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>EzKyc Customer Page</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Welcome to EzKyc</h1>

        <h2>Let's get you set up</h2>

        <form lang="en">
          <fieldset className={styles.card}>
            <legend>Your customer id</legend>

            <div>
              <label
                htmlFor="customer-id"
                className={styles.hasTitle}
                title="Given to you when you registered. As of now, just pick one."
              >
                Your id
              </label>
              <input
                name="id"
                id="customer-id"
                type="number"
                placeholder="1"
                value={myInfo["id"]}
                onChange={onMyIdChanged}
              ></input>
            </div>

            <div className="submit">
              <button className="submit customerId" onClick={submitGetMyInfo}>
                Fetch your info
              </button>
            </div>
          </fieldset>

          <fieldset className={styles.card}>
            <legend>What we need from you</legend>

            <div>
              <label htmlFor="customer-name">Your name</label>
              <input
                name="name"
                id="customer-name"
                type="text"
                placeholder="John Doe"
                value={myInfo["info"]["name"]}
                onChange={onMyInfoChanged}
                disabled={myInfo["id"] === "" || myInfo["info"]["valid"]}
              ></input>
            </div>

            <div>
              <label htmlFor="customer-country">Your country</label>
              <Select
                name="country"
                id="customer-country"
                options={countryList}
                isClearable={true}
                isSearchable={true}
                hasValue={true}
                value={countryList.find(
                  (el) => el.value === myInfo["info"]["country"]
                )}
                onChange={onCountryChanged}
                isDisabled={myInfo["id"] === "" || myInfo["info"]["valid"]}
              />
            </div>

            <div>
              <label htmlFor="customer-passport">Your passport number</label>
              <input
                name="passport"
                id="customer-passport"
                type="text"
                placeholder="12345"
                value={myInfo["info"]["passport"]}
                onChange={onMyInfoChanged}
                disabled={myInfo["id"] === "" || myInfo["info"]["valid"]}
              ></input>
            </div>

            <div>
              <label htmlFor="customer-jurisdiction">
                Your jurisdiction of residence
              </label>
              <Select
                name="jurisdiction"
                id="customer-jurisdiction"
                options={countryList}
                isClearable={true}
                isSearchable={true}
                hasValue={true}
                value={countryList.find(
                  (el) => el.value === myInfo["info"]["jurisdiction"]
                )}
                onChange={onCountryChanged}
                isDisabled={myInfo["id"] === "" || myInfo["info"]["valid"]}
              />
            </div>

            <div className="submit">
              <button
                className="submit myInfo"
                disabled={!myInfo["modified"]}
                onClick={submitMyInfo}
              >
                Submit your info
              </button>
            </div>
          </fieldset>

          <fieldset className={styles.card}>
            <legend>EzKyc's decision</legend>

            <div>
              <label htmlFor="customer-valid">
                <span
                  className={styles.hasTitle}
                  title="Fetch your info again to see EzKyc decision"
                >
                  Verified
                </span>
                ?
              </label>
              <input
                name="valid"
                type="checkbox"
                checked={myInfo["info"]["valid"]}
                disabled={true}
              ></input>
            </div>
          </fieldset>

          <fieldset className={styles.card}>
            <legend>Your info relevant to Polymesh</legend>

            <div>
              <label htmlFor="customer-polymeshId">Your Polymesh did</label>
              <input
                name="polymeshDid"
                id="customer-polymeshId"
                type="text"
                placeholder="0x12345"
                value={myInfo["info"]["polymeshDid"]}
                onChange={onMyInfoChanged}
                disabled={myInfo["id"] === ""}
              ></input>
            </div>

            <div className="submit">
              <button
                className="submit myUpdates"
                disabled={!myInfo["modified"]}
                onClick={submitMyInfo}
              >
                Submit your updated situation
              </button>
            </div>

            <div className="submit">
              <button
                className="submit myClaim"
                disabled={!myInfo["info"]["valid"]}
                onClick={fetchMyClaim}
              >
                Fetch My Claim
              </button>
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
          Powered by{" "}
          <img
            src="/polymath.svg"
            alt="Polymath Logo"
            className={styles.logo}
          />
        </a>
      </footer>
    </div>
  );
}
