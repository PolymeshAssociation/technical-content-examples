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
} from "@polymathnetwork/polymesh-sdk/types"
import { Polymesh, BigNumber } from '@polymathnetwork/polymesh-sdk'
import {
  AttestationsInfoJSON,
  CountryInfo,
  getCountryList,
  isCddClaim,
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
  getBasicPolyWalletApi,
  replaceFetchTimer,
  returnUpdated,
  returnUpdatedCreator,
} from "../src/ui-helpers"

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
    } as AttestationsInfoJSON,
  } as MyInfoJson)
  const countryList: CountryInfo[] = getCountryList()

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

  function onValueChangedCreator(path: (string | number)[], field: string | number, valueProcessor?: (e) => Promise<any>) {
    return async function (e): Promise<void> {
      let info = myInfo
      path.forEach((pathBit: string) => {
        info = info[pathBit]
      })
      const value = valueProcessor ? await valueProcessor(e) : e.target.value
      setMyInfo(returnUpdatedCreator(path, field, value))
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
        onChange={onRequirementChangedCreator(getClaimPath(requirementIndex, conditionIndex, claimIndex), "id")} disabled={!myInfo.requirements.canManipulate} />
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
        onChange={onRequirementChangedCreator([...getClaimPath(requirementIndex, conditionIndex, claimIndex), "scope"], "value")} disabled={!myInfo.requirements.canManipulate} />
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

  async function simulateCompliance(): Promise<void> {
    setMyInfo(returnUpdatedCreator(["requirements", "settleSimulation"], "works", null))
    const result: Compliance = await myInfo.token.current.compliance.requirements.checkSettle({
      from: myInfo.requirements.settleSimulation.sender,
      to: myInfo.requirements.settleSimulation.recipient,
    })
    setMyInfo(returnUpdatedCreator(["requirements", "settleSimulation"], "works", result.complies))
  }

  async function loadAttestations(): Promise<void> {
    const api: Polymesh = await getPolyWalletApi()
    const me: CurrentIdentity = await api.getCurrentIdentity()
    setStatus("Fetching attestations")
    await setAttestations(await api.claims.getIssuedClaims({ target: me.did }))
  }

  async function setAttestations(myClaims: ResultSet<ClaimData<Claim>>): Promise<void> {
    setMyInfo(returnUpdatedCreator(["attestations"], "current", myClaims.data))
  }

  function presentClaimData(claimData: ClaimData<Claim>) {
    return <ul>
      <li>Target: {claimData.target.did === myInfo.myDid ? "me" : presentLongHex(claimData.target.did)}</li>
      <li>Issuer: {claimData.issuer.did === myInfo.myDid ? "me" : presentLongHex(claimData.issuer.did)}</li>
      <li>Issued at: {claimData.issuedAt.toISOString()}</li>
      <li>Expiry: {claimData.expiry?.toISOString}</li>
      <li>Claim: {presentClaim(claimData.claim, null, null, null)}</li>
    </ul>
  }

  function presentClaimDatas(claimDatas?: ClaimData<Claim>[]) {
    if (claimDatas === null || claimDatas.length === 0) return <div>No attestations</div>
    return <ul>{
      claimDatas
        .map((claimData: ClaimData, index: number) => <li>
          Attestation {index}:
        {presentClaimData(claimData)}
        </li>)
    }</ul>
  }

  async function addAttestation() {

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
            <select name="myTickers" defaultValue={myInfo.token.detailsJson.assetType} onChange={onValueChangedCreator([], "ticker")}>
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
                <div className={styles.card}>
                  <div>
                    <label htmlFor="token-name">
                      <span className={styles.hasTitle} title="Long name of your security token">Name</span>
                    </label>
                    <input name="token-name" type="text" placeholder="American CME" defaultValue={myInfo.token.detailsJson.name} disabled={!canCreate} onChange={onValueChangedCreator(["token", "detailsJson"], "name")} />
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
                    <input name="token-assetType" type="text" placeholder="Equity Common" defaultValue={myInfo.token.detailsJson.assetType} disabled={!canCreate} onChange={onValueChangedCreator(["token", "detailsJson"], "assetType")} />
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

          <div className={styles.card}>{
            (() => {
              const canManipulate: boolean = myInfo.token.current !== null && myInfo.token.detailsJson.owner === myInfo.myDid
              return <div>
                <div className="submit">
                  New owner:&nbsp;
                  <input name="token-ownership-target" type="text" placeholder="0x1234" defaultValue={myInfo.token.ownershipTarget} disabled={!canManipulate} onChange={onValueChangedCreator(["token"], "ownershipTarget")} />
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

          <div className={styles.card}>
            <div>Would this transfer work?</div>
            <div>From:&nbsp;
              <input defaultValue={myInfo.requirements.settleSimulation.sender} placeholder="0x123" onChange={onValueChangedCreator(["requirements", "settleSimulation"], "sender")} />
              &nbsp;
              <button className="submit pick-me-for-sender" onClick={onValueChangedCreator(["requirements", "settleSimulation"], "sender", getMyDid)}>Pick mine</button>
            </div>
            <div>To:&nbsp;
              <input defaultValue={myInfo.requirements.settleSimulation.recipient} placeholder="0x123" onChange={onValueChangedCreator(["requirements", "settleSimulation"], "recipient")} />
              &nbsp;
              <button className="submit pick-me-for-recipient" onClick={onValueChangedCreator(["requirements", "settleSimulation"], "recipient", getMyDid)}>Pick mine</button>
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
            <button className="submit load-attestations" onClick={loadAttestations}>Load my attestations</button>
          </div>

          <div>{
            presentClaimDatas(myInfo.attestations.current)
          }</div>

          <div className={styles.card}>
            <button className="submit add-attestation" onClick={addAttestation}>Add KYC attestation</button>
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
