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
} from "@polymathnetwork/polymesh-sdk/types";
import { Component } from "react";
import { ReservationInfoJson } from "../../types";
import { EnumSelectView } from "../EnumView";
import { LongHexView } from "../LongHexView";

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

const targetKey = "target"
const hasExpiryKey = "hasExpiry"
const expiryKey = "expiry"
const isExpiryValidKey = "isExpiryValid"

interface TickerReservationTransferViewState {
    [targetKey]: string
    [hasExpiryKey]: boolean
    [expiryKey]: string
    [isExpiryValidKey]: boolean
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
            [targetKey]: "",
            [hasExpiryKey]: true,
            [expiryKey]: new Date().toISOString(),
            [isExpiryValidKey]: true,
        }
    }

    updateTarget = (e) => this.setState({ [targetKey]: e.target.value })
    updateExpiry = (e) => {
        const newExpiry = e.target.value
        this.setState({
            [expiryKey]: newExpiry,
            [isExpiryValidKey]: new Date(newExpiry).toString() !== "Invalid Date"
        })
    }
    updateHasExpiry = (e) => this.setState({ [hasExpiryKey]: e.target.checked })
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
        return <div className={cardStyle}>
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
        </div>
    }
}

export type CreateSecurityToken = (reservation: ReservationInfoJson, params: CreateSecurityTokenParams) => Promise<SecurityToken>

const longNameKey = "longName"
const isDivisibleKey = "isDivisible"
const assetTypeKey = "assetType"

interface TokenCreatorViewState {
    [longNameKey]: string
    [isDivisibleKey]: boolean
    [assetTypeKey]: KnownTokenType
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
        this.state = {
            [longNameKey]: "",
            [isDivisibleKey]: false,
            [assetTypeKey]: KnownTokenType.EquityCommon,
        }
    }

    updateLongName = (e) => this.setState({ [longNameKey]: e.target.value })
    updateIsDivisible = (e) => this.setState({ [isDivisibleKey]: e.target.checked })
    updateAssetTypeFromInput = (e) => this.setState({ [assetTypeKey]: e.target.value })
    updateAssetTypeFromDropDown = async (assetType) => this.setState({ [assetTypeKey]: assetType })
    onCreateToken = async (e) => this.props.createSecurityToken(this.props.reservation, this.getTokenParams())

    getTokenParams = () => ({
        name: this.state.longName,
        totalSupply: new BigNumber("0"),
        isDivisible: this.state.isDivisible,
        tokenType: this.state.assetType,
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
        return <div className={cardStyle}>
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
            <div className="submit">
                <button
                    className="submit create-token"
                    onClick={this.onCreateToken}
                    disabled={!canCreate}>
                    Create token
                </button>
            </div>
        </div>
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
