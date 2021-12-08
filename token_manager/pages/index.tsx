import Head from "next/head"
import React, { useState } from "react"
import styles from "../styles/Home.module.css"
import {
  ClaimType,
  Compliance,
  Condition,
  isMultiClaimCondition,
  isSingleClaimCondition,
  KnownTokenType,
  Requirement,
  SecurityToken,
  SecurityTokenDetails,
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
  CddClaim,
  Authorization,
  AuthorizationType,
  Permissions,
  PortfolioBalance,
  CheckpointWithCreationDate,
  CalendarUnit,
  ScheduleWithDetails,
  TickerReservationStatus,
  DividendDistributionDetails,
  DistributionParticipant,
  DistributionWithDetails,
} from "@polymathnetwork/polymesh-sdk/types"
import { Polymesh, BigNumber } from '@polymathnetwork/polymesh-sdk'
import {
  CheckpointInfoJson,
  CheckpointScheduleDetailsInfoJson,
  CheckpointScheduleInfoJson,
  CorporateActionInfoJson,
  CountryInfo,
  DividendDistributionInfoJson,
  getCountryList,
  getEmptyMyInfo,
  getEmptyRequirements,
  getEmptyTokenDetails,
  isCddClaim,
  isCheckpointSchedule,
  isCheckpointWithCreationDate,
  isClaimData,
  isIdentityCondition,
  isNumberedPortfolio,
  isPrimaryIssuanceAgentCondition,
  MyInfoPath,
  PortfolioInfoJson,
} from "../src/types"
import {
  AddInvestorUniquenessClaimParams,
  AuthorizationRequest,
  Checkpoint,
  CheckpointSchedule,
  CorporateAction,
  DefaultPortfolio,
  DividendDistribution,
  Identity,
  NumberedPortfolio,
  PolymeshError,
  TickerReservation,
} from "@polymathnetwork/polymesh-sdk/internal"
import {
  checkboxProcessor,
  findValue,
  getBasicPolyWalletApi,
  presentLongHex,
  replaceFetchTimer,
  returnAddedArrayCreator,
  returnRemovedArrayCreator,
  returnUpdatedCreator,
} from "../src/ui-helpers"
import { CheckpointsView, CheckpointView } from "../src/components/checkpoints/CheckpointView"
import { CheckpointScheduleDetailsView, CheckpointScheduleView } from "../src/components/checkpoints/CheckpointScheduleView"

