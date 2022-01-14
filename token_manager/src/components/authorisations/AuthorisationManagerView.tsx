import { Polymesh } from "@polymathnetwork/polymesh-sdk";
import { AuthorizationRequest, Identity } from "@polymathnetwork/polymesh-sdk/types";
import { Component } from "react";
import { ApiGetter } from "../../types";
import { CollapsibleFieldsetView } from "../presentation/CollapsibleFieldsetView";
import { AuthorisationRequestsView } from "./AuthorisationView";

interface AuthorisationManagerViewState {
    whose: string
    receivedRequests: AuthorizationRequest[]
    sentRequests: AuthorizationRequest[]
}

export interface AuthorisationManagerViewProps {
    myDid: string
    myAddress: string
    cardStyle: any
    isWrongStyle: any
    canManipulate: boolean
    apiGetter: ApiGetter
}

export class AuthorisationManagerView extends Component<AuthorisationManagerViewProps, AuthorisationManagerViewState> {

    constructor(props: AuthorisationManagerViewProps) {
        super(props)
        this.state = {
            whose: this.props.myDid,
            receivedRequests: [],
            sentRequests: [],
        }
    }

    onWhoseChanged = (e: React.ChangeEvent<HTMLInputElement>) => this.setState({
        whose: e.target.value,
    })
    onPickMyDid = () => this.setState({
        whose: this.props.myDid,
    })
    onLoadAuthorisationRequests = async () => {
        const api: Polymesh = await this.props.apiGetter()
        const whose: Identity = await api.getIdentity({ did: this.state.whose })
        this.setState({
            receivedRequests: await whose.authorizations.getReceived(),
        })
        this.setState({
            sentRequests: (await whose.authorizations.getSent()).data,
        })
    }

    render() {
        const { whose, receivedRequests, sentRequests } = this.state
        const { myDid, myAddress, cardStyle, isWrongStyle, canManipulate } = this.props
        return <CollapsibleFieldsetView
            className={cardStyle}
            legend="My authorisation requests"
            collapsed={true}>

            <div className="submit">
                <button
                    className="submit load-authorisations"
                    onClick={this.onLoadAuthorisationRequests}>
                    Load authorisations of
                </button>
                &nbsp;
                <input
                    value={whose}
                    placeholder="0x123"
                    onChange={this.onWhoseChanged}
                />
                &nbsp;
                <button
                    className="submit pick-my-did"
                    onClick={this.onPickMyDid}>
                    Pick me
                </button>
            </div>

            <CollapsibleFieldsetView
                className={cardStyle}
                legend="Received"
                collapsed={false}>

                <AuthorisationRequestsView
                    requests={receivedRequests}
                    myDid={myDid}
                    myAddress={myAddress}
                    isWrongStyle={isWrongStyle}
                    canManipulate={canManipulate}
                    onAuthorisationRequestChanged={this.onLoadAuthorisationRequests}
                />
            </CollapsibleFieldsetView>

            <CollapsibleFieldsetView
                className={cardStyle}
                legend="Sent"
                collapsed={false}>

                <AuthorisationRequestsView
                    requests={sentRequests}
                    myDid={myDid}
                    myAddress={myAddress}
                    isWrongStyle={isWrongStyle}
                    canManipulate={canManipulate}
                    onAuthorisationRequestChanged={this.onLoadAuthorisationRequests}
                />
            </CollapsibleFieldsetView>

        </CollapsibleFieldsetView>
    }
}
