import { BigNumber } from "@polymathnetwork/polymesh-sdk";
import {
    CreateSecurityTokenParams,
    TransactionQueue,
    TransferTickerOwnershipParams,
} from "@polymathnetwork/polymesh-sdk/internal";
import {
    KnownTokenType,
    SecurityToken,
    TickerReservation,
    TickerReservationStatus,
    TokenIdentifier,
} from "@polymathnetwork/polymesh-sdk/types";
import { ChangeEvent, Component } from "react";
import { fetchReservationInfoJson, OnReservationInfoChanged } from "../../handlers/token/ReservationHandlers";
import { fetchTokenInfoJson, OnTokenInfoChanged } from "../../handlers/token/TokenHandlers";
import { ReservationInfoJson, TokenInfoJson } from "../../types";
import { showFetchCycle, ShowFetchCycler, showRequestCycle, ShowRequestCycler } from "../../ui-helpers";
import { DateTimeEntryView } from "../elements/DateTimeEntry";
import { EnumSelectView } from "../EnumView";
import { IdentityView } from "../identity/IdentityView";
import { CollapsibleFieldsetView } from "../presentation/CollapsibleFieldsetView";
import { TokenIdentifiersView } from "./TokenIdentifierView";

export interface TickerReservationViewProps {
    reservation: ReservationInfoJson
    myDid: string
}

export class TickerReservationView extends Component<TickerReservationViewProps> {
    render() {
        const {
            reservation,
            myDid,
        } = this.props
        if (reservation.current === null) return "There is no reservation"
        else return <ul>
            <li key="owner">
                Owned by:&nbsp;
                <IdentityView
                    value={reservation.details?.owner ?? ""}
                    lut={{ [myDid]: "me" }} />
            </li>
            <li key="status">With status: {reservation.details?.status}</li>
            <li key="expiry">Valid until: {reservation.details?.expiryDate?.toISOString()}</li>
        </ul>
    }
}

interface TickerReservationTransferViewState {
    transferTarget: string
    transferExpiry: Date | null
}

export interface TickerReservationTransferViewProps {
    reservation: ReservationInfoJson
    myDid: string
    cardStyle: any
    hasTitleStyle: any
    isWrongStyle: any
    onReservationInfoChanged: OnReservationInfoChanged
}

export class TickerReservationTransferView extends Component<TickerReservationTransferViewProps, TickerReservationTransferViewState> {
    constructor(props: TickerReservationTransferViewProps) {
        super(props)
        this.state = {
            transferTarget: "",
            transferExpiry: null,
        }
    }

    onTargetChanged = (e: ChangeEvent<HTMLInputElement>) => this.setState({ transferTarget: e.target.value })
    onTransferExpiryChanged = (expiry: Date) => this.setState({ transferExpiry: expiry })
    getTransferParams = () => ({
        target: this.state.transferTarget,
        expiry: this.state.transferExpiry,
    }) as TransferTickerOwnershipParams
    onTransferReservationOwnership = async () => {
        const cyclerReq: ShowRequestCycler = showRequestCycle("Ticker ownership transfer")
        const queue: TransactionQueue<TickerReservation, TickerReservation> = await this.props.reservation.current.transferOwnership(this.getTransferParams())
        cyclerReq.running()
        const updated: TickerReservation = await queue.run()
        cyclerReq.hasRun()
        const cycler: ShowFetchCycler = showFetchCycle("Updated ticker reservation")
        const reservation: ReservationInfoJson = await fetchReservationInfoJson(updated)
        cycler.fetched()
        this.props.onReservationInfoChanged(reservation)
    }

    render() {
        const { transferTarget: target, transferExpiry } = this.state
        const { reservation, myDid, cardStyle, hasTitleStyle, isWrongStyle } = this.props
        const canCreate: boolean = reservation.current !== null
            && reservation.details?.status === TickerReservationStatus.Reserved
            && reservation.details?.owner?.did === myDid
        return <CollapsibleFieldsetView
            className={cardStyle}
            collapsed={true}
            legend="Ownership transfer">
            <div>
                <label htmlFor="transfer-target">
                    <span className={hasTitleStyle} title="Target identity of the ownership transfer">Target</span>
                </label>
                <input
                    name="transfer-target"
                    type="text"
                    placeholder="0x123"
                    defaultValue={target}
                    disabled={!canCreate}
                    onChange={this.onTargetChanged}
                />
            </div>
            <div>
                <label htmlFor="transfer-expiry">
                    <span
                        className={hasTitleStyle}
                        title="Expiry of the ownership transfer">
                        Expiry
                    </span>
                </label>
                <DateTimeEntryView
                    dateTime={transferExpiry}
                    isOptional={true}
                    onValidDateChanged={this.onTransferExpiryChanged}
                    isWrongStyle={isWrongStyle}
                    canManipulate={canCreate}
                />

            </div>
            <div className="submit">
                <button
                    className="submit transfer-reservation"
                    onClick={this.onTransferReservationOwnership}
                    disabled={!canCreate}>
                    Transfer ownership
                </button>
            </div>
        </CollapsibleFieldsetView>
    }
}

