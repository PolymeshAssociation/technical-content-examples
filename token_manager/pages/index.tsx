import Head from "next/head"
import React, { useState } from "react"
import styles from "../styles/Home.module.css"
import {
  Requirement,
  SecurityToken,
  DistributionWithDetails,
} from "@polymathnetwork/polymesh-sdk/types"
import { Polymesh } from '@polymathnetwork/polymesh-sdk'
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
  MyInfoJson,
  MyInfoPath,
  PermissionsInfoJson,
  PortfolioInfoJson,
  ReservationInfoJson,
  TokenInfoJson,
} from "../src/types"
import {
  Checkpoint,
  CheckpointSchedule,
  CorporateAction,
  DividendDistribution,
  Identity,
} from "@polymathnetwork/polymesh-sdk/internal"
import { findValue, getBasicPolyWalletApi, returnUpdatedCreator } from "../src/ui-helpers"
import { CheckpointManagerView } from "../src/components/checkpoints/CheckpointManagerView"
import { PermissionManagerView } from "../src/components/permissions/PermissionManagerView"
import { ComplianceManagerView } from "../src/components/compliance/ComplianceView"
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
import { AuthorisationManagerView } from "../src/components/authorisations/AuthorisationManagerView"
import { IdentityView } from "../src/components/identity/IdentityView"
import { DividendDistributionManagerView } from "../src/components/distribution/DividendDistributionView"

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

  function setMyPortfolios(myDetails: PortfolioInfoJson[]) {
    setMyInfo((prev: MyInfoJson) => ({
      ...prev,
      portfolios: {
        ...prev.portfolios,
        myDetails: myDetails,
      }
    }))
  }

  function onPortfolioPicked(picked: PortfolioInfoJson | null) {
    setMyInfo((prev: MyInfoJson) => ({
      ...prev,
      portfolios: {
        ...prev.portfolios,
        picked: picked,
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

  function setCheckpointPicked(picked: CheckpointInfoJson | null) {
    setMyInfo((prev: MyInfoJson) => ({
      ...prev,
      checkpoints: {
        ...prev.checkpoints,
        picked: picked,
      }
    }))
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
    const agents: Identity[] = await token.corporateActions.getAgents()
    setMyInfo(returnUpdatedCreator(["corporateActions", "agents"], agents))
    await loadDividendDistributions(token)
  }

  function onDividendDistributionCreated(action: DividendDistribution) {
    setTimeout(async () => loadDividendDistributions(myInfo.token.current), 1)
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
      exists: await action.exists(),
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
          onPermissionsInfoJsonChanged={setPermissionsInfo}
        />

        <ComplianceManagerView
          token={myInfo.token}
          requirements={myInfo.requirements}
          cardStyle={styles.card}
          myDid={myInfo.myDid}
          apiPromise={apiPromise}
          onTokenInfoChanged={setTokenInfo}
          canManipulate={myInfo.requirements.canManipulate}
        />

        <AuthorisationManagerView
          myDid={myInfo.myDid}
          myAddress={myInfo.myAddress}
          canManipulate={true}
          cardStyle={styles.card}
          isWrongStyle={styles.isWrong}
          apiPromise={apiPromise}
        />

        <ClaimsManagerView
          cardStyle={styles.card}
          isWrongStyle={styles.isWrong}
          myDid={myInfo.myDid}
          canManipulate={true}
          apiPromise={apiPromise}
          onAddInvestorUniquenessClaimParamsChanged={() => { }}
        />

        <PortfolioManagerView
          apiPromise={apiPromise}
          myDid={myInfo.myDid}
          pickedPortfolio={myInfo.portfolios.picked}
          cardStyle={styles.card}
          isWrongStyle={styles.isWrong}
          onPortfolioPicked={onPortfolioPicked}
          onMyPortfolioInfosChanged={setMyPortfolios}
          canManipulate={true}
        />

        <CheckpointManagerView
          myDid={myInfo.myDid}
          token={myInfo.token}
          checkpoints={myInfo.checkpoints}
          cardStyle={styles.card}
          isWrongStyle={styles.isWrong}
          onCheckpointPicked={setCheckpointPicked}
          onCheckpointsChanged={setCheckpointsInfo}
          onCheckpointSchedulesChanged={setCheckpointSchedulesInfo}
        />

        <fieldset className={styles.card}>
          <legend>Corporate actions for: {myInfo.token.current?.ticker}</legend>

          <div>{
            (() => {
              const owner: string = myInfo.token.details?.owner?.did
              const caa: string = myInfo.corporateActions.agents?.did ?? ""
              if (myInfo.token.current === null) return "There is no token"
              else return <ul>
                <li key="caa">
                  With agent: <IdentityView value={caa} lut={{ [myInfo.myDid]: caa }} />
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

        <DividendDistributionManagerView
          distributions={myInfo.corporateActions.distributions.dividends}
          token={myInfo.token}
          myDid={myInfo.myDid}
          cardStyle={styles.card}
          isWrongStyle={styles.isWrong}
          pickedCheckpoint={myInfo.checkpoints.picked}
          pickedPortfolio={myInfo.portfolios.picked}
          onDividendDistributionCreated={onDividendDistributionCreated}
        />

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
