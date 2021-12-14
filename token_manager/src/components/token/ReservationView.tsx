import { BigNumber } from "@polymathnetwork/polymesh-sdk";
import {
    CreateSecurityTokenParams,
    TransferTickerOwnershipParams,
} from "@polymathnetwork/polymesh-sdk/internal";
import {
    KnownTokenType,
    SecurityToken,
    TickerReservation,
    TickerReservationStatus,
    TokenIdentifier,
} from "@polymathnetwork/polymesh-sdk/types";
import { Component } from "react";
import { ReservationInfoJson } from "../../types";
import { EnumSelectView } from "../EnumView";
import { LongHexView } from "../LongHexView";
import { TokenIdentifiersView } from "./TokenIdentifierView";

export interface TickerReservationViewProps {
    reservation: ReservationInfoJson,
    myDid: string,
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
                Owned by: <LongHexView value={reservation.details?.owner?.did} lut={{ [myDid]: "me" }} />
            </li>
            <li key="status">With status: {reservation.details?.status}</li>
            <li key="expiry">Valid until: {reservation.details?.expiryDate?.toISOString()}</li>
        </ul>
    }
}

export type TransferTickerOwnership = (reservation: ReservationInfoJson, params: TransferTickerOwnershipParams) => Promise<TickerReservation>

interface TickerReservationTransferViewState {
    target: string
    hasExpiry: boolean
    expiry: string
    isExpiryValid: boolean
}

export interface TickerReservationTransferViewProps {
    reservation: ReservationInfoJson,
    myDid: string,
    cardStyle: any,
    hasTitleStyle: any,
    isWrongStyle: any,
    transferReservationOwnership: TransferTickerOwnership,
}

export class TickerReservationTransferView extends Component<TickerReservationTransferViewProps, TickerReservationTransferViewState> {
    constructor(props: TickerReservationTransferViewProps) {
        super(props)
        this.state = {
            target: "",
            hasExpiry: true,
            expiry: new Date().toISOString(),
            isExpiryValid: true,
        }
    }

    updateTarget = (e) => this.setState({ target: e.target.value })
    updateExpiry = (e) => {
        const newExpiry = e.target.value
        this.setState({
            expiry: newExpiry,
            isExpiryValid: new Date(newExpiry).toString() !== "Invalid Date"
        })
    }
    updateHasExpiry = (e) => this.setState({ hasExpiry: e.target.checked })
    onTransferReservationOwnership = async (e) => this.props.transferReservationOwnership(this.props.reservation, this.getTransferParams())

    getTransferParams = () => ({
        target: this.state.target,
        expiry: this.state.hasExpiry ? new Date(this.state.expiry) : undefined
    }) as TransferTickerOwnershipParams

    render() {
        const {
            reservation,
            myDid,
            cardStyle,
            hasTitleStyle,
            isWrongStyle,
        } = this.props
        const canCreate: boolean = reservation.current !== null
            && reservation.details?.status === TickerReservationStatus.Reserved
            && reservation.details?.owner?.did === myDid
        return <fieldset className={cardStyle}>
            <legend>Ownership transfer</legend>
            <div>
                <label htmlFor="transfer-target">
                    <span className={hasTitleStyle} title="Target identity of the ownership transfer">Target</span>
                </label>
                <input
                    name="transfer-target"
                    type="text"
                    placeholder="0x123"
                    defaultValue={this.state.target}
                    disabled={!canCreate}
                    onChange={this.updateTarget}
                />
            </div>
            <div>
                <label htmlFor="transfer-has-expiry">
                    <span className={hasTitleStyle} title="Whether the ownership transfer has an expiry">Has Expiry</span>
                </label>
                <input
                    name="transfer-has-expiry"
                    type="checkbox"
                    defaultChecked={this.state.hasExpiry}
                    disabled={!canCreate}
                    onChange={this.updateHasExpiry}
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
                <input
                    name="transfer-expiry"
                    type="text"
                    className={this.state.isExpiryValid ? "" : isWrongStyle}
                    placeholder={new Date().toISOString()}
                    defaultValue={this.state.expiry}
                    disabled={!canCreate || !this.state.hasExpiry}
                    onChange={this.updateExpiry}
                />
            </div>
            <div className="submit">
                <button
                    className="submit transfer-reservation"
                    onClick={this.onTransferReservationOwnership}
                    disabled={!canCreate || !this.state.isExpiryValid}>
                    Transfer ownership
                </button>
            </div>
        </fieldset>
    }
}

export type CreateSecurityToken = (reservation: ReservationInfoJson, params: CreateSecurityTokenParams) => Promise<SecurityToken>

interface TokenCreatorViewState {
    canCreate: boolean
    longName: string
    isDivisible: boolean
    assetType: KnownTokenType
    fundingRound: string
    requiresUniqueness: boolean
    tokenIdentifiers: TokenIdentifier[]
}

