import { TransferTokenOwnershipParams } from "@polymathnetwork/polymesh-sdk/internal";
import { SecurityTokenDetails } from "@polymathnetwork/polymesh-sdk/types";
import { Component } from "react";
import { TokenInfoJson } from "../../types";
import { EventIdentifierView } from "../elements/EventIdentifierView";
import { IdentitiesView } from "../identity/IdentityView";
import { LongHexView } from "../LongHexView";
import { TokenIdentifiersView } from "./TokenIdentifierView";

export interface SecurityTokenFieldsViewProps {
    token: TokenInfoJson
    cardStyle: any
    hasTitleStyle: any
}

export class SecurityTokenFieldsView extends Component<SecurityTokenFieldsViewProps> {
    render() {
        const { token, cardStyle, hasTitleStyle } = this.props
        return <fieldset className={cardStyle}>
            <legend>Fields</legend>
            <ul>
                <li key="did">Did: <LongHexView value={token?.current?.did} lut={null} /></li>
                <li key="createdAt">
                    Created at:&nbsp;
                    <EventIdentifierView
                        eventId={token?.createdAt}
                    />
                </li>
                <li key="currentFundingRound">Current funding round: {token.currentFundingRound}</li>
                <li key="tokenIdentifiers">
                    Token identifiers:&nbsp;
                    <TokenIdentifiersView
                        hasTitleStyle={hasTitleStyle}
                        onChange={() => { }}
                        identifiers={token.tokenIdentifiers ?? []}
                        canManipulate={false}
                    />
                </li>
            </ul>
        </fieldset>
    }
}

export interface SecurityTokenDetailsViewProps {
    details: SecurityTokenDetails
    myDid: string
    cardStyle: any
}

export class SecurityTokenDetailsView extends Component<SecurityTokenDetailsViewProps> {
    render() {
        const {
            details,
            myDid,
            cardStyle,
        } = this.props
        const owner: string = details?.owner?.did
        const identityLut = { [myDid]: "me" }
        return <fieldset className={cardStyle}>
            <legend>Details</legend>
            <ul>
                <li key="name">With the name: {details?.name}</li>
                <li key="divisible">
                    Divisible:&nbsp;
                    <input
                        type="checkbox"
                        checked={details?.isDivisible}
                        disabled={true}
                    />
                </li>
                <li key="assetType">As asset type: {details?.assetType}</li>
                <li key="requiresInvestorUniqueness">
                    Requires investor uniqueness:&nbsp;
                    <input
                        type="checkbox"
                        checked={details?.requiresInvestorUniqueness}
                        disabled={true}
                    />
                </li>
                <li key="owner">Owned by: <LongHexView value={owner} lut={identityLut} /></li>
                <li key="totalSupply">With total supply of: {details?.totalSupply?.toString(10)}</li>
                <li key="fullAgents">Whose full agents are: <IdentitiesView values={details?.fullAgents} lut={identityLut} /></li>
            </ul>
        </fieldset>
    }
}

export type TransferTokenOwnership = (token: TokenInfoJson, params: TransferTokenOwnershipParams) => Promise<void>

interface SecurityTokenOwnerTransferViewState {
    ownershipTarget: string
    hasOwnershipExpiry: boolean
    ownershipExpiry: string
    isOwnershipExpiryValid: boolean
}

export interface SecurityTokenOwnerTransferViewProps {
    token: TokenInfoJson
    myDid: string
    cardStyle: any
    hasTitleStyle: any
    isWrongStyle: any
    transferTokenOwnership: TransferTokenOwnership
}

export class SecurityTokenOwnerTransferView extends Component<SecurityTokenOwnerTransferViewProps, SecurityTokenOwnerTransferViewState> {
    constructor(props: SecurityTokenManagerViewProps) {
        super(props)
        this.state = {
            ownershipTarget: "",
            hasOwnershipExpiry: true,
            ownershipExpiry: new Date().toISOString(),
            isOwnershipExpiryValid: true,
        }
    }

    updateOwnershipTarget = (e) => this.setState({ ownershipTarget: e.target.value })
    updateExpiry = (e) => {
        const newExpiry = e.target.value
        this.setState({
            ownershipExpiry: newExpiry,
            isOwnershipExpiryValid: new Date(newExpiry).toString() !== "Invalid Date"
        })
    }
    updateHasExpiry = (e) => this.setState({ hasOwnershipExpiry: e.target.checked })
    onTransferReservationOwnership = async (e) => this.props.transferTokenOwnership(this.props.token, this.getTransferParams())

    getTransferParams = () => ({
        target: this.state.ownershipTarget,
        expiry: this.state.hasOwnershipExpiry ? new Date(this.state.ownershipExpiry) : undefined
    }) as TransferTokenOwnershipParams

    render() {
        const {
            token,
            myDid,
            cardStyle,
            hasTitleStyle,
            isWrongStyle,
        } = this.props
        const canTransfer: boolean = token.current !== null
            && token.details?.owner?.did === myDid
        return <fieldset className={cardStyle}>
            <legend>Ownership transfer</legend>
            <div className="submit">
                <label htmlFor="token-ownership-target">
                    <span className={hasTitleStyle} title="Who is the new owner">Target</span>
                </label>
                Target:&nbsp;
                <input
                    name="token-ownership-target"
                    type="text"
                    placeholder="0x1234"
                    defaultValue={this.state.ownershipTarget}
                    disabled={!canTransfer}
                    onChange={this.updateOwnershipTarget} />
            </div>
            <div>
                <label htmlFor="transfer-has-expiry">
                    <span className={hasTitleStyle} title="Whether the ownership transfer has an expiry">Has Expiry</span>
                </label>
                <input
                    name="transfer-has-expiry"
                    type="checkbox"
                    defaultChecked={this.state.hasOwnershipExpiry}
                    disabled={!canTransfer}
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
                    className={this.state.isOwnershipExpiryValid ? "" : isWrongStyle}
                    placeholder={new Date().toISOString()}
                    defaultValue={this.state.ownershipExpiry}
                    disabled={!canTransfer || !this.state.hasOwnershipExpiry}
                    onChange={this.updateExpiry}
                />
            </div>
            <div className="submit">
                <button className="submit transfer-token"
                    onClick={this.onTransferReservationOwnership}
                    disabled={!canTransfer}>
                    Transfer ownership
                </button>
            </div>
        </fieldset>
    }
}

export interface SecurityTokenManagerViewProps {
    token: TokenInfoJson
    myDid: string
    cardStyle: any
    hasTitleStyle: any
    isWrongStyle: any
    transferTokenOwnership: TransferTokenOwnership
}

export class SecurityTokenManagerView extends Component<SecurityTokenManagerViewProps> {
    render() {
        const {
            token,
            myDid,
            cardStyle,
            hasTitleStyle,
            isWrongStyle,
            transferTokenOwnership,
        } = this.props
        return <fieldset className={cardStyle}>
            <legend>Security Token: {token.current?.ticker}</legend>

            <SecurityTokenFieldsView
                token={token}
                cardStyle={cardStyle}
                hasTitleStyle={hasTitleStyle}
            />

            <SecurityTokenDetailsView
                details={token.details}
                myDid={myDid}
                cardStyle={cardStyle}
            />

            <SecurityTokenOwnerTransferView
                token={token}
                myDid={myDid}
                cardStyle={cardStyle}
                hasTitleStyle={hasTitleStyle}
                isWrongStyle={isWrongStyle}
                transferTokenOwnership={transferTokenOwnership}
            />

        </fieldset>
    }
}
