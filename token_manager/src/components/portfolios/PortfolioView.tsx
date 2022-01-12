import { Polymesh } from "@polymathnetwork/polymesh-sdk";
import { DefaultPortfolio, Identity, NumberedPortfolio } from "@polymathnetwork/polymesh-sdk/types";
import { Component } from "react";
import { isNumberedPortfolio, PortfolioInfoJson } from "../../types";
import {
    NewPortfolioParams,
    OnPortfolioInfoChanged,
    fetchPortfolioInfoJson,
} from "../../handlers/portfolios/PortfolioHandlers";
import { IdentityView } from "../identity/IdentityView";
import { CollapsibleFieldsetView } from "../presentation/CollapsibleFieldsetView";

export interface PortfolioViewProps {
    portfolio: DefaultPortfolio | NumberedPortfolio
    myDid: string
}

export class PortfolioView extends Component<PortfolioViewProps> {
    render() {
        const { portfolio, myDid } = this.props
        return <ul>
            <li key="owner">
                Owner:&nbsp;
                <IdentityView
                    value={portfolio.owner.did}
                    lut={{ [myDid]: "me" }} />
            </li>
            <li key="id">Id:&nbsp;{isNumberedPortfolio(portfolio) ? portfolio.id.toString(10) : "null"}</li>
        </ul>
    }
}

export interface PortfoliosViewProps {
    portfolios: (DefaultPortfolio | NumberedPortfolio)[]
    myDid: string
}

export class PortfoliosView extends Component<PortfoliosViewProps> {
    render() {
        const { portfolios, myDid } = this.props
        if (portfolios === null) return <div>"There are no portfolios"</div>
        return <ul>{
            portfolios.map((portfolio: DefaultPortfolio | NumberedPortfolio, index: number) =>
                <li key={index}>
                    Portfolio {index}:&nbsp;
                    <PortfolioView
                        portfolio={portfolio}
                        myDid={myDid} />
                </li>)
        }</ul>
    }
}

interface NewPortfolioViewState {
    name: string
}

export interface NewPortfolioViewProps {
    cardStyle: any
    apiPromise: Promise<Polymesh>
    onPortfolioInfoCreated: OnPortfolioInfoChanged
    canManipulate: boolean
}

export class NewPortfolioView extends Component<NewPortfolioViewProps, NewPortfolioViewState> {
    constructor(props: NewPortfolioViewProps) {
        super(props)
        this.state = {
            name: ""
        }
    }

    updateName = (e) => this.setState({ name: e.target.value })
    onCreatePortfolio = async () => this.createPortfolio(this.getCreateParams())
    createPortfolio = async (newName: NewPortfolioParams): Promise<PortfolioInfoJson> => {
        const api: Polymesh = await this.props.apiPromise
        const me: Identity = await api.getCurrentIdentity()
        const created: NumberedPortfolio = await (await me.portfolios.create(newName)).run()
        const createdInfo: PortfolioInfoJson = await fetchPortfolioInfoJson(created)
        this.props.onPortfolioInfoCreated(createdInfo)
        return createdInfo
    }
    getCreateParams = () => ({ name: this.state.name })

    render() {
        const { cardStyle, canManipulate } = this.props
        return <CollapsibleFieldsetView
            className={cardStyle}
            legend="New portfolio"
            collapsed={false}>

            <div>Numbered portfolio to create:</div>
            <div className="submit">
                Name:&nbsp;
                <input
                    defaultValue={this.state.name}
                    placeholder="Trading portfolio"
                    disabled={!canManipulate}
                    onChange={this.updateName}
                />
                &nbsp;
                <button
                    className="submit create-portfolio"
                    onClick={this.onCreatePortfolio}
                    disabled={!canManipulate}>
                    Create
                </button>
            </div>
        </CollapsibleFieldsetView>
    }
}