interface TokenCreatorViewState {
    canCreate: boolean
    longName: string
    isDivisible: boolean
    assetType: KnownTokenType | string
    fundingRound: string
    requiresUniqueness: boolean
    tokenIdentifiers: TokenIdentifier[]
}

export interface TokenCreatorViewProps {
    reservation: ReservationInfoJson
    myDid: string
    cardStyle: any
    hasTitleStyle: any
    onSecurityTokenChanged: OnTokenInfoChanged
}

export class TokenCreatorView extends Component<TokenCreatorViewProps, TokenCreatorViewState> {
    constructor(props: TokenCreatorViewProps) {
        super(props)
        const canCreate: boolean = props.reservation.current !== null
            && props.reservation.details?.status === TickerReservationStatus.Reserved
            && props.reservation.details?.owner?.did === props.myDid
        this.state = {
            canCreate: canCreate,
            longName: "",
            isDivisible: false,
            assetType: KnownTokenType.EquityCommon,
            fundingRound: "",
            requiresUniqueness: false,
            tokenIdentifiers: [],
        }
    }

    onLongNameChanged = (e: ChangeEvent<HTMLInputElement>) => this.setState({ longName: e.target.value })
    onIsDivisibleChanged = (e: ChangeEvent<HTMLInputElement>) => this.setState({ isDivisible: e.target.checked })
    onAssetTypeFromInputChanged = (e: ChangeEvent<HTMLInputElement>) => this.setState({ assetType: e.target.value })
    onAssetTypeFromDropDownChanged = async (e: ChangeEvent<HTMLSelectElement>) => this.setState({ assetType: e.target.value })
    onFundingRoundChanged = (e: ChangeEvent<HTMLInputElement>) => this.setState({ fundingRound: e.target.value })
    onUniquenessChanged = (e: ChangeEvent<HTMLInputElement>) => this.setState({ requiresUniqueness: e.target.checked })
    onTokenIdentifiersChanged = (identifiers: TokenIdentifier[]) => this.setState({ tokenIdentifiers: identifiers })
    onCreateToken = async () => {
        const cyclerReq: ShowRequestCycler = showRequestCycle("Creating token")
        const queue: TransactionQueue<SecurityToken, SecurityToken> = await this.props.reservation.current.createToken(this.getTokenParams())
        cyclerReq.running()
        const securityToken: SecurityToken = await (queue).run()
        cyclerReq.hasRun()
        const cycler: ShowFetchCycler = showFetchCycle("Token info")
        const tokenInfo: TokenInfoJson = await fetchTokenInfoJson(securityToken)
        cycler.fetched()
        this.props.onSecurityTokenChanged(tokenInfo)
    }
    getTokenParams = () => ({
        name: this.state.longName,
        totalSupply: new BigNumber("0"),
        isDivisible: this.state.isDivisible,
        tokenType: this.state.assetType,
        fundingRound: this.state.fundingRound,
        requireInvestorUniqueness: this.state.requiresUniqueness,
        tokenIdentifiers: this.state.tokenIdentifiers,
    }) as CreateSecurityTokenParams

