import Head from "next/head"
import getConfig from "next/config"
import React, { useState } from "react"
import styles from "../styles/Home.module.css"
import {
  ClaimType,
  Condition,
  CurrentIdentity,
  IdentityCondition,
  PrimaryIssuanceAgentCondition,
  isMultiClaimCondition,
  isSingleClaimCondition,
  KnownTokenType,
  Requirement,
  SecurityToken,
  SecurityTokenDetails,
  TickerReservationDetails,
  TrustedClaimIssuer,
  Claim,
  isScopedClaim,
  UnscopedClaim,
  InvestorUniquenessClaim,
  CddClaim,
  ConditionType,
  ConditionTarget,
  ScopeType,
  CountryCode,
} from "@polymathnetwork/polymesh-sdk/types"
import { Polymesh, Keyring, BigNumber } from '@polymathnetwork/polymesh-sdk'
import { CountryInfo, getCountryList } from "../src/types"
import { Identity, PolymeshError, TickerReservation } from "@polymathnetwork/polymesh-sdk/internal"

const isIdentityCondition = (condition: Condition): condition is IdentityCondition => (condition as IdentityCondition).type === ConditionType.IsIdentity
const isPrimaryIssuanceAgentCondition = (condition: Condition): condition is PrimaryIssuanceAgentCondition => (condition as PrimaryIssuanceAgentCondition).type === ConditionType.IsPrimaryIssuanceAgent
const isUnScopedClaim = (claim: Claim): claim is UnscopedClaim => isCddClaim(claim) || (claim as UnscopedClaim).type === ClaimType.NoData
const isInvestorUniquenessClaim = (claim: Claim): claim is InvestorUniquenessClaim => (claim as InvestorUniquenessClaim).type === ClaimType.InvestorUniqueness
const isCddClaim = (claim: Claim): claim is CddClaim => (claim as CddClaim).type === ClaimType.CustomerDueDiligence

