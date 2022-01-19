import Head from "next/head"
import { NotificationContainer } from 'react-notifications';
import { useState } from "react"
import styles from "../styles/Home.module.css"
import { Requirement, SecurityToken, DistributionWithDetails } from "@polymathnetwork/polymesh-sdk/types"
import { Polymesh } from '@polymathnetwork/polymesh-sdk'
import {
  CheckpointInfoJson,
  CheckpointScheduleDetailsInfoJson,
  CheckpointsInfoJson,
  DividendDistributionInfoJson,
  getEmptyMyInfo,
  getEmptyRequirements,
  MyInfoJson,
  PermissionsInfoJson,
  PolyWallet,
  PortfolioInfoJson,
  ReservationInfoJson,
  TokenInfoJson,
} from "../src/types"
import { DividendDistribution, Identity } from "@polymathnetwork/polymesh-sdk/internal"
import { getBasicPolyWalletApi, showFetchCycle, ShowFetchCycler, showInfo } from "../src/ui-helpers"
import { CheckpointManagerView } from "../src/components/checkpoints/CheckpointManagerView"
import { PermissionManagerView } from "../src/components/permissions/PermissionManagerView"
import { ComplianceManagerView } from "../src/components/compliance/ComplianceView"
import { TickerManagerView } from "../src/components/token/TickerView"
import { TickerReservationManagerView } from "../src/components/token/ReservationView"
import { SecurityTokenManagerView } from "../src/components/token/SecurityTokenView"
import { PortfolioManagerView } from "../src/components/portfolios/PortfolioManagerView"
import { fetchCheckpointsInfo } from "../src/handlers/checkpoints/CheckpointHandlers"
import { ClaimsManagerView } from "../src/components/claims/ClaimsManagerView"
import { AuthorisationManagerView } from "../src/components/authorisations/AuthorisationManagerView"
import { DividendDistributionManagerView } from "../src/components/distribution/DividendDistributionView"
import { fetchDividendDistributionInfosWithDetails } from "../src/handlers/distribution/DividendDistributionHandlers"

export default function Home() {
  const [myInfo, setMyInfo] = useState(getEmptyMyInfo())

  async function getPolyWalletApi(): Promise<Polymesh> {
    const [api, polyWallet]: [Polymesh, PolyWallet] = await getBasicPolyWalletApi()
    const cycler: ShowFetchCycler = showFetchCycle("Your identity")
    const myIdentity: Identity = await api.getCurrentIdentity()
    cycler.fetched()
    setMyInfo((prev: MyInfoJson) => ({
      ...prev,
      api: api,
      polyWallet: polyWallet,
      myDid: myIdentity.did,
    }))
    return api
  }

  function setTicker(newTicker: string): void {
    showInfo(`Ticker set to ${newTicker}`)
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
        loadDividendDistributions(token.current),
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
    if (token === null) {
      setComplianceRequirements(null, null, false)
      return null
    }
    const cycler: ShowFetchCycler = showFetchCycle("Compliance requirements")
    const requirements: Requirement[] = await token.compliance.requirements.get()
    const arePaused: boolean = await token.compliance.requirements.arePaused()
    cycler.fetched()
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

  function onPortfolioPicked(picked: PortfolioInfoJson | null) {
    setMyInfo((prev: MyInfoJson) => ({
      ...prev,
      portfolios: {
        ...prev.portfolios,
        picked: picked,
      },
    }))
  }

  async function loadCheckpointsInfo(token: TokenInfoJson): Promise<CheckpointsInfoJson> {
    const cycler: ShowFetchCycler = showFetchCycle("Checkpoints")
    const checkpoints: CheckpointsInfoJson = await fetchCheckpointsInfo(token)
    cycler.fetched()
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
      },
    }))
  }

  function setCheckpointsInfo(infos: CheckpointInfoJson[]) {
    setMyInfo((prev: MyInfoJson) => ({
      ...prev,
      checkpoints: {
        ...prev.checkpoints,
        current: infos.map((info: CheckpointInfoJson) => info.checkpoint),
        details: infos,
      },
    }))
  }

  function setCheckpointSchedulesInfo(infos: CheckpointScheduleDetailsInfoJson[]) {
    setMyInfo((prev: MyInfoJson) => ({
      ...prev,
      checkpoints: {
        ...prev.checkpoints,
        currentSchedules: infos.map((info: CheckpointScheduleDetailsInfoJson) => info.schedule),
        scheduleDetails: infos,
      },
    }))
  }

  function onDividendDistributionCreated(_: DividendDistribution) {
    setTimeout(async () => loadDividendDistributions(myInfo.token.current), 1)
  }

  async function loadDividendDistributions(token: SecurityToken): Promise<DistributionWithDetails[]> {
    const cycler: ShowFetchCycler = showFetchCycle("Dividend distributions")
    const actions: DistributionWithDetails[] = await token.corporateActions.distributions.get()
    cycler.fetched()
    await setDividendDistributions(actions)
    return actions
  }

  async function setDividendDistributions(actionsWithDetails: DistributionWithDetails[]): Promise<DividendDistributionInfoJson[]> {
    const cycler: ShowFetchCycler = showFetchCycle("Dividend distribution details")
    const actionInfos: DividendDistributionInfoJson[] = await fetchDividendDistributionInfosWithDetails(actionsWithDetails)
    cycler.fetched()
    setMyInfo((prev: MyInfoJson) => ({
      ...prev,
      corporateActions: {
        ...prev.corporateActions,
        distributions: {
          ...prev.corporateActions.distributions,
          dividends: actionInfos,
        },
      },
    }))
    return actionInfos
  }

  const apiGetter = async () => myInfo.api ?? await getPolyWalletApi()

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
          apiGetter={apiGetter}
          onTickerChanged={setTicker}
          onReservationInfoChanged={setReservationInfo}
          onTokenInfoChanged={setTokenInfo}
        />

        <div id="status" className={styles.status}>
          Latest status will show here
        </div>

        <TickerReservationManagerView
          reservation={myInfo.reservation}
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
          apiGetter={apiGetter}
          onTokenInfoChanged={setTokenInfo}
          canManipulate={myInfo.requirements.canManipulate}
        />

        <AuthorisationManagerView
          myDid={myInfo.myDid}
          myAddress={myInfo.myAddress}
          canManipulate={true}
          cardStyle={styles.card}
          isWrongStyle={styles.isWrong}
          apiGetter={apiGetter}
        />

        <ClaimsManagerView
          cardStyle={styles.card}
          isWrongStyle={styles.isWrong}
          myDid={myInfo.myDid}
          canManipulate={true}
          apiGetter={apiGetter}
          polyWallet={myInfo.polyWallet}
          onAddInvestorUniquenessClaimParamsChanged={() => { }}
        />

        <PortfolioManagerView
          apiGetter={apiGetter}
          myDid={myInfo.myDid}
          pickedPortfolio={myInfo.portfolios.picked}
          cardStyle={styles.card}
          isWrongStyle={styles.isWrong}
          onPortfolioPicked={onPortfolioPicked}
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

        <DividendDistributionManagerView
          distributions={myInfo.corporateActions.distributions.dividends}
          token={myInfo.token}
          myDid={myInfo.myDid}
          cardStyle={styles.card}
          isWrongStyle={styles.isWrong}
          pickedCheckpoint={myInfo.checkpoints.picked}
          pickedPortfolio={myInfo.portfolios.picked}
          onCheckpointPicked={setCheckpointPicked}
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

      <NotificationContainer />

    </div>
  )
}