    render() {
        const { longName, isDivisible, assetType, fundingRound, requiresUniqueness, tokenIdentifiers } = this.state
        const { reservation, myDid, cardStyle, hasTitleStyle } = this.props
        const canCreate: boolean = reservation.current !== null
            && reservation.details?.status === TickerReservationStatus.Reserved
            && reservation.details?.owner?.did === myDid
        return <CollapsibleFieldsetView
            className={cardStyle}
            legend="Token creation"
            collapsed={false}>
            <div>
                <label htmlFor="token-name">
                    <span className={hasTitleStyle} title="Long name of your security token">Name</span>
                </label>
                <input
                    name="token-name"
                    type="text"
                    placeholder="American CME"
                    defaultValue={longName}
                    disabled={!canCreate}
                    onChange={this.onLongNameChanged}
                />
            </div>
            <div>
                <label htmlFor="token-divisible">
                    <span className={hasTitleStyle} title="Whether it can be sub-divided">Divisible</span>
                </label>
                <input
                    name="token-divisible"
                    type="checkbox"
                    defaultChecked={isDivisible}
                    disabled={!canCreate}
                    onChange={this.onIsDivisibleChanged}
                />
            </div>
            <div>
                <label htmlFor="token-assetType">
                    <span className={hasTitleStyle} title="Pick one from the list or type what you want">Asset Type</span>
                </label>
                <input
                    name="token-assetType"
                    type="text"
                    placeholder={KnownTokenType.EquityCommon}
                    defaultValue={assetType}
                    disabled={!canCreate}
                    onChange={this.onAssetTypeFromInputChanged}
                />
                &nbsp;
                <EnumSelectView<KnownTokenType>
                    theEnum={KnownTokenType}
                    defaultValue={KnownTokenType[assetType]}
                    onChange={this.onAssetTypeFromDropDownChanged}
                    canManipulate={canCreate}
                />
            </div>
            <div>
                <label htmlFor="token-fundingRound">
                    <span className={hasTitleStyle} title="Funding round in which the token currently is (Series A, Series B, etc)">Funding round</span>
                </label>
                <input
                    name="token-fundingRound"
                    type="text"
                    placeholder="Series A"
                    defaultValue={fundingRound}
                    disabled={!canCreate}
                    onChange={this.onFundingRoundChanged}
                />
            </div>
            <div>
                <label htmlFor="token-requiresUniqueness">
                    <span className={hasTitleStyle} title="Whether it requires investor uniqueness">Requires uniqueness</span>
                </label>
                <input
                    name="token-requiresUniqueness"
                    type="checkbox"
                    defaultChecked={requiresUniqueness}
                    disabled={!canCreate}
                    onChange={this.onUniquenessChanged}
                />
            </div>
            <div>
                <label htmlFor="token-tokenIdentifiers">
                    <span className={hasTitleStyle} title="Domestic or international alphanumeric security identifiers for the token (ISIN, CUSIP, etc)">Token identifiers</span>
                </label>
                <TokenIdentifiersView
                    identifiers={tokenIdentifiers}
                    hasTitleStyle={hasTitleStyle}
                    canManipulate={canCreate}
                    onChange={this.onTokenIdentifiersChanged}
                />
            </div>
            <div className="submit">
                <button
                    className="submit create-token"
                    onClick={this.onCreateToken}
                    disabled={!canCreate}>
                    Create token
                </button>
            </div>
        </CollapsibleFieldsetView>
    }
}

export interface TickerReservationManagerProps {
    reservation: ReservationInfoJson
    myDid: string
    cardStyle: any
    hasTitleStyle: any
    isWrongStyle: any
    onReservationInfoChanged: OnReservationInfoChanged
    onTokenInfoChanged: OnTokenInfoChanged
}

export class TickerReservationManagerView extends Component<TickerReservationManagerProps> {
    render() {
        const {
            reservation,
            myDid,
            cardStyle,
            hasTitleStyle,
            isWrongStyle,
            onReservationInfoChanged,
            onTokenInfoChanged: onSecurityTokenChanged
        } = this.props
        return <CollapsibleFieldsetView
            className={cardStyle}
            legend={`Ticker Reservation: ${reservation.current?.ticker}`}
            collapsed={false}>

            <TickerReservationView
                reservation={reservation}
                myDid={myDid}
            />

            <TickerReservationTransferView
                reservation={reservation}
                myDid={myDid}
                cardStyle={cardStyle}
                hasTitleStyle={hasTitleStyle}
                isWrongStyle={isWrongStyle}
                onReservationInfoChanged={onReservationInfoChanged}
            />

            <TokenCreatorView
                reservation={reservation}
                myDid={myDid}
                cardStyle={cardStyle}
                hasTitleStyle={hasTitleStyle}
                onSecurityTokenChanged={onSecurityTokenChanged}
            />

        </CollapsibleFieldsetView>
    }
}