export default function Home() {
  const [myInfo, setMyInfo] = useState({
    ticker: "" as string,
    myDid: "" as string,
    myTickers: [] as string[],
    reservation: {
      fetchTimer: null as NodeJS.Timeout,
      current: null as TickerReservation,
      details: null as TickerReservationDetails,
      detailsJson: {
        owner: "null" as string,
        expiryDate: "null" as string,
        status: "null" as string,
      },
    } as ReservationInfoJson,
    token: {
      current: null as SecurityToken,
      details: null as SecurityTokenDetails,
      detailsJson: {
        name: "null" as string,
        assetType: "null" as string,
        owner: "null" as string,
        divisible: false as boolean,
        totalSupply: "null" as string,
        primaryIssuanceAgent: "null" as string,
      },
      ownershipTarget: "" as string,
    } as TokenInfoJson,
    requirements: {
      current: [] as Requirement[],
      arePaused: true as boolean,
      canManipulate: false as boolean,
      modified: false as boolean,
    } as RequirementsInfoJson,
  } as MyInfoJson)
  const countryList: CountryInfo[] = getCountryList()

  type MyInfoJson = {
    ticker: string,
    myDid: string,
    myTickers: string[],
    reservation: ReservationInfoJson,
    token: TokenInfoJson,
    requirements: RequirementsInfoJson,
  }

  type ReservationInfoJson = {
    fetchTimer: NodeJS.Timeout,
    current: TickerReservation,
    details: TickerReservationDetails,
    detailsJson: {
      owner: string,
      expiryDate: string,
      status: string,
    }
  }

  type TokenInfoJson = {
    current: SecurityToken,
    details: SecurityTokenDetails,
    detailsJson: {
      name: string,
      assetType: string,
      owner: string,
      divisible: boolean,
      totalSupply: string,
      primaryIssuanceAgent: string,
    },
    ownershipTarget: string,
  }

  type RequirementsInfoJson = {
    current: Requirement[],
    arePaused: boolean,
    canManipulate: boolean,
    modified: boolean,
  }

  interface HasFetchTimer {
    fetchTimer: NodeJS.Timeout | null
  }

  function setStatus(content: string): void {
    const element = document.getElementById("status") as HTMLElement
    element.innerHTML = content
  }

  function presentLongHex(hex: string): string {
    const first: string = hex.slice(0, 8)
    const last: string = hex.slice(-6)
    return `${first}...${last}`
  }

  async function getPolyWalletApi(): Promise<Polymesh> {
    setStatus("Getting your Polymesh Wallet")
    if (typeof (window || {})["api"] !== "undefined") return (window || {})["api"]
    // Move to top of the file when compilation error no longer present.
    const {
      web3Accounts,
      web3AccountsSubscribe,
      web3Enable,
      web3FromAddress,
      web3ListRpcProviders,
      web3UseRpcProvider
    } = require('@polkadot/extension-dapp')

    const {
      publicRuntimeConfig: {
        appName,
      }
    } = getConfig()
    const polkaDotExtensions = await web3Enable(appName)
    const polyWallets = polkaDotExtensions.filter(injected => injected.name === "polywallet")
    if (polyWallets.length == 0) {
      setStatus("You need to install the Polymesh Wallet extension")
      throw new Error("No Polymesh Wallet")
    }
    const polyWallet = polyWallets[0]
    setStatus("Verifying network")
    const network = await polyWallet.network.get()
    polyWallet.network.subscribe(() => window.location.reload())
    web3AccountsSubscribe(() => window.location.reload())
    setStatus("Fetching your account")
    const myAccounts = await polyWallet.accounts.get()
    if (myAccounts.length == 0) {
      setStatus("You need to create an account in the Polymesh Wallet extension")
      return
    }
    const myAccount = myAccounts[0]
    const myKeyring = new Keyring()
    myKeyring.addFromAddress(myAccount.address)
    setStatus("Building your API");
    const api: Polymesh = await Polymesh.connect({
      nodeUrl: network.wssUrl,
      keyring: myKeyring,
      signer: polyWallet.signer,
    });
    (window || {})["api"] = api
    const myIdentity: CurrentIdentity = await api.getCurrentIdentity()
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      myDid: myIdentity.did
    }))
    return (window || {})["api"]
  }

  function replaceFetchTimer(where: HasFetchTimer, todo: () => void): NodeJS.Timeout {
    if (where.fetchTimer !== null) clearTimeout(where.fetchTimer)
    const timer: NodeJS.Timeout = setTimeout(todo, 1000)
    where.fetchTimer = timer
    return timer
  }

  async function loadYourTickers(): Promise<string[]> {
    const api: Polymesh = await getPolyWalletApi()
    const me: CurrentIdentity = await api.getCurrentIdentity()
    const myTokens: SecurityToken[] = await api.getSecurityTokens({ owner: me })
    const myReservations: TickerReservation[] = await api.getTickerReservations({ owner: me });
    const myTickers: string[] = [...myTokens, ...myReservations]
      .map((element: SecurityToken | TickerReservation) => element.ticker)
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      myTickers,
    }))
    return myTickers
  }

  async function onTickerChanged(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const ticker: string = e.target.value
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      ticker,
    }))
    replaceFetchTimer(myInfo.reservation, async () => await loadReservation(ticker))
  }

  function returnUpdated(previous: object, path: (string | number)[], field: string | number, value: any) {
    if (path.length == 0 && typeof field === "number" && Array.isArray(previous)) return [
      ...previous.slice(0, field),
      value,
      ...previous.slice(field + 1),
    ]
    if (path.length == 0) return {
      ...previous,
      [field]: value,
    }
    if (typeof path[0] === "number" && Array.isArray(previous)) return [
      ...previous.slice(0, path[0]),
      returnUpdated(previous[path[0]], path.slice(1), field, value),
      ...previous.slice(path[0] + 1),
    ]
    return {
      ...previous,
      [path[0]]: returnUpdated(previous[path[0]], path.slice(1), field, value),
    }
  }

  function checkboxProcessor(e): boolean {
    return e.target.checked
  }

  function onValueChangedCreator(path: (string | number)[], field: string | number, valueProcessor?: (e) => Promise<any>) {
    return async function (e): Promise<void> {
      let info = myInfo
      path.forEach((pathBit: string) => {
        info = info[pathBit]
      })
      const value = valueProcessor ? await valueProcessor(e) : e.target.value
      setMyInfo((prevInfo) => returnUpdated(prevInfo, path, field, value))
      if (field === "ticker") replaceFetchTimer(myInfo.reservation, async () => {
        await Promise.all([
          loadReservation(value),
          loadToken(value),
        ])
      })
    }
  }

  async function reserveTicker(): Promise<TickerReservation> {
    const api: Polymesh = await getPolyWalletApi()
    setStatus("Reserving ticker")
    const reservation: TickerReservation = await (await api.reserveTicker({ ticker: myInfo.ticker })).run()
    await setReservation(reservation)
    return reservation
  }

  async function loadReservation(ticker: string): Promise<TickerReservation> {
    const api: Polymesh = await getPolyWalletApi()
    let reservation: TickerReservation = null
    try {
      setStatus("Fetching ticker reservation")
      reservation = await api.getTickerReservation({ ticker })
    } catch (e) {
      if (!(e instanceof PolymeshError)) {
        throw e
      }
    }
    await setReservation(reservation)
    return reservation
  }

  async function setReservation(reservation: TickerReservation | null): Promise<void> {
    if (reservation === null) {
      setMyInfo((prevInfo) => ({
        ...prevInfo,
        reservation: {
          ...prevInfo.reservation,
          current: null,
          details: null,
          detailsJson: {
            owner: "null",
            expiryDate: "null",
            status: "null",
          },
        },
      }))
      setToken(null)
    } else {
      const details: TickerReservationDetails = await reservation.details()
      setMyInfo((prevInfo) => ({
        ...prevInfo,
        reservation: {
          ...prevInfo.reservation,
          current: reservation,
          details: details,
          detailsJson: {
            owner: details.owner.did,
            expiryDate: details.expiryDate?.toISOString() || "null",
            status: details.status,
          },
        },
      }))
      await loadToken(reservation.ticker)
    }
  }

  async function transferReservationOwnership(): Promise<void> {
    const api: Polymesh = await getPolyWalletApi()
    alert("Not implemented in the SDK yet")
  }

  async function createSecurityToken(): Promise<SecurityToken> {
    setStatus("Creating token")
    const token: SecurityToken = await (await myInfo.reservation.current?.createToken({
      name: myInfo.token.detailsJson.name,
      totalSupply: new BigNumber("0"),
      isDivisible: myInfo.token.detailsJson.divisible,
      tokenType: KnownTokenType.EquityPreferred,
    })).run()
    await setToken(token)
    await loadReservation(myInfo.ticker)
    return token
  }

  async function loadToken(ticker: string): Promise<SecurityToken> {
    const api: Polymesh = await getPolyWalletApi()
    let token: SecurityToken = null
    try {
      setStatus("Fetching token")
      token = await api.getSecurityToken({ ticker })
    } catch (e) {
      if (!(e instanceof PolymeshError)) {
        throw e
      }
    }
    await setToken(token)
    return token
  }

  async function setToken(token: SecurityToken | null): Promise<void> {
    if (token === null) {
      setMyInfo((prevInfo) => ({
        ...prevInfo,
        token: {
          ...prevInfo.token,
          current: null,
          details: null,
          detailsJson: {
            name: "null",
            assetType: "null",
            owner: "null",
            divisible: false,
            totalSupply: "null",
            primaryIssuanceAgent: "null",
          },
        },
      }))
      setComplianceRequirements(null, null)
    } else {
      const details: SecurityTokenDetails = await token.details()
      setMyInfo((prevInfo) => ({
        ...prevInfo,
        token: {
          ...prevInfo.token,
          current: token,
          details: details,
          detailsJson: {
            name: details.name,
            assetType: details.assetType,
            owner: details.owner.did,
            divisible: details.isDivisible,
            totalSupply: details.totalSupply.toString(10),
            primaryIssuanceAgent: details.primaryIssuanceAgent.did,
          },
        },
      }))
      await loadComplianceRequirements(token)
    }
  }

  async function transferTokenOwnership(): Promise<void> {
    setStatus("Transferring token ownership")
    const token: SecurityToken = await (await myInfo.token.current.transferOwnership({
      target: myInfo.token.ownershipTarget,
    })).run()
    setStatus("Token ownership transferred")
    await setToken(token)
    await loadYourTickers()
  }

  async function loadComplianceRequirements(token: SecurityToken): Promise<Requirement[]> {
    setStatus("Loading compliance requirements")
    const requirements: Requirement[] = await token.compliance.requirements.get()
    const arePaused: boolean = await token.compliance.requirements.arePaused()
    await setComplianceRequirements(token, requirements, arePaused)
    return requirements
  }

  async function setComplianceRequirements(token: SecurityToken | null, requirements: Requirement[] | null, arePaused: boolean) {
    if (token === null || requirements === null) {
      setMyInfo((prevInfo) => ({
        ...prevInfo,
        requirements: {
          ...prevInfo.requirements,
          current: [],
          arePaused: false,
          canManipulate: false,
          modified: false,
        },
      }))
    } else {
      setMyInfo((prevInfo) => ({
        ...prevInfo,
        requirements: {
          ...prevInfo.requirements,
          current: requirements,
          arePaused,
          canManipulate: prevInfo.token?.details?.owner?.did == prevInfo.myDid,
          modified: false,
        },
      }))
    }
  }

  function onRequirementChangedCreator(path: (string | number)[], field: string | number, valueProcessor?: (e) => Promise<any>) {
    return async function (e): Promise<void> {
      await onValueChangedCreator(path, field, valueProcessor)(e)
      setMyInfo((prevInfo) => ({
        ...prevInfo,
        requirements: {
          ...prevInfo.requirements,
          modified: true,
        }
      }))
    }
  }

  function presentTrustedClaimIssuer(trustedIssuer: TrustedClaimIssuer, requirementIndex: number, conditionIndex: number, issuerIndex: number) {
    const trustedFor = trustedIssuer.trustedFor
      ? <ul>{
        trustedIssuer.trustedFor.map((claimType: ClaimType, claimTypeIndex: number) => <li>
          <select defaultValue={claimType} onChange={onRequirementChangedCreator([...getTrustedIssuerPath(requirementIndex, conditionIndex, issuerIndex), "trustedFor"], claimTypeIndex)} disabled={!myInfo.requirements.canManipulate}>{
            (() => {
              const selects = []
              for (const claimType in ClaimType) selects.push(<option value={claimType} key={claimType}>{claimType}</option>)
              return selects
            })()
          }</select>&nbsp;<button className="submit remove-trusted-for" onClick={() => removeTrustedFor(requirementIndex, conditionIndex, issuerIndex, claimTypeIndex)} disabled={!myInfo.requirements.canManipulate}>Remove {claimTypeIndex}</button>
        </li>)
      }</ul>
      : <div>Not trusted for anything</div>
    return <ul>
      <li>Did: <input defaultValue={trustedIssuer.identity?.did} placeholder="0x123"
        onChange={onRequirementChangedCreator(
          getTrustedIssuerPath(requirementIndex, conditionIndex, issuerIndex),
          "identity",
          async (e) => {
            const api = await getPolyWalletApi()
            return api.getIdentity({ did: e.target.value })
          })}
          disabled={!myInfo.requirements.canManipulate}
      />
      </li>
      <li>Trusted for:&nbsp;
        <button className="submit add-trusted-for" onClick={() => addTrustedFor(requirementIndex, conditionIndex, issuerIndex)} disabled={!myInfo.requirements.canManipulate}>Add trusted for</button>
        {trustedFor}
      </li>
    </ul>
  }

  function addTrustedFor(requirementIndex: number, conditionIndex: number, issuerIndex: number): void {
    setMyInfo((prevInfo) => {
      const trustedIssuer: TrustedClaimIssuer = prevInfo.requirements.current[requirementIndex].conditions[conditionIndex].trustedClaimIssuers[issuerIndex]
      const updatedTrustedFor: ClaimType[] = [
        ...(trustedIssuer.trustedFor || []),
        ClaimType.Accredited,
      ]
      return returnUpdated(
        prevInfo,
        getTrustedIssuerPath(requirementIndex, conditionIndex, issuerIndex),
        "trustedFor",
        updatedTrustedFor)
    })
  }

  function removeTrustedFor(requirementIndex: number, conditionIndex: number, issuerIndex: number, trustedForIndex: number): void {
    setMyInfo((prevInfo) => {
      const trustedIssuer: TrustedClaimIssuer = prevInfo.requirements.current[requirementIndex].conditions[conditionIndex].trustedClaimIssuers[issuerIndex]
      const updatedTrustedFor: ClaimType[] = trustedIssuer.trustedFor ? [
        ...trustedIssuer.trustedFor.slice(0, trustedForIndex),
        ...trustedIssuer.trustedFor.slice(trustedForIndex + 1),
      ] : []
      return returnUpdated(
        prevInfo,
        getTrustedIssuerPath(requirementIndex, conditionIndex, issuerIndex),
        "trustedFor",
        updatedTrustedFor)
    })
  }

  function presentTrustedClaimIssuers(trustedIssuers: TrustedClaimIssuer[] | null, requirementIndex: number, conditionIndex: number) {
    if (typeof trustedIssuers === "undefined" || trustedIssuers === null || trustedIssuers.length === 0) return <div>No trusted issuers</div>
    return <ul>{
      trustedIssuers
        .map((trustedIssuer: TrustedClaimIssuer, issuerIndex: number) => presentTrustedClaimIssuer(trustedIssuer, requirementIndex, conditionIndex, issuerIndex))
        .map((presented, index: number) => <li>
          Issuer {index}:&nbsp;
          <button className="submit remove-trusted-claim-issuer" onClick={() => removeTrustedClaimIssuer(requirementIndex, conditionIndex, index)} disabled={!myInfo.requirements.canManipulate}>Remove {index}</button>
          {presented}
        </li>)
    }</ul>
  }

  function addTrustedClaimIssuer(requirementIndex: number, conditionIndex: number): void {
    setMyInfo((prevInfo) => {
      const condition: Condition = prevInfo.requirements.current[requirementIndex].conditions[conditionIndex]
      const updatedIssuers: TrustedClaimIssuer[] = [
        ...(condition.trustedClaimIssuers || []),
        {
          identity: null,
          trustedFor: []
        }
      ]
      return returnUpdated(
        prevInfo,
        getConditionPath(requirementIndex, conditionIndex),
        "trustedClaimIssuers",
        updatedIssuers)
    })
  }

  function removeTrustedClaimIssuer(requirementIndex: number, conditionIndex: number, issuerIndex: number): void {
    setMyInfo((prevInfo) => {
      const condition: Condition = prevInfo.requirements.current[requirementIndex].conditions[conditionIndex]
      const updatedIssuers = condition.trustedClaimIssuers ? [
        ...condition.trustedClaimIssuers.slice(0, issuerIndex),
        ...condition.trustedClaimIssuers.slice(issuerIndex + 1),
      ] : []
      return returnUpdated(
        prevInfo,
        getConditionPath(requirementIndex, conditionIndex),
        "trustedClaimIssuers",
        updatedIssuers)
    })
  }

  function getTrustedIssuerPath(requirementIndex: number, conditionIndex: number, issuerIndex: number): (string | number)[] {
    return [
      ...getConditionPath(requirementIndex, conditionIndex),
      "trustedClaimIssuers",
      issuerIndex
    ]
  }

  function presentClaim(claim: Claim, requirementIndex: number, conditionIndex: number, claimIndex: number | null) {
    const elements = [
      <li>Type: &nbsp;<select defaultValue={claim.type} onChange={onRequirementChangedCreator(getClaimPath(requirementIndex, conditionIndex, claimIndex), "type")} disabled={!myInfo.requirements.canManipulate}>{
        (() => {
          const selects = []
          for (const claimType in ClaimType) selects.push(<option value={claimType} key={claimType}>{claimType}</option>)
          return selects
        })()
      }</select>
      </li>
    ]
    if (isCddClaim(claim)) {
      elements.push(<li>Id: <input defaultValue={claim.id} placeholder="123"
        onChange={onRequirementChangedCreator(getClaimPath(requirementIndex, conditionIndex, claimIndex), "id")}  disabled={!myInfo.requirements.canManipulate}/>
      </li>)
    }
    if (isScopedClaim(claim)) {
      elements.push(<li>Scope type: &nbsp;
            <select defaultValue={claim.scope?.type} onChange={onRequirementChangedCreator([...getClaimPath(requirementIndex, conditionIndex, claimIndex), "scope"], "type")} disabled={!myInfo.requirements.canManipulate}>{
          (() => {
            const selects = []
            for (const scopeType in ScopeType) selects.push(<option value={scopeType} key={scopeType}>{scopeType}</option>)
            return selects
          })()
        }</select>
      </li>)
      elements.push(<li>Scope value: <input defaultValue={claim.scope?.value} placeholder="ACME"
        onChange={onRequirementChangedCreator([...getClaimPath(requirementIndex, conditionIndex, claimIndex), "scope"], "value")} disabled={!myInfo.requirements.canManipulate}/>
      </li>)
    }
    if (isInvestorUniquenessClaim(claim)) {
      elements.push(<li>CDD id: <input defaultValue={claim.cddId} placeholder="123"
        onChange={onRequirementChangedCreator(getClaimPath(requirementIndex, conditionIndex, claimIndex), "cddId")} disabled={!myInfo.requirements.canManipulate} />
      </li>)
      elements.push(<li>Scope id: <input defaultValue={claim.scopeId} placeholder="123"
        onChange={onRequirementChangedCreator(getClaimPath(requirementIndex, conditionIndex, claimIndex), "scopeId")} disabled={!myInfo.requirements.canManipulate} />
      </li>)
    }
    if (claim.type === ClaimType.Jurisdiction) {
      elements.push(<li>Country code: &nbsp;
        <select defaultValue={claim.code} onChange={onRequirementChangedCreator(getClaimPath(requirementIndex, conditionIndex, claimIndex), "code")} disabled={!myInfo.requirements.canManipulate}>{
          (() => {
            const selects = []
            for (const country in CountryCode) selects.push(<option value={country} key={country}>{country}</option>)
            return selects
          })()
        }</select>
      </li>)
    }
    return <ul>{elements}</ul>
  }

  function presentClaims(claims: Claim[] | null, requirementIndex: number, conditionIndex: number) {
    if (typeof claims === "undefined" || claims === null || claims.length === 0) return <div>No claims</div>
    return <ul>{
      claims
        .map((claim: Claim, claimIndex: number) => presentClaim(claim, requirementIndex, conditionIndex, claimIndex))
        .map((presented, index: number) => <li>
          Claim {index}:{presented}
        </li>)
    }</ul>
  }

  function getClaimPath(requirementIndex: number, conditionIndex: number, claimIndex: number | null): (string | number)[] {
    if (claimIndex === null) return [
      ...getConditionPath(requirementIndex, conditionIndex),
      "claim",
    ]
    return [
      ...getConditionPath(requirementIndex, conditionIndex),
      "claims",
      claimIndex,
    ]
  }

  function presentCondition(condition: Condition, requirementIndex: number, conditionIndex: number) {
    const elements = [
      <li>
        Target: <select defaultValue={condition.target} onChange={onRequirementChangedCreator(getConditionPath(requirementIndex, conditionIndex), "target")} disabled={!myInfo.requirements.canManipulate}>{
          (() => {
            const selects = []
            for (const targetType in ConditionTarget) selects.push(<option value={targetType} key={targetType}>{targetType}</option>)
            return selects
          })()
        }</select>
      </li>,
      <li>Trusted claim issuers:&nbsp;
        <button className="submit add-trusted-claim-issuer" onClick={() => addTrustedClaimIssuer(requirementIndex, conditionIndex)} disabled={!myInfo.requirements.canManipulate}>Add trusted claim issuer</button>
        {presentTrustedClaimIssuers(condition.trustedClaimIssuers, requirementIndex, conditionIndex)}
      </li>,
      <li>
        Type: <select defaultValue={condition.type} onChange={onRequirementChangedCreator(getConditionPath(requirementIndex, conditionIndex), "type")} disabled={!myInfo.requirements.canManipulate}>{
          (() => {
            const selects = []
            for (const conditionType in ConditionType) selects.push(<option value={conditionType} key={conditionType}>{conditionType}</option>)
            return selects
          })()
        }</select>
      </li>,
    ]
    if (isSingleClaimCondition(condition)) {
      elements.push(<li>Claim: {presentClaim(condition.claim, requirementIndex, conditionIndex, null)}</li>)
    } else if (isMultiClaimCondition(condition)) {
      elements.push(<li>Claims: {presentClaims(condition.claims, requirementIndex, conditionIndex)}</li>)
    } else if (isIdentityCondition(condition)) {
      elements.push(<li>
        Identity: <input defaultValue={condition.identity?.did} placeholder="0x123"
          onChange={onRequirementChangedCreator(
            getConditionPath(requirementIndex, conditionIndex),
            "identity",
            async (e) => {
              const api = await getPolyWalletApi()
              return api.getIdentity({ did: e.target.value })
            })}
            disabled={!myInfo.requirements.canManipulate}
        />
      </li>)
    } else if (isPrimaryIssuanceAgentCondition(condition)) { // Nothing to do
    } else {
      throw new Error(`Unknown condition type: ${condition}`)
    }
    return <ul>{elements}</ul>
  }

  function presentConditions(conditions: Condition[] | null, requirementIndex: number) {
    if (conditions === null || conditions.length === 0) return <div>No conditions</div>
    return <ul>{
      conditions
        .map((condition: Condition, conditionIndex: number) => presentCondition(condition, requirementIndex, conditionIndex))
        .map((presented, index: number) => <li>
          Condition {index}:&nbsp;
        <button className="submit remove-condition" onClick={() => removeCondition(requirementIndex, index)} disabled={!myInfo.requirements.canManipulate}>Remove {index}</button>
          {presented}
        </li>)
    }</ul>
  }

  function addCondition(requirementIndex: number): void {
    setMyInfo((prevInfo) => {
      const requirement: Requirement = prevInfo.requirements.current[requirementIndex]
      const updatedConditions: Condition[] = [
        ...requirement.conditions,
        {
          target: null,
          type: ConditionType.IsPresent,
          claim: {
            type: ClaimType.NoData
          }
        },
      ]
      return returnUpdated(
        prevInfo,
        getRequirementPath(requirementIndex),
        "conditions",
        updatedConditions)
    })
  }

  function removeCondition(requirementIndex: number, conditionIndex: number): void {
    setMyInfo((prevInfo) => {
      const requirement: Requirement = prevInfo.requirements.current[requirementIndex]
      const updatedConditions: Condition[] = [
        ...requirement.conditions.slice(0, conditionIndex),
        ...requirement.conditions.slice(conditionIndex + 1)
      ]
      return returnUpdated(
        prevInfo,
        getRequirementPath(requirementIndex),
        "conditions",
        updatedConditions)
    })
  }

  function getConditionPath(requirementIndex: number, conditionIndex: number): (string | number)[] {
    return [
      ...getRequirementPath(requirementIndex),
      "conditions",
      conditionIndex
    ]
  }

  function presentRequirement(requirement: Requirement, requirementIndex: number) {
    return <ul>
      <li>Id: {requirement.id}</li>
      <li>Conditions:&nbsp;
        <button className="submit add-condition" onClick={() => addCondition(requirementIndex)} disabled={!myInfo.requirements.canManipulate}>Add condition</button>
        {presentConditions(requirement.conditions, requirementIndex)}
      </li>
    </ul>
  }

  function presentRequirements(requirements?: Requirement[]) {
    if (requirements === null || requirements.length === 0) return <div>No requirements</div>
    return <ul>{
      requirements.map(presentRequirement).map((presented, index: number) => <li>
        Requirement {index}:&nbsp;
        <button className="submit remove-requirement" onClick={() => removeRequirement(index)} disabled={!myInfo.requirements.canManipulate}>Remove {index}</button>
        {presented}
      </li>)
    }</ul>
  }

  function addRequirement(): void {
    setMyInfo((prevInfo) => {
      const updatedCurrent: Requirement[] = [
        ...prevInfo.requirements.current,
        {
          id: prevInfo.requirements.current.length,
          conditions: []
        }
      ]
      return {
        ...prevInfo,
        requirements: {
          ...prevInfo.requirements,
          current: updatedCurrent,
          modified: true,
        },
      };
    })
  }

  function removeRequirement(requirementIndex: number): void {
    setMyInfo((prevInfo) => {
      const updatedCurrent = [
        ...prevInfo.requirements.current.slice(0, requirementIndex),
        ...prevInfo.requirements.current.slice(requirementIndex + 1),
      ]
      return {
        ...prevInfo,
        requirements: {
          ...prevInfo.requirements,
          current: updatedCurrent,
          modified: true,
        },
      };
    })
  }

  function getRequirementPath(requirementIndex: number): (string | number)[] {
    return ["requirements", "current", requirementIndex]
  }

  async function saveRequirements(): Promise<SecurityToken> {
    const updatedToken = await (await myInfo.token.current.compliance.requirements.set({
      requirements: myInfo.requirements.current.map((requirement: Requirement) => requirement.conditions)
    })).run()
    setToken(updatedToken)
    return updatedToken
  }

  async function pauseCompliance(): Promise<SecurityToken> {
    const updatedToken: SecurityToken = await (await myInfo.token.current.compliance.requirements.pause()).run()
    setToken(updatedToken)
    return updatedToken
  }

  async function resumeCompliance(): Promise<SecurityToken> {
    const updatedToken: SecurityToken = await (await myInfo.token.current.compliance.requirements.unpause()).run()
    setToken(updatedToken)
    return updatedToken
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Simple Token Manager</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to the Simple Token Manager
        </h1>

        <fieldset className={styles.card}>
          <legend>What ticker do you want to manage?</legend>

          <div>
            <input name="ticker" id="ticker" type="text" placeholder="ACME" value={myInfo.ticker} onChange={onTickerChanged} />
          </div>
          <div>
            <select name="myTickers" defaultValue={myInfo.token.detailsJson.assetType} onChange={onValueChangedCreator([], "ticker")}>
              <option value="" key="">Select 1</option>
              {
                myInfo.myTickers.map((myTicker: string) => <option value={myTicker} key={myTicker}>{myTicker}</option>)
              }
            </select>
            &nbsp;
            <button className="submit my-tickers" onClick={loadYourTickers}>Load my tickers</button>
          </div>
          <div className="submit">
            <button className="submit reservation" onClick={reserveTicker} disabled={myInfo.reservation.current !== null}>Reserve</button>
          </div>

        </fieldset>

        <div id="status" className={styles.status}>
          Latest status will show here
        </div>

        <fieldset className={styles.card}>
          <legend>Ticker Reservation: {myInfo.reservation.current?.ticker}</legend>

          <div>{
            (() => {
              if (myInfo.reservation.current === null) return "There is no reservation"
              else return <ul>
                <li>Owned by: {myInfo.reservation.detailsJson.owner === myInfo.myDid ? "me" : presentLongHex(myInfo.reservation.detailsJson.owner)}</li>
                <li>With status: {myInfo.reservation.detailsJson.status}</li>
                <li>Valid until: {myInfo.reservation.detailsJson.expiryDate}</li>
              </ul>
            })()
          }</div>

          <div>{
            (() => {
              const canCreate: boolean = myInfo.reservation.current !== null && myInfo.reservation.detailsJson.status === "Reserved" && myInfo.reservation.detailsJson.owner === myInfo.myDid
              return <div>
                <div className="submit">
                  <button className="submit transfer-reservation" onClick={transferReservationOwnership} disabled={!canCreate}>Transfer ownership</button>
                </div>
                <br />
                <div>
                  <label htmlFor="token-name">
                    <span className={styles.hasTitle} title="Long name of your security token">Name</span>
                  </label>
                  <input name="token-name" type="text" placeholder="American CME" value={myInfo.token.detailsJson.name} disabled={!canCreate} onChange={onValueChangedCreator(["token", "detailsJson"], "name")} />
                </div>
                <div>
                  <label htmlFor="token-divisible">
                    <span className={styles.hasTitle} title="Whether it can be sub-divided">Divisible</span>
                  </label>
                  <input name="token-divisible" type="checkbox" defaultChecked={myInfo.token.detailsJson.divisible} disabled={!canCreate} onChange={onValueChangedCreator(["token", "detailsJson"], "divisible", checkboxProcessor)} />
                </div>
                <div>
                  <label htmlFor="token-assetType">
                    <span className={styles.hasTitle} title="Pick one from the list or type what you want">Asset Type</span>
                  </label>
                  <input name="token-assetType" type="text" placeholder="Equity Common" value={myInfo.token.detailsJson.assetType} disabled={!canCreate} onChange={onValueChangedCreator(["token", "detailsJson"], "assetType")} />
                  &nbsp;
                  <select name="known-assetTypes" defaultValue={myInfo.token.detailsJson.assetType} disabled={!canCreate} onChange={onValueChangedCreator(["token", "detailsJson"], "assetType")}>{
                    (() => {
                      const created = []
                      for (const knownType in KnownTokenType) {
                        created.push(<option value={knownType} key={knownType}>{knownType}</option>)
                      }
                      return created
                    })()
                  }</select>
                </div>
                <div className="submit">
                  <button className="submit create-token" onClick={createSecurityToken} disabled={!canCreate}>Create token</button>
                </div>
              </div>
            })()
          }</div>

        </fieldset>

        <fieldset className={styles.card}>
          <legend>Security Token: {myInfo.token.current?.ticker}</legend>

          <div>{
            (() => {
              if (myInfo.token.current === null) return "There is no token"
              else return <ul>
                <li>Owned by: {myInfo.token.detailsJson.owner === myInfo.myDid ? "me" : presentLongHex(myInfo.reservation.detailsJson.owner)}</li>
                <li>As asset type: {myInfo.token.detailsJson.assetType}</li>
                <li>{myInfo.token.detailsJson.divisible ? "" : "not"} divisible</li>
                <li>With PIA: {myInfo.token.detailsJson.primaryIssuanceAgent === myInfo.myDid ? "me" : presentLongHex(myInfo.token.detailsJson.primaryIssuanceAgent)}</li>
                <li>And total supply of: {myInfo.token.detailsJson.totalSupply}</li>
              </ul>
            })()
          }</div>

          <div>{
            (() => {
              const canManipulate: boolean = myInfo.token.current !== null && myInfo.token.detailsJson.owner === myInfo.myDid
              return <div>
                <div className="submit">
                  New owner:&nbsp;
                  <input name="token-ownership-target" type="text" placeholder="0x1234" value={myInfo.token.ownershipTarget} disabled={!canManipulate} onChange={onValueChangedCreator(["token"], "ownershipTarget")} />
                  &nbsp;
                  <button className="submit transfer-token" onClick={transferTokenOwnership} disabled={!canManipulate}>Transfer ownership</button>
                </div>
              </div>
            })()
          }</div>

        </fieldset>

        <fieldset className={styles.card}>
          <legend>Compliance Requirements For: {myInfo.token.current?.ticker}</legend>

          <div className="submit">
            <button className="submit add-requirement" onClick={() => addRequirement()} disabled={!myInfo.requirements.canManipulate}>Add requirement</button>
          </div>

          <div>{presentRequirements(myInfo.requirements.current)}</div>

          <div>{
            (() => {
              const canManipulate: boolean = myInfo.token.current !== null && myInfo.token.detailsJson.owner === myInfo.myDid && myInfo.requirements.modified
              return <div className="submit">
                <button className="submit save-requirements" onClick={saveRequirements} disabled={!canManipulate}>Save requirements</button>
              </div>
            })()
          }</div>

          <div>{
            <div className="submit">
              <button className="submit pause-compliance" onClick={pauseCompliance} disabled={!myInfo.requirements.canManipulate || myInfo.requirements.arePaused}>Pause compliance</button>
              &nbsp;
              <button className="submit resume-compliance" onClick={resumeCompliance} disabled={!myInfo.requirements.canManipulate || !myInfo.requirements.arePaused}>Resume compliance</button>
            </div>
          }</div>

        </fieldset>

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