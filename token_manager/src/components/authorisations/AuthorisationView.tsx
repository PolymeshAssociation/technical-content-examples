import { Authorization, AuthorizationRequest, AuthorizationType, Permissions } from "@polymathnetwork/polymesh-sdk/types";
import { Component } from "react";
import { OnAuthorisationChanged, OnAuthorisationRequestChanged } from "../../handlers/authorisations/AuthorisationHandlers";
import { assertUnreachable, isIdentityNotAccount } from "../../types";
import { DateTimeEntryView } from "../elements/DateTimeEntry";
import { EnumSelectView } from "../EnumView";
import { IdentityView } from "../identity/IdentityView";
import { SubsidyView } from "../identity/SubsidyView";
import { PermissionGroupView } from "../permissions/PermissionGroupView";
import { PermissionsView } from "../permissions/PermissionsView";
import { PortfolioView } from "../portfolios/PortfolioView";

export interface AuthorisationViewProps {
    authorisation: Authorization
    myDid: string
    myAddress: string
    canManipulate: boolean
    onAuthorisationChanged: OnAuthorisationChanged
}

export class AuthorisationView extends Component<AuthorisationViewProps> {

    onAuthorizationTypeChanged = async (e) => this.props.onAuthorisationChanged({
        ...this.props.authorisation,
        type: e.target.value,
    })
    onPermissionsChanged = (permissions: Permissions) => this.props.onAuthorisationChanged({
        type: AuthorizationType.JoinIdentity,
        value: permissions,
    })

    render() {
        const { authorisation, myDid, myAddress, canManipulate } = this.props
        const { type } = authorisation
        const elements: JSX.Element[] = [
            <li key="type">
                Type:&nbsp;
                <EnumSelectView
                    defaultValue={authorisation.type}
                    theEnum={AuthorizationType}
                    onChange={this.onAuthorizationTypeChanged}
                    canManipulate={canManipulate}
                />
            </li>
        ]
        switch (type) {
            case AuthorizationType.AddRelayerPayingKey:
                elements.push(<li key="value">
                    Value:&nbsp;
                    <SubsidyView
                        subsidy={authorisation.value}
                        myAddress={myAddress} />
                </li>)
                break;
            case AuthorizationType.BecomeAgent:
                elements.push(<li key="value">
                    Value:&nbsp;
                    <PermissionGroupView group={authorisation.value} />
                </li>)
                break
            case AuthorizationType.JoinIdentity:
                elements.push(<li key="value">
                    Value:&nbsp;
                    <PermissionsView
                        permissions={authorisation.value}
                        myDid={myDid}
                        canManipulate={canManipulate}
                        onPermissionsChanged={this.onPermissionsChanged}
                    />
                </li>)
                break
            case AuthorizationType.PortfolioCustody:
                elements.push(<li key="value">
                    Value:&nbsp;
                    <PortfolioView portfolio={authorisation.value} myDid={myDid} />
                </li>)
                break
            case AuthorizationType.RotatePrimaryKey:
                // Nothing to add
                break
            case AuthorizationType.AddMultiSigSigner:
            case AuthorizationType.AttestPrimaryKeyRotation:
            case AuthorizationType.TransferAssetOwnership:
            case AuthorizationType.TransferTicker:
                <li key="value">
                    Value:&nbsp;{authorisation.value}
                </li>
                break
            default: assertUnreachable(type)
        }
        return <ul>{elements}</ul>
    }
}

export interface AuthorisationRequestViewProps {
    request: AuthorizationRequest
    myDid: string
    myAddress: string
    isWrongStyle: any
    canManipulate: boolean
    onAuthorisationRequestChanged: OnAuthorisationRequestChanged
}

export class AuthorisationRequestView extends Component<AuthorisationRequestViewProps> {

    onAcceptRequest = async () => {
        await (await this.props.request.accept()).run()
        this.props.onAuthorisationRequestChanged(this.props.request)
    }
    onRejectRequest = async () => {
        await (await this.props.request.remove()).run()
        this.props.onAuthorisationRequestChanged(this.props.request)
    }

    render() {
        const {
            request: {
                authId,
                issuer,
                target,
                data,
                expiry,
            },
            myDid,
            myAddress,
            canManipulate,
            isWrongStyle,
        } = this.props

        const targetValue: string = isIdentityNotAccount(target) ? target.did : target.address
        const amTarget: boolean = targetValue === myDid || targetValue === myAddress
        const canAccept: boolean = amTarget && canManipulate
        const amIssuer: boolean = issuer.did === myDid
        const canReject: boolean = (amIssuer || amTarget) && canManipulate
        return <ul>
            <li key="id">
                AuthId:&nbsp;{authId.toString(10)}&nbsp;
                <button
                    className="submit accept-auth-request"
                    onClick={this.onAcceptRequest}
                    disabled={!canAccept}>
                    Accept
                </button>
                &nbsp;
                <button
                    className="submit reject-auth-request"
                    onClick={this.onRejectRequest}
                    disabled={!canReject}>
                    Reject
                </button>
            </li>
            <li key="issuer">
                Issuer:&nbsp;
                <IdentityView
                    value={issuer.did}
                    lut={{ [myDid]: "me" }}
                />
            </li>
            <li key="target">
                Target:&nbsp;
                <IdentityView
                    value={targetValue}
                    lut={{ [myDid]: "me", [myAddress]: "me" }}
                />
            </li>
            <li key="expiry">
                Expiry:&nbsp;
                <DateTimeEntryView
                    dateTime={expiry}
                    canManipulate={false}
                    isOptional={true}
                    isWrongStyle={isWrongStyle}
                    validDateChanged={() => { }}
                />
            </li>
            <li key="data">
                Data:&nbsp;
                <AuthorisationView
                    authorisation={data}
                    canManipulate={false}
                    myDid={myDid}
                    myAddress={myAddress}
                    onAuthorisationChanged={() => { }}
                />
            </li>
        </ul>
    }
}

export interface AuthorisationRequestsViewProps {
    requests: AuthorizationRequest[]
    myDid: string
    myAddress: string
    isWrongStyle: any
    canManipulate: boolean
    onAuthorisationRequestChanged: OnAuthorisationRequestChanged
}

export class AuthorisationRequestsView extends Component<AuthorisationRequestsViewProps> {

    onAuthorisationRequestChanged = (index: number) => (request: AuthorizationRequest) => {
        this.props.onAuthorisationRequestChanged(request)
    }

    render() {
        const {
            requests,
            myDid,
            myAddress,
            isWrongStyle,
            canManipulate } = this.props
        if (typeof requests === "undefined" || requests === null || requests.length === 0) return <div>No authorisation requests</div>
        return <ul>{
            requests.map((request: AuthorizationRequest, index: number) => <li key={index}>
                Authorisation request {index}:&nbsp;
                <AuthorisationRequestView
                    request={request}
                    myDid={myDid}
                    myAddress={myAddress}
                    isWrongStyle={isWrongStyle}
                    onAuthorisationRequestChanged={this.onAuthorisationRequestChanged(index)}
                    canManipulate={canManipulate}
                />
            </li>)
        }</ul>
    }
}
