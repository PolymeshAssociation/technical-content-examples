import Head from "next/head"
import React, { useState } from "react"
import styles from "../styles/Home.module.css"
import {
  Requirement,
  SecurityToken,
  Claim,
  ClaimData,
  CddClaim,
  Authorization,
  AuthorizationType,
  Permissions,
  DividendDistributionDetails,
  DistributionParticipant,
  DistributionWithDetails,
} from "@polymathnetwork/polymesh-sdk/types"
import { Polymesh, BigNumber } from '@polymathnetwork/polymesh-sdk'
import {
  AgentsInfoJson,
  CheckpointInfoJson,
  CheckpointScheduleDetailsInfoJson,
  CheckpointsInfoJson,
  CorporateActionInfoJson,
  DividendDistributionInfoJson,
  getEmptyMyInfo,
  getEmptyRequirements,
  isCheckpointSchedule,
  isNumberedPortfolio,
  MyInfoJson,
  MyInfoPath,
  PermissionsInfoJson,
  PortfolioInfoJson,
  ReservationInfoJson,
  TokenInfoJson,
} from "../src/types"
import {
  AddInvestorUniquenessClaimParams,
  AuthorizationRequest,
  Checkpoint,
  CheckpointSchedule,
  CorporateAction,
  DividendDistribution,
  Identity,
} from "@polymathnetwork/polymesh-sdk/internal"
import { findValue, getBasicPolyWalletApi, returnUpdatedCreator } from "../src/ui-helpers"
import { CheckpointView } from "../src/components/checkpoints/CheckpointView"
import { CheckpointScheduleView } from "../src/components/checkpoints/CheckpointScheduleView"
import { CheckpointManagerView } from "../src/components/checkpoints/CheckpointManagerView"
import { PermissionManagerView } from "../src/components/permissions/PermissionView"
import { ComplianceManagerView } from "../src/components/compliance/ComplianceView"
import { LongHexView } from "../src/components/LongHexView"
import { PortfoliosView, PortfolioView } from "../src/components/portfolios/PortfolioView"
import { PortfolioInfoJsonView } from "../src/components/portfolios/PortfolioInfoJsonView"
import { TickerManagerView } from "../src/components/token/TickerView"
import { TickerReservationManagerView } from "../src/components/token/ReservationView"
import { SecurityTokenManagerView } from "../src/components/token/SecurityTokenView"
import { PortfolioManagerView } from "../src/components/portfolios/PortfolioManagerView"
import { fetchPortfolioInfoJson } from "../src/handlers/portfolios/PortfolioHandlers"
import {
  fetchCheckpointInfoJson,
  fetchCheckpointScheduleInfoJson,
  fetchCheckpointsInfo,
} from "../src/handlers/checkpoints/CheckpointHandlers"
import { ClaimsManagerView } from "../src/components/claims/ClaimsManagerView"

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

  async function getIdentity(did: string): Promise<Identity> {
    return await (await getPolyWalletApi()).getIdentity({ did: did })
  }

  async function getMyDid(): Promise<string> {
    return (await getMyIdentity()).did
  }

  function onValueChangedCreator(path: MyInfoPath, deep: boolean = false, valueProcessor?: (e) => Promise<any>) {
    return async function (e): Promise<void> {
      const value = valueProcessor ? await valueProcessor(e) : e.target.value
      setMyInfo(returnUpdatedCreator(path, value, deep))
    }
  }

  function setTicker(newTicker: string): void {
    setMyInfo((prev: MyInfoJson) => ({
      ...prev,
      ticker: newTicker,
    }))
  }

  function setReservationInfo(reservation: ReservationInfoJson): void {
    setMyInfo((prev: MyInfoJson) => ({
      ...prev,
      reservation: reservation,
    }))
  }

  function setTokenInfo(token: TokenInfoJson): void {
    setMyInfo((prev: MyInfoJson) => ({
      ...prev,
      token: token,
    }))
    setTimeout(
      async () => Promise.all([
        loadComplianceRequirements(token.current),
        loadCheckpointsInfo(token),
      ]),
      500)
  }

  async function setPermissionsInfo(permissions: PermissionsInfoJson) {
    setMyInfo((prevInfo: MyInfoJson) => ({
      ...prevInfo,
      permissions: permissions,
    }))
  }

  async function loadComplianceRequirements(token: SecurityToken | null): Promise<Requirement[] | null> {
    setStatus("Loading compliance requirements")
    if (token === null) {
      setComplianceRequirements(null, null, false)
      return null
    }
    const requirements: Requirement[] = await token.compliance.requirements.get()
    const arePaused: boolean = await token.compliance.requirements.arePaused()
    setComplianceRequirements(token, requirements, arePaused)
    return requirements
  }

  function setComplianceRequirements(token: SecurityToken | null, requirements: Requirement[] | null, arePaused: boolean) {
    if (token === null || requirements === null) {
      setMyInfo((prevInfo: MyInfoJson) => ({
        ...prevInfo,
        requirements: getEmptyRequirements(),
      }))
    } else {
      setMyInfo((prevInfo: MyInfoJson) => ({
        ...prevInfo,
        requirements: {
          original: token.compliance.requirements,
          current: requirements,
          arePaused,
          canManipulate: prevInfo.token?.details?.owner?.did == prevInfo.myDid,
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
      <li key="portfolios">
        Portfolios:&nbsp;<PortfoliosView portfolios={permissions.portfolios.values} myDid={myInfo.myDid} />
      </li>
      <li key="tokens">Tokens:&nbsp;{
        permissions.tokens === null ? "null" : permissions.tokens
          .map((token: SecurityToken) => token.ticker)
          .join(", ")
      }</li>
      <li key="transactionGroups">Transaction groups:&nbsp;{permissions.transactionGroups === null ? "null" : permissions.transactionGroups.join(", ")}</li>
      <li key="transactions">Transactions:&nbsp;{permissions.transactions === null ? "null" : permissions.transactions.join(", ")}</li>
    </ul>
  }

  function presentAuthorisation(authorisation: Authorization, location: MyInfoPath): JSX.Element {
    const elements: JSX.Element[] = [<li key="type">Type:&nbsp; {authorisation.type}</li>]
    if (authorisation.type === AuthorizationType.NoData) { // Add nothing
    } else if (authorisation.type === AuthorizationType.PortfolioCustody) {
      elements.push(<li key="value">Value:&nbsp;<PortfolioView portfolio={authorisation.value} myDid={myInfo.myDid} /></li>)
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
      <li key="issuer">
        Issuer:&nbsp;<LongHexView value={authorisationRequest.issuer.did} lut={{ [myInfo.myDid]: "me" }} />
      </li>
      <li key="target">
        Target:&nbsp;<LongHexView value={target} lut={{ [myInfo.myDid]: "me", [myInfo.myAddress]: "me" }} />
      </li>
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

  function setMyPortfolios(myDetails: PortfolioInfoJson[]) {
    setMyInfo((prev: MyInfoJson) => ({
      ...prev,
      portfolios: {
        myDetails: myDetails,
      }
    }))
  }

  async function loadCheckpointsInfo(token: TokenInfoJson): Promise<CheckpointsInfoJson> {
    const checkpoints: CheckpointsInfoJson = await fetchCheckpointsInfo(token)
    setMyInfo((prev: MyInfoJson) => ({
      ...prev,
      checkpoints: checkpoints,
    }))
    return checkpoints
  }

  function setCheckpointsInfo(infos: CheckpointInfoJson[]) {
    setMyInfo((prev: MyInfoJson) => ({
      ...prev,
      checkpoints: {
        ...prev.checkpoints,
        current: infos.map((info: CheckpointInfoJson) => info.checkpoint),
        details: infos,
      }
    }))
  }

  function setCheckpointSchedulesInfo(infos: CheckpointScheduleDetailsInfoJson[]) {
    setMyInfo((prev: MyInfoJson) => ({
      ...prev,
      checkpoints: {
        ...prev.checkpoints,
        currentSchedules: infos.map((info: CheckpointScheduleDetailsInfoJson) => info.schedule),
        scheduleDetails: infos,
      }
    }))
  }

  function onRequirementChangedDateCreator(path: MyInfoPath): (e) => Promise<void> {
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
      origin: await fetchPortfolioInfoJson(action.origin),
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
      checkpoint: checkpoint === null ? null : isSchedule ? null : await fetchCheckpointInfoJson(checkpoint as Checkpoint),
      checkpointSchedule: checkpoint === null ? null : isSchedule ? await fetchCheckpointScheduleInfoJson(checkpoint as CheckpointSchedule) : null,
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
            canManipulate={canManipulate}
          />
        </li>
        if (action.checkpointSchedule !== null) return <li key="checkpointSchedule">Checkpoint schedule:&nbsp;<CheckpointScheduleView
          scheduleInfo={action.checkpointSchedule}
          canManipulate={canManipulate}
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
      <li key="origin">
        Origin:&nbsp;
        <PortfolioInfoJsonView
          portfolio={action.origin}
          myDid={myInfo.myDid}
          isWrongStyle={styles.isWrong}
          onPortfolioInfoChanged={() => { }}
          canManipulate={canManipulate}
        />
      </li>,
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

  const apiPromise: Promise<Polymesh> = getPolyWalletApi()

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

        <TickerManagerView
          reservation={myInfo.reservation}
          token={myInfo.token}
          cardStyle={styles.card}
          apiPromise={apiPromise}
          onTickerChanged={setTicker}
          onReservationInfoChanged={setReservationInfo}
          onTokenInfoChanged={setTokenInfo}
        />

        <div id="status" className={styles.status}>
          Latest status will show here
        </div>

        <TickerReservationManagerView
          reservation={myInfo.reservation}
          token={myInfo.token}
          myDid={myInfo.myDid}
          cardStyle={styles.card}
          hasTitleStyle={styles.hasTitle}
          isWrongStyle={styles.isWrong}
          onReservationInfoChanged={setReservationInfo}
          onTokenInfoChanged={setTokenInfo}
        />

        <SecurityTokenManagerView
          token={myInfo.token}
          myDid={myInfo.myDid}
          cardStyle={styles.card}
          hasTitleStyle={styles.hasTitle}
          isWrongStyle={styles.isWrong}
          onTokenInfoChanged={setTokenInfo}
        />

        <PermissionManagerView
          myDid={myInfo.myDid}
          token={myInfo.token}
          cardStyle={styles.card}
          hasTitleStyle={styles.hasTitle}
          isWrongStyle={styles.isWrong}
          onAgentChanged={() => { }}
          onPermissionsChanged={setPermissionsInfo}
        />

        <ComplianceManagerView
          token={myInfo.token}
          requirements={myInfo.requirements}
          cardStyle={styles.card}
          myDid={myInfo.myDid}
          myInfo={myInfo}
          apiPromise={apiPromise}
          identityGetter={getIdentity}
          onTokenInfoChanged={setTokenInfo}
          fetchCddId={fetchCddId}
          getMyDid={getMyDid}
          location={["requirements"]}
          canManipulate={myInfo.requirements.canManipulate}
        />

        <fieldset className={styles.card}>
          <legend>My authorisation requests</legend>

          <div className="submit">
            <button className="submit load-authorisations" onClick={loadAuthorisations}>Load authorisations</button>
          </div>

          <div>{presentAuthorisationRequests(myInfo.authorisations.current, ["authorisations", "current"])}</div>

        </fieldset>

        <ClaimsManagerView
          cardStyle={styles.card}
          isWrongStyle={styles.isWrong}
          myInfo={myInfo}
          location={["attestations"]}
          canManipulate={true}
          apiPromise={apiPromise}
          onClaimDataChanged={() => { }}
          fetchCddId={fetchCddId}
          fetchMyCddId={fetchMyCddId}
          addUniquenessAttestation={addUniquenessAttestation}
        />

        <PortfolioManagerView
          apiPromise={apiPromise}
          myDid={myInfo.myDid}
          cardStyle={styles.card}
          isWrongStyle={styles.isWrong}
          onMyPortfolioInfosChanged={setMyPortfolios}
          canManipulate={true}
        />

        <CheckpointManagerView
          myInfo={myInfo}
          token={myInfo.token}
          checkpoints={myInfo.checkpoints}
          cardStyle={styles.card}
          isWrongStyle={styles.isWrong}
          onCheckpointsChanged={setCheckpointsInfo}
          onCheckpointSchedulesChanged={setCheckpointSchedulesInfo}
        />

        <fieldset className={styles.card}>
          <legend>Corporate actions for: {myInfo.token.current?.ticker}</legend>

          <div>{
            (() => {
              const owner: string = myInfo.token.details?.owner?.did
              const caa: string = myInfo.corporateActions.agent?.did
              if (myInfo.token.current === null) return "There is no token"
              else return <ul>
                <li key="caa">
                  With agent: <LongHexView value={caa} lut={{ [myInfo.myDid]: caa }} />
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
                .findIndex((checkpoint: Checkpoint) => checkpoint.id.toString(10) === (myInfo.corporateActions.distributions.newDividend.checkpoint as Checkpoint)?.id?.toString(10))
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
                          ...myInfo.checkpoints.details
                            .map((checkpoint: CheckpointInfoJson, index: number) => <option key={index} value={index}>
                              {checkpoint.checkpoint.id.toString(10)}&nbsp;-&nbsp;{checkpoint.createdAt.toISOString()}
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
                      onChange={onValueChangedCreator(["corporateActions", "distributions", "newDividend", "originPortfolio"], false, (e) => Promise.resolve(myInfo.portfolios.myDetails[e.target.value].original))}>{
                        myInfo.portfolios.myDetails
                          .map((portfolio: PortfolioInfoJson, index: number) => <option key={index} value={index}>
                            {isNumberedPortfolio(portfolio.original) ? portfolio.original.id.toString(10) : "Default"}
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
