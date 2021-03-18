import Head from "next/head"
import React, { useState } from "react"
import styles from "../styles/Home.module.css"
import {
  ClaimType,
  Compliance,
  Condition,
  CurrentIdentity,
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
  ConditionType,
  ConditionTarget,
  ScopeType,
  CountryCode,
  ResultSet,
  ClaimData,
  isInvestorUniquenessClaim,
  Scope,
  ClaimTarget,
  IdentityWithClaims,
  Identity,
  CddClaim,
} from "@polymathnetwork/polymesh-sdk/types"
import { Polymesh, BigNumber } from '@polymathnetwork/polymesh-sdk'
import {
  AttestationsInfoJSON,
  CountryInfo,
  getCountryList,
  isCddClaim,
  isClaimData,
  isIdentityCondition,
  isPrimaryIssuanceAgentCondition,
  MyInfoJson,
  RequirementsInfoJson,
  ReservationInfoJson,
  TokenInfoJson,
} from "../src/types"
import { PolymeshError, TickerReservation } from "@polymathnetwork/polymesh-sdk/internal"
import {
  checkboxProcessor,
  findValue,
  getBasicPolyWalletApi,
  presentLongHex,
  replaceFetchTimer,
  returnUpdated,
  returnUpdatedCreator,
} from "../src/ui-helpers"
import { ClaimOperation } from "@polymathnetwork/polymesh-sdk/types/internal"

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
      settleSimulation: {
        sender: "" as string,
        recipient: "" as string,
        works: null as boolean | null,
      },
    } as RequirementsInfoJson,
    attestations: {
      current: [] as ClaimData<Claim>[],
      otherTarget: "" as string,
      toAdd: {
        target: "" as string,
        expiry: null as Date | null,
        claim: {
          type: ClaimType.NoData,
        } as Claim,
      } as ClaimTarget,
    } as AttestationsInfoJSON,
  } as MyInfoJson)
  const countryList: CountryInfo[] = getCountryList()

  function setStatus(content: string): void {
    const element = document.getElementById("status") as HTMLElement
    element.innerHTML = content
  }

  async function getPolyWalletApi(): Promise<Polymesh> {
    const api: Polymesh = await getBasicPolyWalletApi(setStatus)
    const myIdentity: CurrentIdentity = await api.getCurrentIdentity()
    setMyInfo((prevInfo) => ({
      ...prevInfo,
      myDid: myIdentity.did
    }))
    return api
  }

  async function getMyIdentity(): Promise<CurrentIdentity> {
    return (await getPolyWalletApi()).getCurrentIdentity()
  }

  async function getMyDid(): Promise<string> {
    return (await getMyIdentity()).did
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

  function onValueChangedCreator(path: (string | number)[], valueProcessor?: (e) => Promise<any>) {
    return async function (e): Promise<void> {
      const value = valueProcessor ? await valueProcessor(e) : e.target.value
      setMyInfo(returnUpdatedCreator(path, value))
      if (path[path.length - 1] === "ticker") replaceFetchTimer(myInfo.reservation, async () => {
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
    const token: SecurityToken = await (await myInfo.reservation.current.createToken({
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
      setComplianceRequirements(null, null, true)
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

  function onRequirementChangedCreator(path: (string | number)[], valueProcessor?: (e) => Promise<any>) {
    return async function (e): Promise<void> {
      await onValueChangedCreator(path, valueProcessor)(e)
      setMyInfo((prevInfo) => ({
        ...prevInfo,
        requirements: {
          ...prevInfo.requirements,
          modified: true,
        }
      }))
    }
  }

  function presentTrustedClaimIssuer(trustedIssuer: TrustedClaimIssuer, location: (string | number)[], canManipulate: boolean) {
    const trustedFor = trustedIssuer.trustedFor
      ? <ul>{
        trustedIssuer.trustedFor.map((claimType: ClaimType, claimTypeIndex: number) => <li key={claimTypeIndex}>
          <select defaultValue={claimType} onChange={onRequirementChangedCreator([...location, "trustedFor", claimTypeIndex])} disabled={!canManipulate}>{
            (() => {
              const selects = []
              for (const claimType in ClaimType) selects.push(<option value={claimType} key={claimType}>{claimType}</option>)
              return selects
            })()
          }</select>&nbsp;<button className="submit remove-trusted-for" onClick={() => removeFromMyInfoArray([...location, "trustedFor", claimTypeIndex])} disabled={!canManipulate}>Remove {claimTypeIndex}</button>
        </li>)
      }</ul>
      : <div>Not trusted for anything</div>
    return <ul>
      <li key="identity">Did: <input defaultValue={trustedIssuer.identity?.did} placeholder="0x123"
        onChange={onRequirementChangedCreator(
          [...location, "identity"],
          async (e) => {
            const api = await getPolyWalletApi()
            return api.getIdentity({ did: e.target.value })
          })}
        disabled={!canManipulate}
      />
      </li>
      <li key="trustedFor">Trusted for:&nbsp;
        <button className="submit add-trusted-for" onClick={() => addToMyInfoArray([...location, "trustedFor"], ClaimType.Accredited)} disabled={!canManipulate}>Add trusted for</button>
        {trustedFor}
      </li>
    </ul>
  }

  function presentTrustedClaimIssuers(trustedIssuers: TrustedClaimIssuer[] | null, location: (string | number)[], canManipulate: boolean) {
    if (typeof trustedIssuers === "undefined" || trustedIssuers === null || trustedIssuers.length === 0) return <div>No trusted issuers</div>
    return <ul>{
      trustedIssuers
        .map((trustedIssuer: TrustedClaimIssuer, issuerIndex: number) => presentTrustedClaimIssuer(trustedIssuer, [...location, issuerIndex], canManipulate))
        .map((presented, issuerIndex: number) => <li key={issuerIndex}>
          Issuer {issuerIndex}:&nbsp;
          <button className="submit remove-trusted-claim-issuer" onClick={() => removeFromMyInfoArray([...location, issuerIndex])} disabled={!canManipulate}>Remove {issuerIndex}</button>
          {presented}
        </li>)
    }</ul>
  }

  function presentClaim(claim: Claim, location: (string | number)[], canManipulate: boolean) {
    const elements = [
      <li key="type">Type: &nbsp;<select defaultValue={claim.type} onChange={onRequirementChangedCreator([...location, "type"])} disabled={!canManipulate}>{
        (() => {
          const selects = []
          for (const claimType in ClaimType) selects.push(<option value={claimType} key={claimType}>{claimType}</option>)
          return selects
        })()
      }</select>
      </li>
    ]
    if (isCddClaim(claim)) {
      elements.push(<li key="id">Id: <input defaultValue={claim.id} placeholder="123"
        onChange={onRequirementChangedCreator([...location, "id"])} disabled={!canManipulate} />
      </li>)
    }
    if (isScopedClaim(claim)) {
      if (typeof claim.scope === "undefined" || claim.scope === null) setMyInfo(returnUpdatedCreator([...location, "scope"], {
        type: ScopeType.Custom,
        value: "",
      } as Scope))
      elements.push(<li key="scopeType">Scope type: &nbsp;
        <select defaultValue={claim.scope?.type} onChange={onRequirementChangedCreator([...location, "scope", "type"])} disabled={!canManipulate}>{
          (() => {
            const selects = []
            for (const scopeType in ScopeType) selects.push(<option value={scopeType} key={scopeType}>{scopeType}</option>)
            return selects
          })()
        }</select>
      </li>)
      elements.push(<li key="scopeValue">Scope value: <input defaultValue={claim.scope?.value} placeholder="ACME"
        onChange={onRequirementChangedCreator([...location, "scope", "value"])} disabled={!canManipulate} />
      </li>)
    }
    if (isInvestorUniquenessClaim(claim)) {
      const claimData: ClaimData | ClaimTarget = findValue(myInfo, location.slice(0, -1))
      const target: string | Identity = claimData?.target
      const targetDid: string = typeof target === "string" ? target : target.did
      const hasTarget = typeof targetDid !== "undefined" && targetDid !== null && targetDid !== ""
      elements.push(<li key="cddId">CDD id: <input defaultValue={claim.cddId} placeholder="123"
        onChange={onRequirementChangedCreator([...location, "cddId"])} disabled={!canManipulate} />&nbsp;
        {
          (() => {
            if (typeof target === "undefined" || isClaimData(claimData)) return ""
            return <button className="submit load-cdd-id" onClick={() => fetchCddId([...location, "cddId"], target)} disabled={!canManipulate || !hasTarget}>Load it</button>
          })()
        }
      </li>)
      elements.push(<li key="scopeId">Scope id: <input defaultValue={claim.scopeId} placeholder="123"
        onChange={onRequirementChangedCreator([...location, "scopeId"])} disabled={!canManipulate} />
      </li>)
    }
    if (claim.type === ClaimType.Jurisdiction) {
      elements.push(<li key="countryCode">Country code:&nbsp;
        <select defaultValue={claim.code} onChange={onRequirementChangedCreator([...location, "code"])} disabled={!canManipulate}>{
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

  function presentClaims(claims: Claim[] | null, location: (string | number)[], canManipulate: boolean) {
    if (typeof claims === "undefined" || claims === null || claims.length === 0) return <div>No claims</div>
    return <ul>{
      claims
        .map((claim: Claim, claimIndex: number) => presentClaim(claim, [...location, claimIndex], canManipulate))
        .map((presented, claimIndex: number) => <li key={claimIndex}>Claim {claimIndex}:{presented}</li>)
    }</ul>
  }

  function presentCondition(condition: Condition, location: (string | number)[], canManipulate: boolean) {
    const dummyTrustedClaimIssuer = { identity: null, trustedFor: [] }
    const elements = [
      <li key="target">
        Target: <select defaultValue={condition.target} onChange={onRequirementChangedCreator([...location, "target"])} disabled={!canManipulate}>{
          (() => {
            const selects = []
            for (const targetType in ConditionTarget) selects.push(<option value={targetType} key={targetType}>{targetType}</option>)
            return selects
          })()
        }</select>
      </li>,
      <li key="trustedClaimIssuers">Trusted claim issuers:&nbsp;
        <button className="submit add-trusted-claim-issuer" onClick={() => addToMyInfoArray([...location, "trustedClaimIssuers"], dummyTrustedClaimIssuer)} disabled={!canManipulate}>Add trusted claim issuer</button>
        {presentTrustedClaimIssuers(condition.trustedClaimIssuers, [...location, "trustedClaimIssuers"], canManipulate)}
      </li>,
      <li key="type">
        Type: <select defaultValue={condition.type} onChange={onRequirementChangedCreator([...location, "type"])} disabled={!canManipulate}>{
          (() => {
            const selects = []
            for (const conditionType in ConditionType) selects.push(<option value={conditionType} key={conditionType}>{conditionType}</option>)
            return selects
          })()
        }</select>
      </li>,
    ]
    if (isSingleClaimCondition(condition)) {
      elements.push(<li key="claim">Claim: {presentClaim(condition.claim, [...location, "claim"], canManipulate)}</li>)
    } else if (isMultiClaimCondition(condition)) {
      elements.push(<li key="claims">Claims: {presentClaims(condition.claims, [...location, "claims"], canManipulate)}</li>)
    } else if (isIdentityCondition(condition)) {
      elements.push(<li key="identity">
        Identity: <input defaultValue={condition.identity?.did} placeholder="0x123"
          onChange={onRequirementChangedCreator(
            [...location, "identity"],
            async (e) => {
              const api = await getPolyWalletApi()
              return api.getIdentity({ did: e.target.value })
            })}
          disabled={!canManipulate}
        />
      </li>)
    } else if (isPrimaryIssuanceAgentCondition(condition)) { // Nothing to do
    } else {
      throw new Error(`Unknown condition type: ${condition}`)
    }
    return <ul>{elements}</ul>
  }

  function presentConditions(conditions: Condition[] | null, location: (string | number)[], canManipulate: boolean) {
    if (conditions === null || conditions.length === 0) return <div>No conditions</div>
    return <ul>{
      conditions
        .map((condition: Condition, conditionIndex: number) => presentCondition(condition, [...location, conditionIndex], canManipulate))
        .map((presented, conditionIndex: number) => <li key={conditionIndex}>
          Condition {conditionIndex}:&nbsp;
          <button className="submit remove-condition" onClick={() => removeFromMyInfoArray([...location, conditionIndex])} disabled={!canManipulate}>Remove {conditionIndex}</button>
          {presented}
        </li>)
    }</ul>
  }

  function presentRequirement(requirement: Requirement, location: (string | number)[], canManipulate: boolean) {
    const dummyCondition: Condition = {
      target: null,
      type: ConditionType.IsPresent,
      claim: {
        type: ClaimType.NoData,
      },
    }
    return <ul>
      <li key="id">Id: {requirement.id}</li>
      <li key="conditions">Conditions:&nbsp;
        <button className="submit add-condition" onClick={() => addToMyInfoArray([...location, "conditions"], dummyCondition)} disabled={!canManipulate}>Add condition</button>
        {presentConditions(requirement.conditions, [...location, "conditions"], canManipulate)}
      </li>
    </ul>
  }

  function presentRequirements(requirements: Requirement[] | null, location: (string | number)[], canManipulate: boolean) {
    if (typeof requirements === "undefined" || requirements === null || requirements.length === 0) return <div>No requirements</div>
    return <ul>{
      requirements
        .map((requirement: Requirement, requirementIndex: number) => presentRequirement(requirement, [...location, requirementIndex], canManipulate))
        .map((presented, requirementIndex: number) => <li key={requirementIndex}>
          Requirement {requirementIndex}:&nbsp;
        <button className="submit remove-requirement" onClick={() => removeFromMyInfoArray([...location, requirementIndex])} disabled={!canManipulate}>Remove {requirementIndex}</button>
          {presented}
        </li>)
    }</ul>
  }

  function addToMyInfoArray(containerLocation: (string | number)[], dummy: any): void {
    setMyInfo((prevInfo) => {
      const container = findValue(prevInfo, containerLocation) || []
      if (!Array.isArray(container)) throw new Error("Only works with arrays")
      const updatedContainer = [...container, dummy]
      return returnUpdated(prevInfo, containerLocation, updatedContainer)
    })
  }

  function removeFromMyInfoArray(location: (string | number)[]): void {
    setMyInfo((prevInfo) => {
      const containerPath = location.slice(0, -1)
      const container = findValue(prevInfo, containerPath)
      if (!Array.isArray(container)) throw new Error("Only works with arrays")
      const lastPathBit = location[location.length - 1]
      if (typeof lastPathBit !== "number") throw new Error("Only works with an array index")
      const updatedContainer = [
        ...container.slice(0, lastPathBit),
        ...container.slice(lastPathBit + 1),
      ]
      return returnUpdated(prevInfo, containerPath, updatedContainer)
    })
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

  async function simulateCompliance(): Promise<void> {
    setMyInfo(returnUpdatedCreator(["requirements", "settleSimulation", "works"], null))
    const result: Compliance = await myInfo.token.current.compliance.requirements.checkSettle({
      from: myInfo.requirements.settleSimulation.sender,
      to: myInfo.requirements.settleSimulation.recipient,
    })
    setMyInfo(returnUpdatedCreator(["requirements", "settleSimulation", "works"], result.complies))
  }

  async function loadAttestationsReceived(): Promise<void> {
    const api: Polymesh = await getPolyWalletApi()
    const me: CurrentIdentity = await api.getCurrentIdentity()
    setStatus("Fetching attestations I received")
    setMyInfo(returnUpdatedCreator(["myDid"], me.did))
    await setAttestations((await api.claims.getIssuedClaims({ target: me.did })).data)
    setStatus("Attestations I received, fetched")
  }

  async function loadAttestationsReceivedBy(): Promise<void> {
    const api: Polymesh = await getPolyWalletApi()
    setStatus(`Fetching attestations received by ${myInfo.attestations.otherTarget}`)
    const result: ResultSet<IdentityWithClaims> = await api.claims.getIdentitiesWithClaims({ targets: [myInfo.attestations.otherTarget] })
    await setAttestations(result.data[0].claims)
    setStatus(`Attestations received by ${myInfo.attestations.otherTarget}, fetched`)
  }

  async function setAttestations(myClaims: ClaimData<Claim>[]): Promise<void> {
    setMyInfo(returnUpdatedCreator(["attestations", "current"], myClaims))
  }

  // Assumes the location is that of a Claim attached to a ClaimData
  async function fetchCddId(location: (string | number)[], target: string | Identity): Promise<void> {
    const api: Polymesh = await getPolyWalletApi()
    const targetDid: string = typeof target === "string" ? target : target.did
    if (typeof targetDid === "undefined" || targetDid === null || targetDid === "") throw new Error(`You need to put a valid target first, not ${targetDid}`)
    setStatus(`Fetching Cdd attestation received by ${targetDid}`)
    const claims: ClaimData<Claim>[] = (await api.claims.getCddClaims({
      target: target,
      includeExpired: false,
    }))
    console.log(claims)
    if (claims.length === 0) throw new Error(`No CDD claims attached to ${targetDid}`)
    console.log(target, location, (claims[0].claim as CddClaim).id)
    setMyInfo(returnUpdatedCreator(location, (claims[0].claim as CddClaim).id))
  }

  function presentClaimData(claimData: ClaimData<Claim>, location: (string | number)[], canManipulate: boolean) {
    canManipulate = claimData.issuer.did === myInfo.myDid
    return <ul>
      <li key="target">Target:&nbsp;
        <input defaultValue={claimData.target.did} placeholder="0x123"
          onChange={onRequirementChangedCreator(
            [...location, "target"],
            async (e) => (await getPolyWalletApi()).getIdentity({ did: e.target.value }))}
          disabled={!canManipulate}
        />
      </li>
      <li key="issuer">Issuer:&nbsp;
        <input defaultValue={claimData.issuer.did} placeholder="0x123"
          onChange={onRequirementChangedCreator(
            [...location, "issuer"],
            async (e) => (await getPolyWalletApi()).getIdentity({ did: e.target.value }))}
          disabled={!canManipulate}
        />
      </li>
      <li key="issuedAt">Issued at: {claimData.issuedAt.toISOString()}</li>
      <li key="expiry">Expiry:&nbsp;
        <input defaultValue={claimData.expiry?.toISOString() || ""} placeholder="2020-12-01 "
          onChange={onRequirementChangedCreator(
            [...location, "expiry"],
            async (e) => new Date(e.target.value))}
          disabled={!canManipulate}
        />
      </li>
      <li key="claim">Claim:&nbsp;
        
        {presentClaim(claimData.claim, [...location, "claim"], canManipulate)}
      </li>
    </ul>
  }

  function presentClaimTarget(claimTarget: ClaimTarget, location: (string | number)[], canManipulate: boolean) {
    return <ul>
      <li key="target">Target:&nbsp;
        <input defaultValue={typeof claimTarget.target === "string" ? claimTarget.target : claimTarget.target.did} placeholder="0x123"
          onChange={onRequirementChangedCreator([...location, "target"])}
          disabled={!canManipulate}
        />
      </li>
      <li key="expiry">Expiry:&nbsp;
        <input defaultValue={claimTarget.expiry?.toISOString() || null} placeholder="2020-12-01 "
          onChange={onRequirementChangedCreator(
            [...location, "expiry"],
            async (e) => e.target.value === "" ? null : new Date(e.target.value))}
          disabled={!canManipulate}
        />
      </li>
      <li key="claim">Claim:&nbsp;
        {presentClaim(claimTarget.claim, [...location, "claim"], canManipulate)}
      </li>
    </ul>
  }

  function presentClaimDatas(claimDatas: ClaimData<Claim>[] | null, location: (string | number)[], canManipulate: boolean) {
    if (typeof claimDatas === "undefined" || claimDatas === null || claimDatas.length === 0) return <div>No attestations</div>
    return <ul>{
      claimDatas
        .map((claimData: ClaimData, claimIndex: number) => {
          const canManipulateIt = canManipulate && claimData.issuer.did === myInfo.myDid
          return <li key={claimIndex}>
            Attestation {claimIndex}:&nbsp;
            <button className="submit revoke-claim-data" onClick={() => revokeAttestation([...location, claimIndex])} disabled={!canManipulateIt}>Revoke</button>
            {presentClaimData(claimData, [...location, claimIndex], canManipulateIt)}
          </li>
        })
    }</ul>
  }

  async function revokeAttestation(location: (string | number)[]) {
    const toRevoke = findValue(myInfo, location)
    const api: Polymesh = await getPolyWalletApi()
    await (await api.claims.revokeClaims({
      claims: [toRevoke]
    })).run()
  }

  async function addAttestation(location: (string | number)[]) {
    const toAdd: ClaimTarget = findValue(myInfo, location)
    const api: Polymesh = await getPolyWalletApi()
    setStatus("Adding attestation")
    await (await api.claims.addClaims({ claims: [toAdd] })).run()
    setStatus("Attestation added")
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
            <input name="ticker" id="ticker" type="text" placeholder="ACME" defaultValue={myInfo.ticker} onChange={onTickerChanged} />
          </div>
          <div>
            <select name="myTickers" defaultValue={myInfo.token.detailsJson.assetType} onChange={onValueChangedCreator(["ticker"])}>
              <option value="" key="Select 1" disabled={true}>Select 1</option>
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
                <li key="owner">Owned by: {myInfo.reservation.detailsJson.owner === myInfo.myDid ? "me" : presentLongHex(myInfo.reservation.detailsJson.owner)}</li>
                <li key="status">With status: {myInfo.reservation.detailsJson.status}</li>
                <li key="expiry">Valid until: {myInfo.reservation.detailsJson.expiryDate}</li>
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
                <div className={styles.card}>
                  <div>
                    <label htmlFor="token-name">
                      <span className={styles.hasTitle} title="Long name of your security token">Name</span>
                    </label>
                    <input name="token-name" type="text" placeholder="American CME" defaultValue={myInfo.token.detailsJson.name} disabled={!canCreate} onChange={onValueChangedCreator(["token", "detailsJson", "name"])} />
                  </div>
                  <div>
                    <label htmlFor="token-divisible">
                      <span className={styles.hasTitle} title="Whether it can be sub-divided">Divisible</span>
                    </label>
                    <input name="token-divisible" type="checkbox" defaultChecked={myInfo.token.detailsJson.divisible} disabled={!canCreate} onChange={onValueChangedCreator(["token", "detailsJson", "divisible"], checkboxProcessor)} />
                  </div>
                  <div>
                    <label htmlFor="token-assetType">
                      <span className={styles.hasTitle} title="Pick one from the list or type what you want">Asset Type</span>
                    </label>
                    <input name="token-assetType" type="text" placeholder="Equity Common" defaultValue={myInfo.token.detailsJson.assetType} disabled={!canCreate} onChange={onValueChangedCreator(["token", "detailsJson", "assetType"])} />
                    &nbsp;
                    <select name="known-assetTypes" defaultValue={myInfo.token.detailsJson.assetType} disabled={!canCreate} onChange={onValueChangedCreator(["token", "detailsJson", "assetType"])}>{
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
                <li key="owner">Owned by: {myInfo.token.detailsJson.owner === myInfo.myDid ? "me" : presentLongHex(myInfo.reservation.detailsJson.owner)}</li>
                <li key="assetType">As asset type: {myInfo.token.detailsJson.assetType}</li>
                <li key="divisible">{myInfo.token.detailsJson.divisible ? "" : "not"} divisible</li>
                <li key="pia">With PIA: {myInfo.token.detailsJson.primaryIssuanceAgent === myInfo.myDid ? "me" : presentLongHex(myInfo.token.detailsJson.primaryIssuanceAgent)}</li>
                <li key="totalSupply">And total supply of: {myInfo.token.detailsJson.totalSupply}</li>
              </ul>
            })()
          }</div>

          <div className={styles.card}>{
            (() => {
              const canManipulate: boolean = myInfo.token.current !== null && myInfo.token.detailsJson.owner === myInfo.myDid
              return <div>
                <div className="submit">
                  New owner:&nbsp;
                  <input name="token-ownership-target" type="text" placeholder="0x1234" defaultValue={myInfo.token.ownershipTarget} disabled={!canManipulate} onChange={onValueChangedCreator(["token", "ownershipTarget"])} />
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
            <button className="submit add-requirement" onClick={() => addToMyInfoArray(["requirements", "current"], { id: Math.round(Math.random() * 1000), conditions: [] })} disabled={!myInfo.requirements.canManipulate}>Add requirement</button>
          </div>

          <div>{presentRequirements(myInfo.requirements.current, ["requirements", "current"], myInfo.requirements.canManipulate)}</div>

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

          <div className={styles.card}>
            <div>Would a transfer of {myInfo.token.current?.ticker} work</div>
            <div>From:&nbsp;
              <input defaultValue={myInfo.requirements.settleSimulation.sender} placeholder="0x123" onChange={onValueChangedCreator(["requirements", "settleSimulation", "sender"])} />
              &nbsp;
              <button className="submit pick-me-for-sender" onClick={onValueChangedCreator(["requirements", "settleSimulation", "sender"], getMyDid)}>Pick mine</button>
            </div>
            <div>To:&nbsp;
              <input defaultValue={myInfo.requirements.settleSimulation.recipient} placeholder="0x123" onChange={onValueChangedCreator(["requirements", "settleSimulation", "recipient"])} />
              &nbsp;
              <button className="submit pick-me-for-recipient" onClick={onValueChangedCreator(["requirements", "settleSimulation", "recipient"], getMyDid)}>Pick mine</button>
            </div>
            <div className="submit">
              <button className="submit simulate-compliance" onClick={simulateCompliance} disabled={myInfo.token.current === null}>Try</button>
            </div>
            <div>Result: {myInfo.requirements.settleSimulation.works === null ? "No info" : myInfo.requirements.settleSimulation.works ? "Aye" : "Nay"}</div>
          </div>

        </fieldset>

        <fieldset className={styles.card}>
          <legend>Attestations</legend>

          <div className="submit">
            <button className="submit load-attestations-received" onClick={loadAttestationsReceived}>Load attestations I received</button>
          </div>
          <div className="submit">
            <button className="submit load-attestations-received-by" onClick={loadAttestationsReceivedBy}>Load attestations received by</button>
            &nbsp;
            <input defaultValue={myInfo.attestations.otherTarget} placeholder="0x123" onChange={onRequirementChangedCreator(["attestations", "otherTarget"])}/>
          </div>

          <div>{
            presentClaimDatas(myInfo.attestations.current, ["attestations", "current"], true)
          }</div>

          <div className={styles.card}>
            <div>Attestation to add:</div>
            <div>{
              presentClaimTarget(myInfo.attestations.toAdd, ["attestations", "toAdd"], true)
            }</div>
            <div className="submit">
              <button className="submit add-attestation" onClick={() => addAttestation(["attestations", "toAdd"])}>Add KYC attestation</button>
            </div>
            <div>It takes some time for the added attestation<br/>to show in the list above because the<br/>middleware needs to be updated</div>
          </div>

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
