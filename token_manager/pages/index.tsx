import Head from "next/head"
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
import { getBasicPolyWalletApi } from "../src/ui-helpers"
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

  function setStatus(content: string): void {
    const element = document.getElementById("status") as HTMLElement
    element.innerHTML = content
  }

  async function getPolyWalletApi(): Promise<Polymesh> {
    const [api, polyWallet]: [Polymesh, PolyWallet] = await getBasicPolyWalletApi(setStatus)
    const myIdentity: Identity = await api.getCurrentIdentity()
    setMyInfo((prev: MyInfoJson) => ({
      ...prev,
      polyWallet: polyWallet,
      myDid: myIdentity.did,
    }))
    return api
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
    setStatus("Loading dividend distributions")
    const actions: DistributionWithDetails[] = await token.corporateActions.distributions.get()
    await setDividendDistributions(actions)
    return actions
  }

  async function setDividendDistributions(actionsWithDetails: DistributionWithDetails[]): Promise<DividendDistributionInfoJson[]> {
    const actionInfos: DividendDistributionInfoJson[] = await fetchDividendDistributionInfosWithDetails(actionsWithDetails)
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
          polyWallet={myInfo.polyWallet}
          onAddInvestorUniquenessClaimParamsChanged={() => { }}
        />

        <PortfolioManagerView
          apiPromise={apiPromise}
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

    </div>
  )
}