export default function Home() {
  const [myInfo, setMyInfo] = useState(getEmptyMyInfo())

  function setStatus(content: string): void {
    const element = document.getElementById("status") as HTMLElement
    element.innerHTML = content
  }

  async function getPolyWalletApi(): Promise<Polymesh> {
    const api: Polymesh = await getBasicPolyWalletApi(setStatus)
    const myIdentity: Identity = await api.getCurrentIdentity()
    setMyInfo(returnUpdatedCreator(["myDid"], myIdentity.did))
    return api
  }

  async function getMyIdentity(): Promise<Identity> {
    return (await getPolyWalletApi()).getCurrentIdentity()
  }

  async function getMyDid(): Promise<string> {
    return (await getMyIdentity()).did
  }

  async function loadYourTickers(): Promise<string[]> {
    const api: Polymesh = await getPolyWalletApi()
    setStatus("Getting your current identity")
    const me: Identity = await api.getCurrentIdentity()
    setStatus("Fetching your security tokens")
    const myTokens: SecurityToken[] = await api.getSecurityTokens({ owner: me })
    setStatus("Fetching your token reservations")
    const myReservations: TickerReservation[] = await api.getTickerReservations({ owner: me });
    const myTickers: string[] = [...myTokens, ...myReservations]
      .map((element: SecurityToken | TickerReservation) => element.ticker)
    setMyInfo(returnUpdatedCreator(["myTickers"], myTickers))
    return myTickers
  }

  async function onTickerChanged(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const ticker: string = e.target.value
    setMyInfo(returnUpdatedCreator(["ticker"], ticker))
    replaceFetchTimer(myInfo.reservation, async () => await loadReservation(ticker))
  }

  function onValueChangedCreator(path: MyInfoPath, deep: boolean = false, valueProcessor?: (e) => Promise<any>) {
    return async function (e): Promise<void> {
      const value = valueProcessor ? await valueProcessor(e) : e.target.value
      setMyInfo(returnUpdatedCreator(path, value, deep))
      if (path[path.length - 1] === "ticker") replaceFetchTimer(myInfo.reservation, async () => await loadReservation(value))
    }
  }

  function presentEnumOptions<EnumType>(theEnum: EnumType): JSX.Element[] {
    const selects: JSX.Element[] = []
    for (const element in theEnum) selects.push(<option value={element} key={element}>{element}</option>)
    return selects
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
      setMyInfo(returnUpdatedCreator(["reservation"], {
        current: null,
        details: getEmptyTokenDetails(),
      }))
      setToken(null)
    } else {
      setMyInfo(returnUpdatedCreator(["reservation"], {
        current: reservation,
        details: (await reservation.details()) || getEmptyTokenDetails(),
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
      name: myInfo.token.details?.name,
      totalSupply: new BigNumber("0"),
      isDivisible: myInfo.token.details?.isDivisible,
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
      setMyInfo(returnUpdatedCreator(["token"], {
        current: null,
        details: null,
        piaBalance: {
          locked: "",
          total: "",
          toIssue: 0,
          toRedeem: 0,
        },
      }, true))
      setComplianceRequirements(null, null, true)
    } else {
      const details: SecurityTokenDetails = await token.details()
      const defaultPortfolio: DefaultPortfolio = await details.primaryIssuanceAgent.portfolios.getPortfolio()
      const balance: PortfolioBalance = (await defaultPortfolio.getTokenBalances({ tokens: [token] }))[0]
      setMyInfo(returnUpdatedCreator(["token"], {
        current: token,
        createdAt: await token.createdAt(),
        details: details,
        piaBalance: {
          locked: balance.locked.toString(10),
          total: balance.total.toString(10),
          toIssue: 0,
          toRedeem: 0,
        },
      }, true))
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

  async function changeTokenPia(): Promise<void> {
    setStatus("Changing token PIA")
    await (await myInfo.token.current.modifyPrimaryIssuanceAgent(myInfo.token.piaChangeInfo)).run()
    setStatus("PIA change queued in authorisations")
    await loadAuthorisations()
  }

  async function removeTokenPia(): Promise<void> {
    setStatus("Removing token PIA")
    await (await myInfo.token.current.removePrimaryIssuanceAgent()).run()
    setStatus("PIA removed")
    await loadToken(myInfo.ticker)
  }

  async function issueTokens(): Promise<void> {
    setStatus("Issuing tokens")
    const updatedToken: SecurityToken = await (await myInfo.token.current.issuance.issue({
      amount: new BigNumber(myInfo.token.piaBalance.toIssue)
    })).run()
    setStatus("Tokens issued")
    await setToken(updatedToken)
  }

  async function redeemTokens(): Promise<void> {
    setStatus(`Redeeming ${myInfo.token.piaBalance.toRedeem} ${myInfo.token.current.ticker} tokens`)
    await (await myInfo.token.current.redeem({ amount: new BigNumber(myInfo.token.piaBalance.toRedeem) })).run()
    setStatus("Tokens redeemed")
    await loadToken(myInfo.ticker)
  }

  async function loadComplianceRequirements(token: SecurityToken): Promise<Requirement[]> {
    setStatus("Loading compliance requirements")
    const requirements: Requirement[] = await token.compliance.requirements.get()
    const arePaused: boolean = await token.compliance.requirements.arePaused()
    await setComplianceRequirements(token, requirements, arePaused)
    await loadMyPortfolios()
    await loadCheckpoints(token)
    return requirements
  }

  async function setComplianceRequirements(token: SecurityToken | null, requirements: Requirement[] | null, arePaused: boolean) {
    if (token === null || requirements === null) {
      setMyInfo(returnUpdatedCreator(["requirements"], getEmptyRequirements()))
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

  function onRequirementChangedCreator(path: MyInfoPath, deep: boolean = false, valueProcessor?: (e) => Promise<any>): (e) => Promise<void> {
    return async function (e): Promise<void> {
      await onValueChangedCreator(path, deep, valueProcessor)(e)
      setMyInfo(returnUpdatedCreator(["requirements"], { modified: true }, true))
    }
  }

  function presentTrustedClaimIssuer(trustedIssuer: TrustedClaimIssuer, location: MyInfoPath, canManipulate: boolean): JSX.Element {
    const trustedFor: JSX.Element = trustedIssuer.trustedFor
      ? <ul>{
        trustedIssuer.trustedFor.map((claimType: ClaimType, claimTypeIndex: number) => <li key={claimTypeIndex}>
          <select defaultValue={claimType} onChange={onRequirementChangedCreator([...location, "trustedFor", claimTypeIndex])} disabled={!canManipulate}>
            {presentEnumOptions(ClaimType)}
          </select>&nbsp;<button className="submit remove-trusted-for" onClick={() => removeFromMyRequirementArray([...location, "trustedFor", claimTypeIndex])} disabled={!canManipulate}>Remove {claimTypeIndex}</button>
        </li>)
      }</ul>
      : <div>Not trusted for anything</div>
    return <ul>
      <li key="identity">Did: <input defaultValue={trustedIssuer.identity?.did} placeholder="0x123"
        onChange={onRequirementChangedCreator(
          [...location, "identity"],
          false,
          async (e) => (await getPolyWalletApi()).getIdentity({ did: e.target.value }))}
        disabled={!canManipulate}
      />
      </li>
      <li key="trustedFor">Trusted for:&nbsp;
        <button className="submit add-trusted-for" onClick={() => addToMyRequirementArray([...location, "trustedFor"], ClaimType.Accredited)} disabled={!canManipulate}>Add trusted for</button>
        {trustedFor}
      </li>
    </ul>
  }

  function presentTrustedClaimIssuers(trustedIssuers: TrustedClaimIssuer[] | null, location: MyInfoPath, canManipulate: boolean): JSX.Element {
    if (typeof trustedIssuers === "undefined" || trustedIssuers === null || trustedIssuers.length === 0) return <div>No trusted issuers</div>
    return <ul>{
      trustedIssuers
        .map((trustedIssuer: TrustedClaimIssuer, issuerIndex: number) => presentTrustedClaimIssuer(trustedIssuer, [...location, issuerIndex], canManipulate))
        .map((presented: JSX.Element, issuerIndex: number) => <li key={issuerIndex}>
          Issuer {issuerIndex}:&nbsp;
          <button className="submit remove-trusted-claim-issuer" onClick={() => removeFromMyRequirementArray([...location, issuerIndex])} disabled={!canManipulate}>Remove {issuerIndex}</button>
          {presented}
        </li>)
    }</ul>
  }

  function presentScope(scope: Scope, location: MyInfoPath, canManipulate: boolean): JSX.Element {
    if (typeof scope === "undefined" || scope === null) {
      const defaultScope: Scope = { type: ScopeType.Custom, value: "" }
      setMyInfo(returnUpdatedCreator([...location], defaultScope as Scope))
      scope = defaultScope
    }
    return <ul>
      <li key="type">Type: &nbsp;
        <select defaultValue={scope.type} onChange={onRequirementChangedCreator([...location, "type"])} disabled={!canManipulate}>
          {presentEnumOptions(ScopeType)}
        </select>
      </li>
      <li key="value">Value:&nbsp;
        <input defaultValue={scope.value} placeholder="ACME" onChange={onRequirementChangedCreator([...location, "value"])} disabled={!canManipulate} />
      </li>
    </ul>
  }

  function presentClaim(claim: Claim, location: MyInfoPath, canManipulate: boolean): JSX.Element {
    const elements: JSX.Element[] = [
      <li key="type">Type: &nbsp;
        <select defaultValue={claim.type} onChange={onRequirementChangedCreator([...location, "type"])} disabled={!canManipulate}>
          {presentEnumOptions(ClaimType)}
        </select>
      </li>
    ]
    if (isCddClaim(claim)) {
      elements.push(<li key="id">Id:&nbsp;
        <input defaultValue={claim.id} placeholder="123" onChange={onRequirementChangedCreator([...location, "id"])} disabled={!canManipulate} />
      </li>)
    }
    if (isScopedClaim(claim)) {
      elements.push(<li key="scope">Scope:&nbsp;{presentScope(claim.scope, [...location, "scope"], canManipulate)}</li>)
    }
    if (isInvestorUniquenessClaim(claim)) {
      const claimData: ClaimData | ClaimTarget = findValue(myInfo, location.slice(0, -1))
      const target: string | Identity = claimData?.target
      const targetDid: string = typeof target === "string" ? target : target.did
      const hasTarget: boolean = typeof targetDid !== "undefined" && targetDid !== null && targetDid !== ""
      elements.push(<li key="cddId">CDD id:
        <input defaultValue={claim.cddId} placeholder="123" onChange={onRequirementChangedCreator([...location, "cddId"])} disabled={!canManipulate} />&nbsp;
        {
          (() => {
            if (typeof target === "undefined" || isClaimData(claimData)) return ""
            return <button className="submit load-cdd-id" onClick={() => fetchCddId([...location, "cddId"], target)} disabled={!canManipulate || !hasTarget}>Load it</button>
          })()
        }
      </li>)
      elements.push(<li key="scopeId">Scope id:&nbsp;
        <input defaultValue={claim.scopeId} placeholder="123" onChange={onRequirementChangedCreator([...location, "scopeId"])} disabled={!canManipulate} />
      </li>)
    }
    if (claim.type === ClaimType.Jurisdiction) {
      elements.push(<li key="countryCode">Country code:&nbsp;
        <select defaultValue={claim.code} onChange={onRequirementChangedCreator([...location, "code"])} disabled={!canManipulate}>
          {presentEnumOptions(CountryCode)}
        </select>
      </li>)
    }
    return <ul>{elements}</ul>
  }

  function presentClaims(claims: Claim[] | null, location: MyInfoPath, canManipulate: boolean): JSX.Element {
    if (typeof claims === "undefined" || claims === null || claims.length === 0) return <div>No claims</div>
    return <ul>{
      claims
        .map((claim: Claim, claimIndex: number) => presentClaim(claim, [...location, claimIndex], canManipulate))
        .map((presented, claimIndex: number) => <li key={claimIndex}>Claim {claimIndex}:{presented}</li>)
    }</ul>
  }

  function presentAddInvestorUniquenessClaimParams(claim: AddInvestorUniquenessClaimParams, location: MyInfoPath, canManipulate: boolean): JSX.Element {
    return <ul>
      <li key="scope">Scope:&nbsp;{presentScope(claim.scope, [...location, "scope"], canManipulate)}</li>
      <li key="cddId">CDD id:&nbsp;
        <input defaultValue={claim.cddId} placeholder="123" onChange={onRequirementChangedCreator([...location, "cddId"])} disabled={!canManipulate} />
        &nbsp;
        <button className="submit load-cdd-id" onClick={() => fetchMyCddId([...location, "cddId"])} disabled={!canManipulate}>Load it</button>
      </li>
      <li key="proof">Proof:&nbsp;<input defaultValue={claim.proof} placeholder="123" disabled={true} /></li>
      <li key="scopeId">Scope id:&nbsp;<input defaultValue={claim.scopeId} placeholder="123" disabled={true} /></li>
      <li key="expiry">Expiry:&nbsp;<input defaultValue={claim.expiry?.toISOString()} placeholder="2020-12-31" disabled={!canManipulate} /></li>
    </ul>
  }

  function presentCondition(condition: Condition, location: MyInfoPath, canManipulate: boolean): JSX.Element {
    const dummyTrustedClaimIssuer: TrustedClaimIssuer = { identity: null, trustedFor: [] }
    const elements: JSX.Element[] = [
      <li key="target">Target:
        <select defaultValue={condition.target} onChange={onRequirementChangedCreator([...location, "target"])} disabled={!canManipulate}>
          {presentEnumOptions(ConditionTarget)}
        </select>
      </li>,
      <li key="trustedClaimIssuers">Trusted claim issuers:&nbsp;
        <button className="submit add-trusted-claim-issuer" onClick={() => addToMyRequirementArray([...location, "trustedClaimIssuers"], dummyTrustedClaimIssuer)} disabled={!canManipulate}>Add trusted claim issuer</button>
        {presentTrustedClaimIssuers(condition.trustedClaimIssuers, [...location, "trustedClaimIssuers"], canManipulate)}
      </li>,
      <li key="type">Type:
        <select defaultValue={condition.type} onChange={onRequirementChangedCreator([...location, "type"])} disabled={!canManipulate}>
          {presentEnumOptions(ConditionType)}
        </select>
      </li>,
    ]
    if (isSingleClaimCondition(condition)) {
      elements.push(<li key="claim">Claim: {presentClaim(condition.claim, [...location, "claim"], canManipulate)}</li>)
    } else if (isMultiClaimCondition(condition)) {
      elements.push(<li key="claims">Claims: {presentClaims(condition.claims, [...location, "claims"], canManipulate)}</li>)
    } else if (isIdentityCondition(condition)) {
      elements.push(<li key="identity">Identity:&nbsp;
        <input defaultValue={condition.identity?.did} placeholder="0x123" disabled={!canManipulate}
          onChange={onRequirementChangedCreator(
            [...location, "identity"],
            false,
            async (e) => (await getPolyWalletApi()).getIdentity({ did: e.target.value }))} />
      </li>)
    } else if (isPrimaryIssuanceAgentCondition(condition)) { // Nothing to do
    } else {
      throw new Error(`Unknown condition type: ${condition}`)
    }
    return <ul>{elements}</ul>
  }

  function presentConditions(conditions: Condition[] | null, location: MyInfoPath, canManipulate: boolean): JSX.Element {
    if (conditions === null || conditions.length === 0) return <div>No conditions</div>
    return <ul>{
      conditions
        .map((condition: Condition, conditionIndex: number) => presentCondition(condition, [...location, conditionIndex], canManipulate))
        .map((presented: JSX.Element, conditionIndex: number) => <li key={conditionIndex}>Condition {conditionIndex}:&nbsp;
          <button className="submit remove-condition" onClick={() => removeFromMyRequirementArray([...location, conditionIndex])} disabled={!canManipulate}>Remove {conditionIndex}</button>
          {presented}
        </li>)
    }</ul>
  }

  function presentRequirement(requirement: Requirement, location: MyInfoPath, canManipulate: boolean): JSX.Element {
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
        <button className="submit add-condition" onClick={() => addToMyRequirementArray([...location, "conditions"], dummyCondition)} disabled={!canManipulate}>Add condition</button>
        {presentConditions(requirement.conditions, [...location, "conditions"], canManipulate)}
      </li>
    </ul>
  }

  function presentRequirements(requirements: Requirement[] | null, location: MyInfoPath, canManipulate: boolean): JSX.Element {
    if (typeof requirements === "undefined" || requirements === null || requirements.length === 0) return <div>No requirements</div>
    return <ul>{
      requirements
        .map((requirement: Requirement, requirementIndex: number) => presentRequirement(requirement, [...location, requirementIndex], canManipulate))
        .map((presented: JSX.Element, requirementIndex: number) => <li key={requirementIndex}>Requirement {requirementIndex}:&nbsp;
          <button className="submit remove-requirement" onClick={() => removeFromMyRequirementArray([...location, requirementIndex])} disabled={!canManipulate}>Remove {requirementIndex}</button>
          {presented}
        </li>)
    }</ul>
  }

  function addToMyRequirementArray(containerLocation: MyInfoPath, dummy: any): void {
    setMyInfo(returnAddedArrayCreator(containerLocation, dummy))
    setMyInfo(returnUpdatedCreator(["requirements"], { modified: true }, true))
  }

  function removeFromMyRequirementArray(containerLocation: MyInfoPath): void {
    setMyInfo(returnRemovedArrayCreator(containerLocation))
    setMyInfo(returnUpdatedCreator(["requirements"], { modified: true }, true))
  }

  async function saveRequirements(): Promise<SecurityToken> {
    const updatedToken: SecurityToken = await (await myInfo.token.current.compliance.requirements.set({
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

  async function loadAuthorisations(): Promise<void> {
    const api: Polymesh = await getPolyWalletApi();
    setMyInfo(returnUpdatedCreator(["myAddress"], api.getAccount()))
    setMyInfo(returnUpdatedCreator(["myDid"], (await api.getCurrentIdentity()).did))
    const authorisations: AuthorizationRequest[] = [
      ...(await (await api.getCurrentIdentity()).authorizations.getSent()).data,
      ...await (await api.getCurrentIdentity()).authorizations.getReceived(),
    ]
    await setAuthorisations(authorisations)
  }

  async function setAuthorisations(authorisations: AuthorizationRequest[]): Promise<void> {
    setMyInfo(returnUpdatedCreator(["authorisations", "current"], authorisations))
  }

  function presentPermissions(permissions: Permissions, location: MyInfoPath): JSX.Element {
    return <ul>
      <li key="portfolios">Portfolios:&nbsp;{presentPorfolios(permissions.portfolios, [...location, "portfolios"])}</li>
      <li key="tokens">Tokens:&nbsp;{
        permissions.tokens === null ? "null" : permissions.tokens
          .map((token: SecurityToken) => token.ticker)
          .join(", ")
      }</li>
      <li key="transactionGroups">Transaction groups:&nbsp;{permissions.transactionGroups === null ? "null" : permissions.transactionGroups.join(", ")}</li>
      <li key="transactions">Transactions:&nbsp;{permissions.transactions === null ? "null" : permissions.transactions.join(", ")}</li>
    </ul>
  }

  function presentPorfolio(portfolio: DefaultPortfolio | NumberedPortfolio, location: MyInfoPath): JSX.Element {
    return <ul>
      <li key="owner">Owner:&nbsp;{portfolio.owner.did === myInfo.myDid ? "me" : presentLongHex(portfolio.owner.did)}</li>
      <li key="id">Id:&nbsp;{portfolio instanceof NumberedPortfolio ? portfolio.id.toString(10) : "null"}</li>
    </ul>
  }

  function presentPorfolios(portfolios: (DefaultPortfolio | NumberedPortfolio)[] | null, location: MyInfoPath): JSX.Element {
    if (portfolios === null) return <div>"There are no portfolios"</div>
    return <ul>{
      portfolios
        .map((portfolio: DefaultPortfolio | NumberedPortfolio, portfolioIndex: number) => presentPorfolio(portfolio, [...location, portfolioIndex]))
        .map((presented, portfolioIndex: number) => <li key={portfolioIndex}>
          Portfolio {portfolioIndex}:&nbsp;{presented}
        </li>)
    }</ul>
  }

  function presentAuthorisation(authorisation: Authorization, location: MyInfoPath): JSX.Element {
    const elements: JSX.Element[] = [<li key="type">Type:&nbsp; {authorisation.type}</li>]
    if (authorisation.type === AuthorizationType.NoData) { // Add nothing
    } else if (authorisation.type === AuthorizationType.PortfolioCustody) {
      elements.push(<li key="value">Value:&nbsp;{presentPorfolio(authorisation.value, [...location, "value"])}</li>)
    } else if (authorisation.type === AuthorizationType.JoinIdentity) {
      elements.push(<li key="value">Value:{presentPermissions(authorisation.value, [...location, "value"])}</li>)
    } else {
      elements.push(<li key="value">Value:&nbsp;{authorisation.value}</li>)
    }
    return <ul>{elements}</ul>
  }

  function presentAuthorisationRequest(authorisationRequest: AuthorizationRequest, location: MyInfoPath): JSX.Element {
    const amIssuer: boolean = authorisationRequest.issuer.did === myInfo.myDid
    const target: string = authorisationRequest.target instanceof Identity ? authorisationRequest.target.did : authorisationRequest.target.address
    const amTarget: boolean = target === myInfo.myDid || target === myInfo.myAddress
    return <ul>
      <li key="id">
        AuthId: {authorisationRequest.authId.toString(10)}
        &nbsp;
        <button className="submit accept-auth-request" onClick={() => acceptRequest(location)} disabled={!amTarget}>Accept</button>
        &nbsp;
        <button className="submit reject-auth-request" onClick={() => rejectRequest(location)} disabled={!amIssuer && !amTarget}>Reject</button>
      </li>
      <li key="issuer">Issuer:&nbsp;{amIssuer ? "me" : presentLongHex(authorisationRequest.issuer.did)}</li>
      <li key="target">Target:&nbsp;{amTarget ? "me" : presentLongHex(target)}</li>
      <li key="expiry">Expiry:&nbsp;{authorisationRequest.expiry?.toISOString()}</li>
      <li key="data">Data:&nbsp;{presentAuthorisation(authorisationRequest.data, [...location, "data"])}</li>
    </ul>
  }

  function presentAuthorisationRequests(authorisationRequests: AuthorizationRequest[], location: MyInfoPath): JSX.Element {
    if (typeof authorisationRequests === "undefined" || authorisationRequests === null || authorisationRequests.length === 0) return <div>No authorisations</div>
    return <ul>{
      authorisationRequests
        .map((request: AuthorizationRequest, requestIndex: number) => presentAuthorisationRequest(request, [...location, requestIndex]))
        .map((presented, requestIndex: number) => <li key={requestIndex}>
          Authorisation {requestIndex}:&nbsp;{presented}
        </li>)
    }</ul>
  }

  async function acceptRequest(location: MyInfoPath): Promise<void> {
    const request: AuthorizationRequest = findValue(myInfo, location)
    setStatus(`Accepting request ${request.authId}`)
    await (await request.accept()).run()
    setStatus(`Request ${request.authId} accepted`)
    await loadAuthorisations()
  }

  async function rejectRequest(location: MyInfoPath): Promise<void> {
    const request: AuthorizationRequest = findValue(myInfo, location)
    setStatus(`Rejecting request ${request.authId}`)
    await (await request.remove()).run()
    setStatus(`Request ${request.authId} rejected`)
    await loadAuthorisations()
  }

  async function loadAttestationsReceived(): Promise<void> {
    const api: Polymesh = await getPolyWalletApi()
    const me: Identity = await api.getCurrentIdentity()
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

  async function fetchMyCddId(location: MyInfoPath): Promise<void> {
    const api: Polymesh = await getPolyWalletApi()
    return fetchCddId(location, await api.getCurrentIdentity())
  }

  async function fetchCddId(location: MyInfoPath, target: string | Identity): Promise<void> {
    const api: Polymesh = await getPolyWalletApi()
    const targetDid: string = typeof target === "string" ? target : target.did
    if (typeof targetDid === "undefined" || targetDid === null || targetDid === "") throw new Error(`You need to put a valid target first, not ${targetDid}`)
    setStatus(`Fetching Cdd attestation received by ${targetDid}`)
    const claims: ClaimData<Claim>[] = (await api.claims.getCddClaims({
      target: target,
      includeExpired: false,
    }))
    if (claims.length === 0) throw new Error(`No CDD claims attached to ${targetDid}`)
    setMyInfo(returnUpdatedCreator(location, (claims[0].claim as CddClaim).id))
  }

  function presentClaimData(claimData: ClaimData<Claim>, location: MyInfoPath, canManipulate: boolean): JSX.Element {
    canManipulate = claimData.issuer.did === myInfo.myDid
    return <ul>
      <li key="target">Target:&nbsp;
        <input defaultValue={claimData.target.did} placeholder="0x123" disabled={!canManipulate}
          onChange={onRequirementChangedCreator(
            [...location, "target"],
            false,
            async (e) => Promise.resolve((await getPolyWalletApi()).getIdentity({ did: e.target.value })))} />
      </li>
      <li key="issuer">Issuer:&nbsp;
        <input defaultValue={claimData.issuer.did} placeholder="0x123" disabled={!canManipulate}
          onChange={onRequirementChangedCreator(
            [...location, "issuer"],
            false,
            async (e) => Promise.resolve((await getPolyWalletApi()).getIdentity({ did: e.target.value })))} />
      </li>
      <li key="issuedAt">Issued at: {claimData.issuedAt.toISOString()}</li>
      <li key="expiry">Expiry:&nbsp;
        <input defaultValue={claimData.expiry?.toISOString() || ""} placeholder="2020-12-01" disabled={!canManipulate}
          onChange={onRequirementChangedCreator(
            [...location, "expiry"],
            false,
            async (e) => Promise.resolve(new Date(e.target.value)))} />
      </li>
      <li key="claim">Claim:&nbsp;
        {presentClaim(claimData.claim, [...location, "claim"], canManipulate)}
      </li>
    </ul>
  }

  function presentClaimTarget(claimTarget: ClaimTarget, location: MyInfoPath, canManipulate: boolean): JSX.Element {
    return <ul>
      <li key="target">Target:&nbsp;
        <input defaultValue={typeof claimTarget.target === "string" ? claimTarget.target : claimTarget.target.did} placeholder="0x123"
          onChange={onRequirementChangedCreator([...location, "target"])}
          disabled={!canManipulate}
        />
      </li>
      <li key="expiry">Expiry:&nbsp;
        <input defaultValue={claimTarget.expiry?.toISOString() || null} placeholder="2020-12-01" disabled={!canManipulate}
          onChange={onRequirementChangedCreator(
            [...location, "expiry"],
            false,
            async (e) => Promise.resolve(e.target.value === "" ? null : new Date(e.target.value)))} />
      </li>
      <li key="claim">Claim:&nbsp;
        {presentClaim(claimTarget.claim, [...location, "claim"], canManipulate)}
      </li>
    </ul>
  }

  function presentClaimDatas(claimDatas: ClaimData<Claim>[] | null, location: MyInfoPath, canManipulate: boolean): JSX.Element {
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

  async function revokeAttestation(location: MyInfoPath): Promise<void> {
    const toRevoke = findValue(myInfo, location)
    const api: Polymesh = await getPolyWalletApi()
    await (await api.claims.revokeClaims({
      claims: [toRevoke]
    })).run()
  }

  async function addAttestation(location: MyInfoPath): Promise<void> {
    const toAdd: ClaimTarget = findValue(myInfo, location)
    const api: Polymesh = await getPolyWalletApi()
    setStatus("Adding attestation")
    await (await api.claims.addClaims({ claims: [toAdd] })).run()
    setStatus("Attestation added")
  }

  async function addUniquenessAttestation(location: MyInfoPath): Promise<void> {
    const toAdd: AddInvestorUniquenessClaimParams = Object.assign({}, findValue(myInfo, location))
    const api: Polymesh = await getPolyWalletApi()
    const currentIdentity: Identity = await api.getCurrentIdentity()
    const polyWallet = (window || {})["polyWallet"]
    const network = await polyWallet.network.get()
    const crypto = await import('@polymathnetwork/confidential-identity')
    const data = await polyWallet.uid.requestProof({ ticker: toAdd.scope.value })
      .catch((e) => {
        if (e.message !== "Uid not found") throw e
        const mockedUid: string = crypto.create_mocked_investor_uid(currentIdentity.did)
        return polyWallet.uid.provide({
          uid: mockedUid,
          did: currentIdentity.did,
          network: network.name,
        })
      })
      .then(() => polyWallet.uid.requestProof({ ticker: toAdd.scope.value }))
    toAdd.proof = data.proof
    toAdd.scopeId = data.scope_id
    setMyInfo(returnUpdatedCreator([...location, "proof"], data.proof))
    setMyInfo(returnUpdatedCreator([...location, "scopeId"], data.scope_id))
    await (await api.claims.addInvestorUniquenessClaim(toAdd)).run()
  }

  async function createPortfolio(): Promise<NumberedPortfolio> {
    const api: Polymesh = await getPolyWalletApi()
    const me: Identity = await api.getCurrentIdentity()
    const newPortfolio = await (await me.portfolios.create({ name: myInfo.portfolios.newPortfolioName })).run()
    await loadMyPortfolios()
    return newPortfolio
  }

  async function deletePortfolio(portfolio: BigNumber | NumberedPortfolio): Promise<void> {
    const api: Polymesh = await getPolyWalletApi()
    const me: Identity = await api.getCurrentIdentity()
    await (await me.portfolios.delete({ portfolio })).run()
    await loadMyPortfolios()
  }

  async function loadMyPortfolios(): Promise<[DefaultPortfolio, ...NumberedPortfolio[]]> {
    const api: Polymesh = await getPolyWalletApi()
    const me: Identity = await api.getCurrentIdentity()
    const mine = await loadPortfolios(me.did)
    setMyInfo(returnUpdatedCreator(["portfolios", "mine"], mine))
    return mine
  }

  async function loadOtherPortfolios(): Promise<[DefaultPortfolio, ...NumberedPortfolio[]]> {
    return await loadPortfolios(myInfo.portfolios.otherOwner)
  }

  async function loadPortfolios(whose: string): Promise<[DefaultPortfolio, ...NumberedPortfolio[]]> {
    const api: Polymesh = await getPolyWalletApi()
    const who: Identity = await api.getIdentity({ did: whose })
    setStatus(`Loading portfolios of ${presentLongHex(whose)}`)
    const portfolios: [DefaultPortfolio, ...NumberedPortfolio[]] = await who.portfolios.getPortfolios()
    setStatus(`Portfolios of ${presentLongHex(whose)} retrieved`)
    await setPortfolios(portfolios)
    return portfolios
  }

  async function loadMyCustodiedPortfolios(): Promise<(DefaultPortfolio | NumberedPortfolio)[]> {
    const api: Polymesh = await getPolyWalletApi()
    const me: Identity = await api.getCurrentIdentity()
    setStatus("Loading my custodied portfolios")
    const result: ResultSet<DefaultPortfolio | NumberedPortfolio> = await me.portfolios.getCustodiedPortfolios()
    setStatus("My custodied portfolios loaded")
    await setPortfolios(result.data)
    return result.data
  }

  async function getPortfolioInfo(portfolio: DefaultPortfolio | NumberedPortfolio): Promise<PortfolioInfoJson> {
    const custodian: Identity = await portfolio.getCustodian()
    return {
      original: portfolio,
      owner: portfolio.owner.did,
      id: portfolio instanceof NumberedPortfolio ? portfolio.id.toString(10) : "null",
      name: portfolio instanceof NumberedPortfolio ? await portfolio.getName() : "null",
      custodian: custodian.did,
      newCustodian: custodian.did,
    }
  }

  async function getPortfolioInfos(portfolios: (DefaultPortfolio | NumberedPortfolio)[]): Promise<PortfolioInfoJson[]> {
    return Promise.all(portfolios.map(getPortfolioInfo));
  }

  async function setPortfolios(portfolios: (DefaultPortfolio | NumberedPortfolio)[]): Promise<void> {
    const portfolioInfos: PortfolioInfoJson[] = await getPortfolioInfos(portfolios)
    setMyInfo(returnUpdatedCreator(["portfolios", "details"], portfolioInfos))
  }

  async function setCustodian(portfolio: PortfolioInfoJson, location: MyInfoPath): Promise<void> {
    setStatus("Setting custodian")
    await (await portfolio.original.setCustodian({ targetIdentity: portfolio.newCustodian })).run()
    setStatus("Custodian set")
    await loadMyPortfolios()
  }

  async function relinquishCustody(portfolio: PortfolioInfoJson, location: MyInfoPath): Promise<void> {
    setStatus("Relinquishing custody")
    await (await portfolio.original.setCustodian({ targetIdentity: portfolio.owner })).run()
    setStatus("Custody relinquished")
    await loadPortfolios(portfolio.owner)
  }

  function presentPorfolioJson(portfolio: PortfolioInfoJson, location: MyInfoPath, canManipulate: boolean): JSX.Element {
    const isCustodied: boolean = portfolio.owner !== portfolio.custodian
    const isMine: boolean = portfolio.owner === myInfo.myDid
    const canSetCustody: boolean = canManipulate && isMine && !isCustodied
    const canRelinquish: boolean = canManipulate && isCustodied && portfolio.custodian === myInfo.myDid
    return <ul>
      <li key="owner">Owner:&nbsp;{portfolio.owner === myInfo.myDid ? "me" : presentLongHex(portfolio.owner)}</li>
      <li key="id">
        Id:&nbsp;{portfolio.id}&nbsp;{(function () {
          if (portfolio.id === "null") return ""
          return <button className="submit delete-portfolio" onClick={() => deletePortfolio(new BigNumber(portfolio.id))} disabled={!canManipulate}>Delete</button>
        })()}
      </li>
      <li key="name">Name:&nbsp;{portfolio.name}</li>
      <li key="custodian">Custodian:&nbsp;
        <input defaultValue={portfolio.custodian} placeholder="0x123" onChange={onRequirementChangedCreator([...location, "newCustodian"])} disabled={!canSetCustody} />
        &nbsp;
        <button className="submit set-custodian" onClick={() => setCustodian(portfolio, location)} disabled={!canSetCustody}>Set</button>
        &nbsp;
        <button className="submit unset-custodian" onClick={() => relinquishCustody(portfolio, location)} disabled={!canRelinquish}>Unset</button>
      </li>
    </ul>
  }

  function presentPorfoliosJson(portfolios: PortfolioInfoJson[], location: MyInfoPath, canManipulate: boolean): JSX.Element {
    if (typeof portfolios === "undefined" || portfolios === null || portfolios.length === 0) return <div>There are no portfolios</div>
    return <ul>{
      portfolios
        .map((portfolio: PortfolioInfoJson, portfolioIndex: number) => presentPorfolioJson(portfolio, [...location, portfolioIndex], canManipulate))
        .map((presented: JSX.Element, portfolioIndex: number) => <li key={portfolioIndex}>
          Portfolio {portfolioIndex}:&nbsp;{presented}
        </li>)
    }</ul>
  }

  async function loadCheckpoints(token: SecurityToken): Promise<CheckpointWithCreationDate[]> {
    const checkpoints: CheckpointWithCreationDate[] = await token.checkpoints.get()
    await setCheckpoints(checkpoints)
    await loadCheckpointSchedules(token)
    return checkpoints
  }

  async function setCheckpoints(current: CheckpointWithCreationDate[]): Promise<CheckpointInfoJson[]> {
    setMyInfo(returnUpdatedCreator(["checkpoints", "current"], current))
    const details: CheckpointInfoJson[] = await Promise.all(current
      .map((checkpointWith: CheckpointWithCreationDate) => getCheckpointInfo(checkpointWith)))
    setMyInfo(returnUpdatedCreator(["checkpoints", "details"], details))
    if (details.length > 0) setMyInfo(returnUpdatedCreator(["corporateActions", "distributions", "newDividend", "checkpoint"], details[0].checkpoint))
    return details
  }

  async function getCheckpointInfo(checkpointWith: CheckpointWithCreationDate | Checkpoint): Promise<CheckpointInfoJson> {
    const checkpoint: Checkpoint = isCheckpointWithCreationDate(checkpointWith) ? checkpointWith.checkpoint : checkpointWith
    const [totalSupply, createdAt]: [BigNumber, Date] = await Promise.all([
      checkpoint.totalSupply(),
      isCheckpointWithCreationDate(checkpointWith) ? checkpointWith.createdAt : checkpointWith.createdAt()
    ])
    return {
      checkpoint: checkpoint,
      totalSupply: totalSupply,
      createdAt: createdAt,
      whoseBalance: "",
      balance: new BigNumber(0),
    }
  }

  async function createCheckpoint(): Promise<Checkpoint> {
    const checkpoint: Checkpoint = await (await myInfo.token.current.checkpoints.create()).run()
    await loadCheckpoints(myInfo.token.current)
    return checkpoint
  }

  async function loadBalanceAtCheckpoint(checkpoint: CheckpointInfoJson, whoseBalance: string, location: MyInfoPath): Promise<string> {
    const balance: string = (await checkpoint.checkpoint.balance({ identity: whoseBalance })).toString(10)
    setMyInfo(returnUpdatedCreator([...location, "balance"], balance))
    return balance
  }

  async function createScheduledCheckpoint(): Promise<CheckpointSchedule> {
    const schedule: CheckpointSchedule = await (await myInfo.token.current.checkpoints.schedules.create(myInfo.checkpoints.scheduledToAdd)).run()
    await loadCheckpointSchedules(myInfo.token.current)
    return schedule
  }

  async function loadCheckpointSchedules(token: SecurityToken): Promise<ScheduleWithDetails[]> {
    const schedules: ScheduleWithDetails[] = await token.checkpoints.schedules.get()
    await setCheckpointSchedules(schedules)
    await loadCorporateActions(token)
    return schedules
  }

  async function setCheckpointSchedules(currentSchedules: ScheduleWithDetails[]): Promise<CheckpointScheduleDetailsInfoJson[]> {
    setMyInfo(returnUpdatedCreator(["checkpoints", "currentSchedules"], currentSchedules))
    const scheduleDetails: CheckpointScheduleDetailsInfoJson[] = await Promise.all(currentSchedules.map(getCheckpointScheduleDetailsInfo))
    setMyInfo(returnUpdatedCreator(["checkpoints", "scheduleDetails"], scheduleDetails))
    return scheduleDetails
  }

  async function getCheckpointScheduleInfo(schedule: CheckpointSchedule): Promise<CheckpointScheduleInfoJson> {
    const createdCheckpoints: Checkpoint[] = await schedule.getCheckpoints()
    const createdCheckpointInfos: CheckpointInfoJson[] = await Promise.all(createdCheckpoints.map(getCheckpointInfo))
    const exists: boolean = await schedule.exists()
    return {
      schedule: schedule,
      createdCheckpoints: createdCheckpointInfos,
      exists: exists,
    }
  }

  async function getCheckpointScheduleDetailsInfo(scheduleInfo: ScheduleWithDetails): Promise<CheckpointScheduleDetailsInfoJson> {
    return {
      ...await getCheckpointScheduleInfo(scheduleInfo.schedule),
      remainingCheckpoints: scheduleInfo.details.remainingCheckpoints,
      nextCheckpointDate: scheduleInfo.details.nextCheckpointDate,
    }
  }

  function onRequirementChangedDateCreator(path: MyInfoPath) {
    return onRequirementChangedCreator(path, false, (e) => {
      const newDate: Date = new Date(e.target.value)
      if (newDate.toDateString() === "Invalid Date") return Promise.resolve(findValue(myInfo, path))
      return Promise.resolve(newDate)
    })
  }

  async function setCorporateActionsAgent(): Promise<void> {
    setStatus("Setting corporate actions agent")
    await (await myInfo.token.current.corporateActions.setAgent(myInfo.corporateActions.newAgent)).run()
  }

  async function removeCorporateActionsAgent(): Promise<void> {
    setStatus("Removing corporate actions agent")
    await (await myInfo.token.current.corporateActions.removeAgent()).run()
  }

  async function createDividendDistribution(): Promise<DividendDistribution> {
    setStatus("Creating dividend distribution")
    const distribution: DividendDistribution = await (await myInfo.token.current.corporateActions.distributions.configureDividendDistribution(myInfo.corporateActions.distributions.newDividend)).run()
    await loadDividendDistributions(myInfo.token.current)
    return distribution
  }

  async function loadCorporateActions(token: SecurityToken): Promise<void> {
    setStatus("Loading corporate actions")
    const agent: Identity = await token.corporateActions.getAgent()
    setMyInfo(returnUpdatedCreator(["corporateActions", "agent"], agent))
    await loadDividendDistributions(token)
  }

  async function loadDividendDistributions(token: SecurityToken): Promise<DistributionWithDetails[]> {
    setStatus("Loading dividend distributions")
    const actions: DistributionWithDetails[] = await token.corporateActions.distributions.get()
    await setDividendDistributions(actions)
    return actions
  }

  async function setDividendDistributions(actions: DistributionWithDetails[]): Promise<DividendDistributionInfoJson[]> {
    const actionInfos: DividendDistributionInfoJson[] = await getDividendDistributionInfos(actions.map(action => action.distribution))
    setMyInfo(returnUpdatedCreator(["corporateActions", "distributions", "dividends"], actionInfos))
    return actionInfos
  }

  async function getDividendDistributionInfos(actions: DividendDistribution[]): Promise<DividendDistributionInfoJson[]> {
    return Promise.all(actions.map(getDividendDistributionInfo))
  }

  async function getDividendDistributionInfo(action: DividendDistribution): Promise<DividendDistributionInfoJson> {
    return {
      ...(await getCorporateActionInfo(action)),
      current: action,
      origin: await getPortfolioInfo(action.origin),
      details: await action.details(),
      participants: await action.getParticipants(),
    }
  }

  async function getCorporateActionInfo(action: CorporateAction): Promise<CorporateActionInfoJson> {
    const checkpoint: Checkpoint | CheckpointSchedule = await action.checkpoint()
    const isSchedule: boolean = isCheckpointSchedule(checkpoint)
    return {
      current: action,
      exists: await action.exists(),
      checkpoint: checkpoint === null ? null : isSchedule ? null : await getCheckpointInfo(checkpoint as Checkpoint),
      checkpointSchedule: checkpoint === null ? null : isSchedule ? await getCheckpointScheduleInfo(checkpoint as CheckpointSchedule) : null,
    }
  }

  function presentCorporateAction(action: CorporateActionInfoJson, location: MyInfoPath, canManipulate: boolean): JSX.Element {
    return <ul>{presentCorporateActionInner(action, location, canManipulate)}</ul>
  }

  function presentCorporateActionInner(action: CorporateActionInfoJson, location: MyInfoPath, canManipulate: boolean): JSX.Element[] {
    return [
      <li key="id">Id:&nbsp;{action.current.id.toString(10)}</li>,
      <li key="ticker">Ticker:&nbsp;{action.current.ticker}</li>,
      <li key="declarationDate">Declaration date:&nbsp;{action.current.declarationDate.toISOString()}</li>,
      <li key="description">Description:&nbsp;{action.current.description}</li>,
      (function () {
        if (action.checkpoint !== null) return <li key="checkpoint">
          Checkpoint:&nbsp;
          <CheckpointView
            checkpointInfo={action.checkpoint}
            location={location}
            canManipulate={canManipulate}
            onRequirementChangedCreator={onRequirementChangedCreator}
            loadBalanceAtCheckpoint={loadBalanceAtCheckpoint}
          />
        </li>
        if (action.checkpointSchedule !== null) return <li key="checkpointSchedule">Checkpoint schedule:&nbsp;<CheckpointScheduleView
          scheduleInfo={action.checkpointSchedule}
          location={location}
          canManipulate={canManipulate}
          onRequirementChangedCreator={onRequirementChangedCreator}
          loadBalanceAtCheckpoint={loadBalanceAtCheckpoint}
        />
        </li>
        return <li key="checkpoint">No checkpoint or checkpoint schedule</li>
      })(),
    ]
  }

  function presentDividendDistributions(actions: DividendDistributionInfoJson[], location: MyInfoPath, canManipulate: boolean): JSX.Element {
    return <ul>{
      actions
        .map((action: DividendDistributionInfoJson, actionIndex: number) => presentDividendDistribution(action, [...location, actionIndex], canManipulate))
        .map((presented: JSX.Element, actionIndex: number) => <li key={actionIndex}>
          Dividend distribution {actionIndex}:&nbsp;{presented}
        </li>)
    }</ul>
  }

  function presentDividendDistribution(action: DividendDistributionInfoJson, location: MyInfoPath, canManipulate: boolean): JSX.Element {
    return <ul>{presentDividendDistributionInner(action, location, canManipulate)}</ul>
  }

  function presentDividendDistributionInner(action: DividendDistributionInfoJson, location: MyInfoPath, canManipulate: boolean): JSX.Element[] {
    return [
      ...presentCorporateActionInner(action, location, canManipulate),
      <li key="origin">Origin:&nbsp;{presentPorfolioJson(action.origin, [...location, "origin"], canManipulate)}</li>,
      <li key="details">Details:&nbsp;{presentDividendDistributionDetails(action.details, [...location, "details"], canManipulate)}</li>,
      <li key="participants">Participants:&nbsp;{presentParticipants(action.participants, [...location, "participants"], canManipulate)}</li>,
    ]
  }

  function presentDividendDistributionDetails(details: DividendDistributionDetails, location: MyInfoPath, canManipulate: boolean): JSX.Element {
    return <ul>
      <li key="remainingFunds">Remaining funds:&nbsp;{details.remainingFunds.toString(10)}</li>
      <li key="fundsReclaimed">Funds reclaimed:&nbsp;{details.fundsReclaimed ? "true" : "false"}</li>
    </ul>
  }

  function presentCorporateActions(actions: CorporateActionInfoJson[], location: MyInfoPath, canManipulate: boolean): JSX.Element {
    if (typeof actions === "undefined" || actions === null || actions.length === 0) return <div>There are no corporate actions</div>
    return <ul>{
      actions
        .map((action: CorporateActionInfoJson, actionIndex: number) => presentCorporateAction(action, [...location, actionIndex], canManipulate))
        .map((presented: JSX.Element, actionIndex: number) => <li key={actionIndex}>
          Corporate action {actionIndex}:&nbsp;{presented}
        </li>)
    }</ul>
  }

  function presentParticipants(participants: DistributionParticipant[], location: MyInfoPath, canManipulate: boolean): JSX.Element {
    return <ul>{
      participants
        .map((participant: DistributionParticipant, participantIndex: number) => presentParticipant(participant, [...location, participantIndex], canManipulate))
        .map((presented: JSX.Element, participantIndex: number) => <li key={participantIndex}>
          Participant {participantIndex}:&nbsp;{presented}
        </li>)
    }</ul>
  }

  function presentParticipant(participant: DistributionParticipant, location: MyInfoPath, canManipulate: boolean): JSX.Element {
    return <ul>
      <li key="identity">Identity:&nbsp;{participant.identity.did}</li>
      <li key="amount">Identity:&nbsp;{participant.amount.toString(10)}</li>
      <li key="paid">Identity:&nbsp;{participant.paid ? "true" : "false"}</li>
    </ul>
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
            <select name="myTickers" defaultValue={myInfo.token.details?.assetType} onChange={onValueChangedCreator(["ticker"])}>
              <option value="" key="Select 1" disabled={true}>Select 1</option>
              {myInfo.myTickers.map((myTicker: string) => <option value={myTicker} key={myTicker}>{myTicker}</option>)}
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
                <li key="owner">Owned by: {myInfo.reservation.details?.owner?.did === myInfo.myDid ? "me" : presentLongHex(myInfo.reservation.details?.owner?.did)}</li>
                <li key="status">With status: {myInfo.reservation.details?.status}</li>
                <li key="expiry">Valid until: {myInfo.reservation.details?.expiryDate?.toISOString()}</li>
              </ul>
            })()
          }</div>

          <div>{
            (() => {
              const canCreate: boolean = myInfo.reservation.current !== null && myInfo.reservation.details?.status === TickerReservationStatus.Reserved && myInfo.reservation.details?.owner?.did === myInfo.myDid
              return <div>
                <div className="submit">
                  <button className="submit transfer-reservation" onClick={transferReservationOwnership} disabled={!canCreate}>Transfer ownership</button>
                </div>
                <div className={styles.card}>
                  <div>
                    <label htmlFor="token-name">
                      <span className={styles.hasTitle} title="Long name of your security token">Name</span>
                    </label>
                    <input name="token-name" type="text" placeholder="American CME" defaultValue={myInfo.token.details?.name} disabled={!canCreate} onChange={onValueChangedCreator(["token", "details", "name"])} />
                  </div>
                  <div>
                    <label htmlFor="token-divisible">
                      <span className={styles.hasTitle} title="Whether it can be sub-divided">Divisible</span>
                    </label>
                    <input name="token-divisible" type="checkbox" defaultChecked={myInfo.token.details?.isDivisible} disabled={!canCreate} onChange={onValueChangedCreator(["token", "details", "divisible"], false, checkboxProcessor)} />
                  </div>
                  <div>
                    <label htmlFor="token-assetType">
                      <span className={styles.hasTitle} title="Pick one from the list or type what you want">Asset Type</span>
                    </label>
                    <input name="token-assetType" type="text" placeholder="Equity Common" defaultValue={myInfo.token.details?.assetType} disabled={!canCreate} onChange={onValueChangedCreator(["token", "details", "assetType"])} />
                    &nbsp;
                    <select name="known-assetTypes" defaultValue={myInfo.token.details?.assetType} disabled={!canCreate} onChange={onValueChangedCreator(["token", "details", "assetType"])}>
                      {presentEnumOptions(KnownTokenType)}
                    </select>
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
              const owner: string = myInfo.token.details?.owner?.did
              const pia: string = myInfo.token.details?.primaryIssuanceAgent?.did
              if (myInfo.token.current === null) return "There is no token"
              else return <ul>
                <li key="owner">Owned by: {owner === myInfo.myDid ? "me" : presentLongHex(myInfo.reservation.details?.owner?.did)}</li>
                <li key="assetType">As asset type: {myInfo.token.details?.assetType}</li>
                <li key="divisible">{myInfo.token.details?.isDivisible ? "" : "not"} divisible</li>
                <li key="createdAt">Created at: #{myInfo.token.createdAt?.blockNumber?.toString(10)}/{myInfo.token.createdAt?.eventIndex?.toString(10)}, on {myInfo.token.createdAt?.blockDate}</li>
                <li key="pia">
                  With PIA: {pia === myInfo.myDid ? "me" : presentLongHex(pia)}
                  &nbsp;
                  <button className="submit remove-token-pia" onClick={removeTokenPia} disabled={owner !== myInfo.myDid || owner === pia}>Remove</button>
                </li>
                <li key="totalSupply">And total supply of: {myInfo.token.details?.totalSupply?.toString(10)}</li>
              </ul>
            })()
          }</div>

          <fieldset className={styles.card}>
            <legend>New owner</legend>
            {
              (() => {
                const canManipulate: boolean = myInfo.token.current !== null && myInfo.token.details?.owner?.did === myInfo.myDid
                return <div className="submit">
                  Target:&nbsp;
                  <input name="token-ownership-target" type="text" placeholder="0x1234" defaultValue={myInfo.token.ownershipTarget} disabled={!canManipulate} onChange={onValueChangedCreator(["token", "ownershipTarget"])} />
                  &nbsp;
                  <button className="submit transfer-token" onClick={transferTokenOwnership} disabled={!canManipulate}>Transfer ownership</button>
                </div>
              })()
            }
          </fieldset>

          <fieldset className={styles.card}>
            <legend>New PIA</legend>
            {
              (() => {
                const canManipulate: boolean = myInfo.token.current !== null && myInfo.token.details?.owner?.did === myInfo.myDid
                const target: string = typeof myInfo.token.piaChangeInfo.target === "string" ? myInfo.token.piaChangeInfo.target : myInfo.token.piaChangeInfo.target.did
                return <div className="submit">
                  Target:&nbsp;
                  <input name="token-pia-target" type="text" placeholder="0x1234" defaultValue={target} disabled={!canManipulate} onChange={onValueChangedCreator(["token", "piaChangeInfo", "target"])} />
                  <br />
                  Request expiry:&nbsp;
                  <input name="token-pia-expiry" type="text" placeholder="2020-12-31" defaultValue={myInfo.token.piaChangeInfo.requestExpiry?.toISOString()} disabled={!canManipulate}
                    onChange={onValueChangedCreator(["token", "piaChangeInfo", "target"], false, (e) => Promise.resolve(new Date(e.target.value)))} />
                  &nbsp;
                  <button className="submit change-token-pia" onClick={changeTokenPia} disabled={!canManipulate}>Change PIA</button>
                  <br />
                  See lower for the pending authorisation
                </div>
              })()
            }
          </fieldset>

          <fieldset className={styles.card}>
            <legend>Issuance - Redemption</legend>

            <div>
              PIA's {myInfo.ticker} default portfolio balance total: {myInfo.token.piaBalance.total}. Locked: {myInfo.token.piaBalance.locked}
            </div>
            {
              (() => {
                const isPia: boolean = myInfo.token?.details?.primaryIssuanceAgent?.did === myInfo.myDid
                const isOwner: boolean = myInfo.token?.details?.owner?.did === myInfo.myDid
                const canManipulate: boolean = isPia || isOwner
                const target: string = typeof myInfo.token.piaChangeInfo.target === "string" ? myInfo.token.piaChangeInfo.target : myInfo.token.piaChangeInfo.target.did
                return <div className="submit">
                  Amount to issue&nbsp;
                  <input name="token-issue-amount" type="string" placeholder="100" defaultValue={myInfo.token.piaBalance.toIssue} disabled={!canManipulate} onChange={onValueChangedCreator(["token", "piaBalance", "toIssue"])} />
                  &nbsp;
                  <button className="submit issue-pia" onClick={issueTokens} disabled={!canManipulate}>Issue</button>
                  <br />
                  Amount to redeem&nbsp;
                  <input name="token-redeem-amount" type="string" placeholder="100" defaultValue={myInfo.token.piaBalance.toRedeem} disabled={!canManipulate} onChange={onValueChangedCreator(["token", "piaBalance", "toRedeem"])} />
                  &nbsp;
                  <button className="submit issue-pia" onClick={redeemTokens} disabled={!canManipulate}>Redeem</button>
                </div>
              })()
            }
          </fieldset>

        </fieldset>

        <fieldset className={styles.card}>
          <legend>Compliance Requirements For: {myInfo.token.current?.ticker}</legend>

          <div className="submit">
            <button className="submit add-requirement" onClick={() => addToMyRequirementArray(["requirements", "current"], { id: Math.round(Math.random() * 1000), conditions: [] })} disabled={!myInfo.requirements.canManipulate}>Add requirement</button>
          </div>

          <div>{presentRequirements(myInfo.requirements.current, ["requirements", "current"], myInfo.requirements.canManipulate)}</div>

          <div>{
            (() => {
              const canManipulate: boolean = myInfo.token.current !== null && myInfo.token.details?.owner?.did === myInfo.myDid && myInfo.requirements.modified
              return <div className="submit">
                <button className="submit save-requirements" onClick={saveRequirements} disabled={!canManipulate}>Save the whole list of requirements</button>
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
              <button className="submit pick-me-for-sender" onClick={onValueChangedCreator(["requirements", "settleSimulation", "sender"], false, getMyDid)}>Pick mine</button>
            </div>
            <div>To:&nbsp;
              <input defaultValue={myInfo.requirements.settleSimulation.recipient} placeholder="0x123" onChange={onValueChangedCreator(["requirements", "settleSimulation", "recipient"])} />
              &nbsp;
              <button className="submit pick-me-for-recipient" onClick={onValueChangedCreator(["requirements", "settleSimulation", "recipient"], false, getMyDid)}>Pick mine</button>
            </div>
            <div className="submit">
              <button className="submit simulate-compliance" onClick={simulateCompliance} disabled={myInfo.token.current === null}>Try</button>
            </div>
            <div>Result: {myInfo.requirements.settleSimulation.works === null ? "No info" : myInfo.requirements.settleSimulation.works ? "Aye" : "Nay"}</div>
          </div>

        </fieldset>

        <fieldset className={styles.card}>
          <legend>My authorisation requests</legend>

          <div className="submit">
            <button className="submit load-authorisations" onClick={loadAuthorisations}>Load authorisations</button>
          </div>

          <div>{presentAuthorisationRequests(myInfo.authorisations.current, ["authorisations", "current"])}</div>

        </fieldset>

        <fieldset className={styles.card}>
          <legend>Attestations</legend>

          <div className="submit">
            <button className="submit load-attestations-received" onClick={loadAttestationsReceived}>Load attestations I received</button>
          </div>
          <div className="submit">
            <button className="submit load-attestations-received-by" onClick={loadAttestationsReceivedBy}>Load attestations received by</button>
            &nbsp;
            <input defaultValue={myInfo.attestations.otherTarget} placeholder="0x123" onChange={onRequirementChangedCreator(["attestations", "otherTarget"])} />
          </div>

          <div>{presentClaimDatas(myInfo.attestations.current, ["attestations", "current"], true)}</div>

          <div className={styles.card}>
            <div>Attestation to add:</div>
            <div>{presentClaimTarget(myInfo.attestations.toAdd, ["attestations", "toAdd"], true)}</div>
            <div className="submit">
              <button className="submit add-attestation" onClick={() => addAttestation(["attestations", "toAdd"])}>Add KYC attestation</button>
            </div>
            <div>It takes some time for the added attestation<br />to show in the list above because the<br />middleware first needs to be updated</div>
          </div>

          <div className={styles.card}>
            <div>Investor uniqueness to add to yourself:</div>

            <div>{presentAddInvestorUniquenessClaimParams(myInfo.attestations.uniquenessToAdd, ["attestations", "uniquenessToAdd"], true)}</div>

            <div className="submit">
              <button className="submit add-unique-attestation" onClick={() => addUniquenessAttestation(["attestations", "uniquenessToAdd"])}>Add uniqueness attestation</button>
            </div>
            <div>It takes some time for the added attestation<br />to show in the list above because the<br />middleware needs to be updated</div>
          </div>

        </fieldset>

        <fieldset className={styles.card}>
          <legend>Portfolios</legend>

          <div className="submit">
            <button className="submit load-my-portfolios" onClick={loadMyPortfolios}>Load my portfolios</button>
            &nbsp;
            <button className="submit load-my-custodied-portfolios" onClick={loadMyCustodiedPortfolios}>Load my custodied portfolios</button>
            <br />
            <button className="submit load-portfolios" onClick={loadOtherPortfolios}>Load portfolios of</button>
            &nbsp;
            <input defaultValue={myInfo.portfolios.otherOwner} placeholder="0x123" onChange={onRequirementChangedCreator(["portfolios", "otherOwner"])} />
          </div>

          {presentPorfoliosJson(myInfo.portfolios.details, ["portfolios", "details"], true)}

          <div>See in the authorisations box above<br />for the pending custody authorisation</div>

          <div className={styles.card}>
            <div>Numbered portfolio to create:</div>
            <div className="submit">
              <input defaultValue={myInfo.portfolios.newPortfolioName} placeholder="Trading portfolio" disabled={false}
                onChange={onRequirementChangedCreator(["portfolios", "newPortfolioName"])} />
              &nbsp;
              <button className="submit create-portfolio" onClick={createPortfolio}>Create</button>
            </div>
          </div>

        </fieldset>

        <fieldset className={styles.card}>
          <legend>Checkpoints for: {myInfo.token.current?.ticker}</legend>

          <div className="submit">{
            (() => {
              const canManipulate: boolean = myInfo.token?.current !== null && myInfo.token?.details?.owner?.did === myInfo.myDid
              return <div className="submit">
                <button className="submit create-checkpoint" onClick={createCheckpoint} disabled={!canManipulate}>Create 1 now</button>
              </div>
            })()
          }</div>

          <div>
            <CheckpointsView
              checkpoints={myInfo.checkpoints?.details}
              location={["checkpoints", "details"]}
              canManipulate={true}
              onRequirementChangedCreator={onRequirementChangedCreator}
              loadBalanceAtCheckpoint={loadBalanceAtCheckpoint}
            />
          </div>

          <div className={styles.card}>{
            (() => {
              const canManipulate: boolean = myInfo.token?.current !== null && myInfo.token?.details?.owner?.did === myInfo.myDid
              return <div>
                Create new:
                <ul>
                  <li key="start">
                    Start at:&nbsp;
                    <input defaultValue={myInfo.checkpoints.scheduledToAdd.start?.toISOString()} placeholder="2021-12-31T06:00:00Z" disabled={!canManipulate}
                      onChange={onRequirementChangedDateCreator(["checkpoints", "scheduledToAdd", "start"])} />
                  </li>
                  <li key="periodValue">
                    Period value:&nbsp;
                    <input defaultValue={myInfo.checkpoints.scheduledToAdd.period?.amount?.toString(10)} placeholder="5" disabled={!canManipulate}
                      onChange={onRequirementChangedCreator(["checkpoints", "scheduledToAdd", "period", "amount"], false, (e) => Promise.resolve(parseInt(e.target.value)))} />
                  </li>
                  <li key="periodUnit">
                    Period unit:&nbsp;
                    <select defaultValue={myInfo.checkpoints.scheduledToAdd.period?.unit} disabled={!canManipulate}
                      onChange={onRequirementChangedCreator(["checkpoints", "scheduledToAdd", "period", "unit"])}>
                      {presentEnumOptions(CalendarUnit)}
                    </select>
                  </li>
                  <li key="repetitions">
                    Repetitions:&nbsp;
                    <input defaultValue={myInfo.checkpoints.scheduledToAdd.repetitions.toString(10)} placeholder="0" disabled={!canManipulate}
                      onChange={onRequirementChangedCreator(["checkpoints", "scheduledToAdd", "repetitions"], false, (e) => Promise.resolve(parseInt(e.target.value)))} />
                  </li>
                </ul>

                <div className="submit">
                  <div className="submit">
                    <button className="submit create-scheduled-checkpoint" onClick={createScheduledCheckpoint} disabled={!canManipulate}>Create scheduled</button>
                  </div>
                </div>

              </div>
            })()
          }</div>

          <div>
            <CheckpointScheduleDetailsView
              schedules={myInfo.checkpoints.scheduleDetails}
              location={["checkpoints", "scheduleDetails"]}
              canManipulate={true}
              onRequirementChangedCreator={onRequirementChangedCreator}
              loadBalanceAtCheckpoint={loadBalanceAtCheckpoint}
            />
          </div>

        </fieldset>

        <fieldset className={styles.card}>
          <legend>Corporate actions for: {myInfo.token.current?.ticker}</legend>

          <div>{
            (() => {
              const owner: string = myInfo.token.details?.owner?.did
              const caa: string = myInfo.corporateActions.agent?.did
              if (myInfo.token.current === null) return "There is no token"
              else return <ul>
                <li key="caa">
                  With agent: {typeof caa === "undefined" || caa === null ? "" : caa === myInfo.myDid ? "me" : presentLongHex(caa)}
                  &nbsp;
                  <button className="submit remove-token-caa" onClick={removeCorporateActionsAgent} disabled={owner !== myInfo.myDid || owner === caa}>Remove</button>
                </li>
              </ul>
            })()
          }</div>

          <fieldset className={styles.card}>
            <legend>New corporate actions agent</legend>
            {
              (() => {
                const canManipulate: boolean = myInfo.token.current !== null && myInfo.token.details?.owner?.did === myInfo.myDid
                const target: string = typeof myInfo.corporateActions.newAgent.target === "string" ? myInfo.corporateActions.newAgent.target : myInfo.corporateActions.newAgent.target.did
                return <div className="submit">
                  Target:&nbsp;
                  <input name="token-caa-target" type="text" placeholder="0x1234" defaultValue={target} disabled={!canManipulate} onChange={onValueChangedCreator(["corporateActions", "newAgent", "target"])} />
                  <br />
                  Request expiry:&nbsp;
                  <input name="token-caa-expiry" type="text" placeholder="2020-12-31" defaultValue={myInfo.corporateActions.newAgent.requestExpiry?.toISOString()} disabled={!canManipulate}
                    onChange={onValueChangedCreator(["corporateActions", "newAgent", "target"], false, (e) => Promise.resolve(new Date(e.target.value)))} />
                  &nbsp;
                  <button className="submit change-token-caa" onClick={setCorporateActionsAgent} disabled={!canManipulate}>Set Agent</button>
                  <br />
                  See above for the pending authorisation
                </div>
              })()
            }
          </fieldset>

        </fieldset>

        <fieldset className={styles.card}>
          <legend>Dividend distributions for: {myInfo.token.current?.ticker}</legend>

          <div className="submit">{
            (() => {
              const canManipulate: boolean = myInfo.token?.current !== null && (myInfo.token?.details?.owner?.did === myInfo.myDid || myInfo.corporateActions?.agent?.did === myInfo.myDid)
              return <div className="submit">
                <button className="submit create-dividend-distribution" onClick={createDividendDistribution} disabled={!canManipulate}>Create 1 now</button>
              </div>
            })()
          }</div>

          <div className={styles.card}>{
            (() => {
              const canManipulate: boolean = myInfo.token?.current !== null && (myInfo.token?.details?.owner?.did === myInfo.myDid || myInfo.corporateActions?.agent?.did === myInfo.myDid)
              const currentCheckpointIndex = myInfo.checkpoints.current
                .findIndex((checkpointWith: CheckpointWithCreationDate) => checkpointWith.checkpoint.id.toString(10) === (myInfo.corporateActions.distributions.newDividend.checkpoint as Checkpoint)?.id?.toString(10))
              return <div>
                Create new (no tax handling):
                <ul>
                  <li key="declarationDate">
                    Declaration date:&nbsp;
                    <input defaultValue={myInfo.corporateActions.distributions.newDividend.declarationDate?.toISOString()} placeholder="2021-12-31T06:00:00Z" disabled={!canManipulate}
                      onChange={onRequirementChangedDateCreator(["corporateActions", "distributions", "newDividend", "declarationDate"])} />
                  </li>
                  <li key="checkpoint" title="a choice was made to only use checkpoint">
                    Checkpoint:&nbsp;
                    <select defaultValue={currentCheckpointIndex} disabled={!canManipulate}
                      onChange={onValueChangedCreator(["corporateActions", "distributions", "newDividend", "checkpoint"], false, (e) => {
                        console.log(e);
                        return Promise.resolve(myInfo.checkpoints.current[parseInt(e.target.value)])
                      })}>{
                        [
                          <option key="menu" disabled={true}>Pick a checkpoint</option>,
                          ...myInfo.checkpoints.current
                            .map((checkpointWith: CheckpointWithCreationDate, index: number) => <option key={index} value={index}>
                              {checkpointWith.checkpoint.id.toString(10)}&nbsp;-&nbsp;{checkpointWith.createdAt.toISOString()}
                            </option>)
                        ]
                      }</select>
                  </li>
                  <li key="description">
                    Description:&nbsp;
                    <input defaultValue={myInfo.corporateActions.distributions.newDividend.description} placeholder="Quarterly dividend" disabled={!canManipulate}
                      onChange={onValueChangedCreator(["corporateActions", "distributions", "newDividend", "description"])} />
                  </li>
                  <li key="originPortfolio">
                    Origin portfolio:&nbsp;
                    <select defaultValue={myInfo.corporateActions.distributions.newDividend.originPortfolio?.id?.toString(10)} disabled={!canManipulate}
                      onChange={onValueChangedCreator(["corporateActions", "distributions", "newDividend", "originPortfolio"], false, (e) => Promise.resolve(myInfo.portfolios.mine[e.target.value]))}>{
                        myInfo.portfolios.mine
                          .map((portfolio: NumberedPortfolio, index: number) => <option key={index} value={index}>
                            {isNumberedPortfolio(portfolio) ? portfolio.id.toString(10) : "Default"}
                          </option>)
                      }</select>
                  </li>
                  <li key="currency">
                    Currency:&nbsp;
                    <input defaultValue={myInfo.corporateActions.distributions.newDividend.currency} placeholder="USD" disabled={!canManipulate}
                      onChange={onValueChangedCreator(["corporateActions", "distributions", "newDividend", "currency"])} />
                  </li>
                  <li key="perShare">
                    Per share:&nbsp;
                    <input defaultValue={myInfo.corporateActions.distributions.newDividend.perShare.toString(10)} placeholder="1" disabled={!canManipulate}
                      onChange={onValueChangedCreator(["corporateActions", "distributions", "newDividend", "perShare"], false, (e) => Promise.resolve(new BigNumber(e.target.value)))} />
                  </li>
                  <li key="maxAmount">
                    Max amount:&nbsp;
                    <input defaultValue={myInfo.corporateActions.distributions.newDividend.maxAmount.toString(10)} placeholder="1" disabled={!canManipulate}
                      onChange={onValueChangedCreator(["corporateActions", "distributions", "newDividend", "maxAmount"], false, (e) => Promise.resolve(new BigNumber(e.target.value)))} />
                  </li>
                  <li key="paymentDate">
                    Payment date:&nbsp;
                    <input defaultValue={myInfo.corporateActions.distributions.newDividend.paymentDate?.toISOString()} placeholder="2021-12-31T06:00:00Z" disabled={!canManipulate}
                      onChange={onRequirementChangedDateCreator(["corporateActions", "distributions", "newDividend", "paymentDate"])} />
                  </li>
                  <li key="expiryDate">
                    Expiry date:&nbsp;
                    <input defaultValue={myInfo.corporateActions.distributions.newDividend.expiryDate?.toISOString()} placeholder="2021-12-31T06:00:00Z" disabled={!canManipulate}
                      onChange={onRequirementChangedDateCreator(["corporateActions", "distributions", "newDividend", "expiryDate"])} />
                  </li>
                </ul>

                <div className="submit">
                  <div className="submit">
                    <button className="submit create-dividend-distribution" onClick={createDividendDistribution} disabled={!canManipulate}>Create 1 now</button>
                  </div>
                </div>

              </div>
            })()
          }</div>

          <div>{presentDividendDistributions(myInfo.corporateActions.distributions.dividends, ["corporateActions", "distributions", "dividends"], true)}</div>

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
