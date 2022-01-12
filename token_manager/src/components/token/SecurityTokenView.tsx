import { TransferTokenOwnershipParams } from "@polymathnetwork/polymesh-sdk/internal";
import { Identity, SecurityToken, SecurityTokenDetails } from "@polymathnetwork/polymesh-sdk/types";
import { Component } from "react";
import { fetchTokenInfoJson, OnTokenInfoChanged } from "../../handlers/token/TokenHandlers";
import { TokenInfoJson } from "../../types";
import { EventIdentifierView } from "../elements/EventIdentifierView";
import { IdentitiesView, IdentityView } from "../identity/IdentityView";
import { CollapsibleFieldsetView } from "../presentation/CollapsibleFieldsetView";
import { TokenIdentifiersView } from "./TokenIdentifierView";

export interface SecurityTokenFieldsViewProps {
    token: TokenInfoJson
    cardStyle: any
    hasTitleStyle: any
}

export class SecurityTokenFieldsView extends Component<SecurityTokenFieldsViewProps> {
    render() {
        const { token, cardStyle, hasTitleStyle } = this.props
        return <CollapsibleFieldsetView
            className={cardStyle}
            legend="Fields"
            collapsed={false}>

            <ul>
                <li key="did">Did:&nbsp;
                    <IdentityView
                        value={token?.current?.did ?? ""}
                        lut={null} />
                </li>
                <li key="createdAt">
                    Created at:&nbsp;
                    <EventIdentifierView
                        eventId={token?.createdAt} />
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
        </CollapsibleFieldsetView>
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
        const owner: Identity = details?.owner
        const identityLut = { [myDid]: "me" }
        return <CollapsibleFieldsetView
            className={cardStyle}
            legend="Details"
            collapsed={false}>

            <ul>
                <li key="name">With the name: {details?.name}</li>
                <li key="divisible">
                    Divisible:&nbsp;
                    <input
                        type="checkbox"
                        defaultChecked={details?.isDivisible}
                        disabled={true}
                    />
                </li>
                <li key="assetType">As asset type: {details?.assetType}</li>
                <li key="requiresInvestorUniqueness">
                    Requires investor uniqueness:&nbsp;
                    <input
                        type="checkbox"
                        defaultChecked={details?.requiresInvestorUniqueness}
                        disabled={true}
                    />
                </li>
                <li key="owner">Owned by:&nbsp;
                    <IdentityView
                        value={owner ?? ""}
                        lut={identityLut} />
                </li>
                <li key="totalSupply">With total supply of:&nbsp;{details?.totalSupply?.toString(10)}</li>
                <li key="fullAgents">Whose full agents are:&nbsp;
                    <IdentitiesView
                        values={details?.fullAgents}
                        lut={identityLut} />
                </li>
            </ul>
        </CollapsibleFieldsetView>
    }
}

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
    onSecurityTokenChanged: OnTokenInfoChanged
}

export class SecurityTokenOwnerTransferView extends Component<SecurityTokenOwnerTransferViewProps, SecurityTokenOwnerTransferViewState> {
    constructor(props: SecurityTokenOwnerTransferViewProps) {
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
    onTransferReservationOwnership = async (e) => {
        const securityToken: SecurityToken = await (await this.props.token.current.transferOwnership(this.getTransferParams())).run()
        const tokenInfo: TokenInfoJson = await fetchTokenInfoJson(securityToken)
        this.props.onSecurityTokenChanged(tokenInfo)
    }
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
        return <CollapsibleFieldsetView
            className={cardStyle}
            legend="Ownership transfer"
            collapsed={true}>

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
        </CollapsibleFieldsetView>
    }
}

export interface SecurityTokenManagerViewProps {
    token: TokenInfoJson
    myDid: string
    cardStyle: any
    hasTitleStyle: any
    isWrongStyle: any
    onTokenInfoChanged: OnTokenInfoChanged
}

export class SecurityTokenManagerView extends Component<SecurityTokenManagerViewProps> {
    render() {
        const {
            token,
            myDid,
            cardStyle,
            hasTitleStyle,
            isWrongStyle,
            onTokenInfoChanged: onSecurityTokenChanged,
        } = this.props
        return <CollapsibleFieldsetView
            className={cardStyle}
            legend={`Security Token: ${token.current?.ticker}`}
            collapsed={false}>

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
                onSecurityTokenChanged={onSecurityTokenChanged}
            />

        </CollapsibleFieldsetView>
    }
}
