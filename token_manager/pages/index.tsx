import Head from "next/head"
import React, { useState } from "react"
import styles from "../styles/Home.module.css"
import {
  CheckpointWithData,
  Compliance,
  Requirement,
  SecurityToken,
  Claim,
  ResultSet,
  ClaimData,
  ClaimTarget,
  IdentityWithClaims,
  CddClaim,
  Authorization,
  AuthorizationType,
  Permissions,
  ScheduleWithDetails,
  DividendDistributionDetails,
  DistributionParticipant,
  DistributionWithDetails,
  AgentWithGroup,
  GroupPermissions,
} from "@polymathnetwork/polymesh-sdk/types"
import { Polymesh, BigNumber } from '@polymathnetwork/polymesh-sdk'
import {
  AgentsInfoJson,
  CheckpointInfoJson,
  CheckpointScheduleDetailsInfoJson,
  CheckpointScheduleInfoJson,
  CorporateActionInfoJson,
  CustomPermissionGroupInfoJson,
  DividendDistributionInfoJson,
  getEmptyMyInfo,
  getEmptyPermissionsInfoJson,
  getEmptyRequirements,
  getEmptyTokenInfoJson,
  isCheckpointSchedule,
  isCheckpointWithData,
  isCustomPermissionGroup,
  isKnownPermissionGroup,
  isNumberedPortfolio,
  KnownPermissionGroupInfoJson,
  MyInfoPath,
  PermissionGroupsInfo,
  PermissionGroupsInfoJson,
  PermissionsInfoJson,
  PortfolioInfoJson,
  ReservationInfoJson,
  SimpleAction,
  TokenInfoJson,
} from "../src/types"
import {
  AddInvestorUniquenessClaimParams,
  AuthorizationRequest,
  Checkpoint,
  CheckpointSchedule,
  CorporateAction,
  CreateCheckpointScheduleParams,
  CreateSecurityTokenParams,
  CustomPermissionGroup,
  DefaultPortfolio,
  DividendDistribution,
  Identity,
  InviteExternalAgentParams,
  KnownPermissionGroup,
  NumberedPortfolio,
  PolymeshError,
  RemoveExternalAgentParams,
  RenamePortfolioParams,
  SetAssetRequirementsParams,
  TickerReservation,
  TransferTickerOwnershipParams,
  TransferTokenOwnershipParams,
} from "@polymathnetwork/polymesh-sdk/internal"
import {
  findValue,
  getBasicPolyWalletApi,
  replaceFetchTimer,
  returnUpdatedCreator,
} from "../src/ui-helpers"
import { CheckpointView } from "../src/components/checkpoints/CheckpointView"
import { CheckpointScheduleView } from "../src/components/checkpoints/CheckpointScheduleView"
import { CheckpointManagerView } from "../src/components/checkpoints/CheckpointManagerView"
import { PermissionManagerView } from "../src/components/permissions/PermissionView"
import {
  AddInvestorUniquenessClaimView,
  ClaimView,
} from "../src/components/compliance/ClaimView"
import { ComplianceCheckParams, ComplianceManagerView, RequirementsSaver } from "../src/components/compliance/ComplianceView"
import { LongHexView } from "../src/components/LongHexView"
import { PortfoliosView, PortfolioView } from "../src/components/portfolios/PortfolioView"
import { PortfolioInfoJsonView } from "../src/components/portfolios/PortfolioInfoJsonView"
import { TickerManagerView } from "../src/components/token/TickerView"
import { TickerReservationManagerView } from "../src/components/token/ReservationView"
import { SecurityTokenManagerView } from "../src/components/token/SecurityTokenView"
import { PortfolioManagerView } from "../src/components/portfolios/PortfolioManagerView"
import { Requirements } from "@polymathnetwork/polymesh-sdk/api/entities/SecurityToken/Compliance/Requirements"

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

  async function onTickerChanged(ticker: string): Promise<void> {
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

  async function reserveTicker(ticker: string): Promise<TickerReservation> {
    const api: Polymesh = await getPolyWalletApi()
    setStatus(`Reserving ticker ${ticker}`)
    const reservation: TickerReservation = await (await api.reserveTicker({ ticker: ticker })).run()
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
    await loadToken(ticker)
    return reservation
  }

  async function setReservation(reservation: TickerReservation | null): Promise<void> {
    if (reservation === null) {
      setMyInfo(returnUpdatedCreator(["reservation"], {
        current: null,
        details: null,
      }))
    } else {
      setMyInfo(returnUpdatedCreator(["reservation"], {
        current: reservation,
        details: (await reservation.details()),
      }))
    }
  }

  async function transferReservationOwnership(reservation: ReservationInfoJson, params: TransferTickerOwnershipParams): Promise<TickerReservation> {
    setStatus("Changing ownership on token reservation")
    const updated: TickerReservation = await (await reservation.current.transferOwnership(params)).run()
    setStatus("Ownership on token reservation changed")
    await setReservation(updated)
    return updated
  }

  async function createSecurityToken(reservation: ReservationInfoJson, params: CreateSecurityTokenParams): Promise<SecurityToken> {
    setStatus("Creating token")
    const token: SecurityToken = await (await reservation.current.createToken(params)).run()
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
      setMyInfo(returnUpdatedCreator(["token"], getEmptyTokenInfoJson(), true))
      setPermissions(null, null)
      setComplianceRequirements(null, null, true)
    } else {
      setMyInfo(returnUpdatedCreator(["token"], {
        current: token,
        details: await token.details(),
        createdAt: await token.createdAt(),
        currentFundingRound: await token.currentFundingRound(),
        tokenIdentifiers: await token.getIdentifiers(),
      }, true))
      await loadPermissions(token)
    }
  }

  async function transferTokenOwnership(token: TokenInfoJson, params: TransferTokenOwnershipParams): Promise<void> {
    setStatus("Transferring token ownership")
    const updated: SecurityToken = await (await token.current.transferOwnership(params)).run()
    setStatus("Token ownership transferred")
    await setToken(updated)
    await loadYourTickers()
  }

  async function loadPermissions(token: SecurityToken): Promise<PermissionsInfoJson> {
    const groups = await loadPermissionGroups(token)
    const agents = await loadPermissionAgents(token)
    const permissions: PermissionsInfoJson = {
      current: token.permissions,
      groups: groups,
      agents: agents,
    }
    await setPermissions(token, permissions)
    await loadComplianceRequirements(token)
    return permissions
  }

  async function setPermissions(token: SecurityToken | null, permissions: PermissionsInfoJson | null) {
    if (token === null || permissions === null) {
      setMyInfo(returnUpdatedCreator(["permissions"], getEmptyPermissionsInfoJson()))
    } else {
      setMyInfo(returnUpdatedCreator(["permissions"], permissions))
    }
  }

  async function loadKnownPermissionGroup(group: KnownPermissionGroup): Promise<KnownPermissionGroupInfoJson> {
    return Promise.all([group.getPermissions(), group.exists()])
      .then((results: [GroupPermissions, boolean]) => ({
        current: group,
        permissions: results[0],
        exists: results[1]
      }))
  }

  async function loadCustomPermissionGroup(group: CustomPermissionGroup): Promise<CustomPermissionGroupInfoJson> {
    return Promise.all([group.getPermissions(), group.exists()])
      .then((results: [GroupPermissions, boolean]) => ({
        current: group,
        permissions: results[0],
        exists: results[1]
      }))
  }

  async function loadPermissionGroupInfo(group: KnownPermissionGroup | CustomPermissionGroup): Promise<KnownPermissionGroupInfoJson | CustomPermissionGroupInfoJson> {
    if (isKnownPermissionGroup(group)) return loadKnownPermissionGroup(group)
    if (isCustomPermissionGroup(group)) return loadCustomPermissionGroup(group)
    throw new Error("Permission group is neither custom nor known: " + group)
  }

  async function loadPermissionGroups(token: SecurityToken): Promise<PermissionGroupsInfoJson> {
    const groups: PermissionGroupsInfo = await token.permissions.getGroups()
    return {
      known: await Promise.all(groups.known.map(loadKnownPermissionGroup)),
      custom: await Promise.all(groups.custom.map(loadCustomPermissionGroup)),
    }
  }

  async function loadPermissionAgents(token: SecurityToken): Promise<AgentsInfoJson> {
    setStatus("Loading permission groups")
    const agentWithGroups: AgentWithGroup[] = await token.permissions.getAgents()
    return {
      current: await Promise.all(agentWithGroups.map(async (agentWithGroup: AgentWithGroup) => {
        const groupInfo = await loadPermissionGroupInfo(agentWithGroup.group)
        return {
          current: agentWithGroup.agent,
          group: groupInfo,
        }
      }))
    }
  }

  async function inviteAgent(params: InviteExternalAgentParams): Promise<void> {
    setStatus("Inviting agent")
    await (await myInfo.permissions.current.inviteAgent(params)).run()
    setStatus("Agent invited")
    await loadToken(myInfo.ticker)
  }

  async function removeAgent(params: RemoveExternalAgentParams): Promise<void> {
    setStatus("Removing agent")
    await (await myInfo.permissions.current.removeAgent(params)).run()
    setStatus("Agent removed")
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

  const saveRequirements = (requirements: Requirements): RequirementsSaver =>
    async (params: SetAssetRequirementsParams): Promise<void> => {
      const updatedToken: SecurityToken = await (await requirements.set(params)).run()
      setToken(updatedToken)
    }

  const pauseCompliance = (requirements: Requirements): SimpleAction =>
    async (): Promise<void> => {
      const updatedToken: SecurityToken = await (await requirements.pause()).run()
      setToken(updatedToken)
    }

  const resumeCompliance = (requirements: Requirements): SimpleAction =>
    async (): Promise<void> => {
      const updatedToken: SecurityToken = await (await requirements.unpause()).run()
      setToken(updatedToken)
    }

  const simulateCompliance = (requirements: Requirements) =>
    async (args: ComplianceCheckParams): Promise<Compliance> =>
      requirements.checkSettle(args)

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
        <ClaimView
          claim={claimData.claim}
          myInfo={myInfo}
          fetchCddId={fetchCddId}
          location={[...location, "claim"]}
          canManipulate={canManipulate}
        />
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
        <ClaimView
          claim={claimTarget.claim}
          myInfo={myInfo}
          fetchCddId={fetchCddId}
          location={[...location, "claim"]}
          canManipulate={canManipulate}
        />
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

  async function createPortfolio(params): Promise<NumberedPortfolio> {
    const api: Polymesh = await getPolyWalletApi()
    const me: Identity = await api.getCurrentIdentity()
    const newPortfolio = await (await me.portfolios.create(params)).run()
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

  async function loadPortfolios(whose: string): Promise<[DefaultPortfolio, ...NumberedPortfolio[]]> {
    const api: Polymesh = await getPolyWalletApi()
    const who: Identity = await api.getIdentity({ did: whose })
    setStatus(`Loading portfolios of ${whose}`)
    const portfolios: [DefaultPortfolio, ...NumberedPortfolio[]] = await who.portfolios.getPortfolios()
    setStatus(`Portfolios of ${whose} retrieved`)
    await setPortfolios(portfolios)
    return portfolios
  }

  async function loadCustodiedPortfolios(whose: string): Promise<(DefaultPortfolio | NumberedPortfolio)[]> {
    const api: Polymesh = await getPolyWalletApi()
    const who: Identity = await api.getIdentity({ did: whose })
    setStatus("Loading my custodied portfolios")
    const result: ResultSet<DefaultPortfolio | NumberedPortfolio> = await who.portfolios.getCustodiedPortfolios()
    setStatus("My custodied portfolios loaded")
    await setPortfolios(result.data)
    return result.data
  }

  async function getPortfolioInfo(portfolio: DefaultPortfolio | NumberedPortfolio): Promise<PortfolioInfoJson> {
    return {
      original: portfolio,
      name: isNumberedPortfolio(portfolio) ? await portfolio.getName() : "null",
      exists: await portfolio.exists(),
      custodian: (await portfolio.getCustodian()).did,
      createdAt: isNumberedPortfolio(portfolio) ? await portfolio.createdAt() : null,
    }
  }

  async function getPortfolioInfos(portfolios: (DefaultPortfolio | NumberedPortfolio)[]): Promise<PortfolioInfoJson[]> {
    return Promise.all(portfolios.map(getPortfolioInfo));
  }

  async function setPortfolios(portfolios: (DefaultPortfolio | NumberedPortfolio)[]): Promise<void> {
    const portfolioInfos: PortfolioInfoJson[] = await getPortfolioInfos(portfolios)
    setMyInfo(returnUpdatedCreator(["portfolios", "details"], portfolioInfos))
  }

  async function modifyNamePortfolio(portfolio: NumberedPortfolio, params: RenamePortfolioParams): Promise<NumberedPortfolio> {
    setStatus("Modifying name")
    const updated = await (await portfolio.modifyName(params)).run()
    setStatus("Name modified")
    return updated
  }

  async function setCustodian(portfolio: DefaultPortfolio | NumberedPortfolio, newCustodian: string): Promise<void> {
    setStatus("Setting custodian")
    await (await portfolio.setCustodian({ targetIdentity: newCustodian })).run()
    setStatus("Custodian set")
    await loadMyPortfolios()
  }

  async function quitCustody(portfolio: DefaultPortfolio | NumberedPortfolio): Promise<void> {
    setStatus("Relinquishing custody")
    await (await portfolio.quitCustody()).run()
    setStatus("Custody relinquished")
    await loadPortfolios(portfolio.owner.did)
  }

  async function loadCheckpoints(token: SecurityToken): Promise<CheckpointWithData[]> {
    // TODO handle pagination
    const checkpoints: CheckpointWithData[] = (await token.checkpoints.get()).data
    await setCheckpoints(checkpoints)
    await loadCheckpointSchedules(token)
    return checkpoints
  }

  async function setCheckpoints(current: CheckpointWithData[]): Promise<CheckpointInfoJson[]> {
    setMyInfo(returnUpdatedCreator(["checkpoints", "current"], current))
    const details: CheckpointInfoJson[] = await Promise.all(current
      .map((checkpointWith: CheckpointWithData) => getCheckpointInfo(checkpointWith)))
    setMyInfo(returnUpdatedCreator(["checkpoints", "details"], details))
    if (details.length > 0) setMyInfo(returnUpdatedCreator(["corporateActions", "distributions", "newDividend", "checkpoint"], details[0].checkpoint))
    return details
  }

  async function getCheckpointInfo(checkpointWith: CheckpointWithData | Checkpoint): Promise<CheckpointInfoJson> {
    const checkpoint: Checkpoint = isCheckpointWithData(checkpointWith) ? checkpointWith.checkpoint : checkpointWith
    const [totalSupply, createdAt]: [BigNumber, Date] = await Promise.all([
      checkpoint.totalSupply(),
      isCheckpointWithData(checkpointWith) ? checkpointWith.createdAt : checkpointWith.createdAt()
    ])
    return {
      checkpoint: checkpoint,
      totalSupply: totalSupply,
      createdAt: createdAt,
    }
  }

  async function createCheckpoint(): Promise<Checkpoint> {
    const checkpoint: Checkpoint = await (await myInfo.token.current.checkpoints.create()).run()
    await loadCheckpoints(myInfo.token.current)
    return checkpoint
  }

  async function loadBalanceAtCheckpoint(checkpoint: CheckpointInfoJson, whoseBalance: string): Promise<BigNumber> {
    const balance: BigNumber = (await checkpoint.checkpoint.balance({ identity: whoseBalance }))
    return balance
  }

  async function createScheduledCheckpoint(params: CreateCheckpointScheduleParams): Promise<CheckpointSchedule> {
    const schedule: CheckpointSchedule = await (await myInfo.token.current.checkpoints.schedules.create(params)).run()
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
            canManipulate={canManipulate}
            loadBalanceAtCheckpoint={loadBalanceAtCheckpoint}
          />
        </li>
        if (action.checkpointSchedule !== null) return <li key="checkpointSchedule">Checkpoint schedule:&nbsp;<CheckpointScheduleView
          scheduleInfo={action.checkpointSchedule}
          canManipulate={canManipulate}
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
      <li key="origin">
        Origin:&nbsp;
        <PortfolioInfoJsonView
          portfolio={action.origin}
          myDid={myInfo.myDid}
          modifyName={modifyNamePortfolio}
          setCustodian={setCustodian}
          quitCustody={quitCustody}
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
          myTickers={myInfo.myTickers}
          reservation={myInfo.reservation}
          token={myInfo.token}
          cardStyle={styles.card}
          loadMyTickers={async () => { await loadYourTickers() }}
          loadTicker={onTickerChanged}
          reserveTicker={async (ticker) => { await reserveTicker(ticker) }}
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
          transferReservationOwnership={transferReservationOwnership}
          createSecurityToken={createSecurityToken}
        />

        <SecurityTokenManagerView
          token={myInfo.token}
          myDid={myInfo.myDid}
          cardStyle={styles.card}
          hasTitleStyle={styles.hasTitle}
          isWrongStyle={styles.isWrong}
          transferTokenOwnership={transferTokenOwnership}
        />

        <PermissionManagerView
          myDid={myInfo.myDid}
          permissions={myInfo.permissions}
          token={myInfo.token}
          cardStyle={styles.card}
          hasTitleStyle={styles.hasTitle}
          isWrongStyle={styles.isWrong}
          removeAgent={removeAgent}
          inviteAgent={inviteAgent}
          canManipulate={true}
        />

        <ComplianceManagerView
          requirements={myInfo.requirements}
          cardStyle={styles.card}
          myInfo={myInfo}
          identityGetter={getIdentity}
          onComplianceChanged={() => { }}
          saveRequirements={saveRequirements(myInfo.token.current?.compliance?.requirements)}
          pauseCompliance={pauseCompliance(myInfo.token.current?.compliance?.requirements)}
          resumeCompliance={resumeCompliance(myInfo.token.current?.compliance?.requirements)}
          simulateCompliance={simulateCompliance(myInfo.token.current?.compliance?.requirements)}
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

            <div>
              <AddInvestorUniquenessClaimView
                claimParams={myInfo.attestations.uniquenessToAdd}
                fetchMyCddId={fetchMyCddId}
                location={["attestations", "uniquenessToAdd"]}
                isWrongStyle={styles.isWrong}
                canManipulate={true}
              />
            </div>

            <div className="submit">
              <button className="submit add-unique-attestation" onClick={() => addUniquenessAttestation(["attestations", "uniquenessToAdd"])}>Add uniqueness attestation</button>
            </div>
            <div>It takes some time for the added attestation<br />to show in the list above because the<br />middleware needs to be updated</div>
          </div>

        </fieldset>

        <PortfolioManagerView
          portfolios={myInfo.portfolios}
          myDid={myInfo.myDid}
          cardStyle={styles.card}
          createPortfolio={createPortfolio}
          deletePortfolio={deletePortfolio}
          loadPortfolios={async (whose: string) => { await loadPortfolios(whose) }}
          loadCustodiedPortfolios={async (whose: string) => { await loadCustodiedPortfolios(whose) }}
          modifyName={modifyNamePortfolio}
          quitCustody={quitCustody}
          setCustodian={setCustodian}
          isWrongStyle={styles.isWrong}
          canManipulate={true}
        />

        <CheckpointManagerView
          myInfo={myInfo}
          cardStyle={styles.card}
          createCheckpoint={createCheckpoint}
          createScheduledCheckpoint={createScheduledCheckpoint}
          loadBalanceAtCheckpoint={loadBalanceAtCheckpoint}
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
                .findIndex((checkpointWith: CheckpointWithData) => checkpointWith.checkpoint.id.toString(10) === (myInfo.corporateActions.distributions.newDividend.checkpoint as Checkpoint)?.id?.toString(10))
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
                            .map((checkpointWith: CheckpointWithData, index: number) => <option key={index} value={index}>
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