export interface TokenCreatorViewProps {
    reservation: ReservationInfoJson,
    myDid: string,
    cardStyle: any,
    hasTitleStyle: any,
    createSecurityToken: CreateSecurityToken,
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

    updateLongName = (e) => this.setState({ longName: e.target.value })
    updateIsDivisible = (e) => this.setState({ isDivisible: e.target.checked })
    updateAssetTypeFromInput = (e) => this.setState({ assetType: e.target.value })
    updateAssetTypeFromDropDown = async (e) => this.setState({ assetType: e.target.value })
    updateFundingRound = (e) => this.setState({ fundingRound: e.target.value })
    updateUniqueness = (e) => this.setState({ requiresUniqueness: e.target.checked })
    onTokenIdentifiersChange = (identifiers: TokenIdentifier[]) => this.setState({ tokenIdentifiers: identifiers })
    onCreateToken = async (e) => this.props.createSecurityToken(this.props.reservation, this.getTokenParams())

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
        const {
            reservation,
            myDid,
            cardStyle,
            hasTitleStyle,
        } = this.props
        const canCreate: boolean = reservation.current !== null
            && reservation.details?.status === TickerReservationStatus.Reserved
            && reservation.details?.owner?.did === myDid
        return <fieldset className={cardStyle}>
            <legend>Token creation</legend>
            <div>
                <label htmlFor="token-name">
                    <span className={hasTitleStyle} title="Long name of your security token">Name</span>
                </label>
                <input
                    name="token-name"
                    type="text"
                    placeholder="American CME"
                    defaultValue={this.state.longName}
                    disabled={!canCreate}
                    onChange={this.updateLongName}
                />
            </div>
            <div>
                <label htmlFor="token-divisible">
                    <span className={hasTitleStyle} title="Whether it can be sub-divided">Divisible</span>
                </label>
                <input
                    name="token-divisible"
                    type="checkbox"
                    defaultChecked={this.state.isDivisible}
                    disabled={!canCreate}
                    onChange={this.updateIsDivisible}
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
                    defaultValue={this.state.assetType}
                    disabled={!canCreate}
                    onChange={this.updateAssetTypeFromInput}
                />
                &nbsp;
                <EnumSelectView<KnownTokenType>
                    theEnum={KnownTokenType}
                    defaultValue={this.state.assetType}
                    onChange={this.updateAssetTypeFromDropDown}
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
                    defaultValue={this.state.fundingRound}
                    disabled={!canCreate}
                    onChange={this.updateFundingRound}
                />
            </div>
            <div>
                <label htmlFor="token-requiresUniqueness">
                    <span className={hasTitleStyle} title="Whether it requires investor uniqueness">Requires uniqueness</span>
                </label>
                <input
                    name="token-requiresUniqueness"
                    type="checkbox"
                    defaultChecked={this.state.requiresUniqueness}
                    disabled={!canCreate}
                    onChange={this.updateUniqueness}
                />
            </div>
            <div>
                <label htmlFor="token-tokenIdentifiers">
                    <span className={hasTitleStyle} title="Domestic or international alphanumeric security identifiers for the token (ISIN, CUSIP, etc)">Token identifiers</span>
                </label>
                <TokenIdentifiersView
                    identifiers={this.state.tokenIdentifiers}
                    hasTitleStyle={hasTitleStyle}
                    canManipulate={canCreate}
                    onChange={this.onTokenIdentifiersChange}
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
        </fieldset>
    }
}

export interface TickerReservationManagerProps {
    reservation: ReservationInfoJson,
    myDid: string,
    cardStyle: any,
    hasTitleStyle: any,
    isWrongStyle: any,
    transferReservationOwnership: TransferTickerOwnership,
    createSecurityToken: CreateSecurityToken,
}

export class TickerReservationManagerView extends Component<TickerReservationManagerProps> {
    render() {
        const {
            reservation,
            myDid,
            cardStyle,
            hasTitleStyle,
            isWrongStyle,
            transferReservationOwnership,
            createSecurityToken
        } = this.props
        const canCreate: boolean = reservation.current !== null
            && reservation.details?.status === TickerReservationStatus.Reserved
            && reservation.details?.owner?.did === myDid
        return <fieldset className={cardStyle}>
            <legend>Ticker Reservation: {reservation.current?.ticker}</legend>

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
                transferReservationOwnership={transferReservationOwnership}
            />

            <TokenCreatorView
                reservation={reservation}
                myDid={myDid}
                cardStyle={cardStyle}
                hasTitleStyle={hasTitleStyle}
                createSecurityToken={createSecurityToken}
            />

        </fieldset>
    }
}
