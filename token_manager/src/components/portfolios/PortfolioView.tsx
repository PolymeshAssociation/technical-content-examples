import { Polymesh } from "@polymathnetwork/polymesh-sdk";
import { DefaultPortfolio, Identity, NumberedPortfolio, PortfolioBalance } from "@polymathnetwork/polymesh-sdk/types";
import { ChangeEvent, Component } from "react";
import { ApiGetter, isNumberedPortfolio, PortfolioInfoJson } from "../../types";
import {
    NewPortfolioParams,
    OnPortfolioInfoChanged,
    fetchPortfolioInfoJson,
} from "../../handlers/portfolios/PortfolioHandlers";
import { IdentityView } from "../identity/IdentityView";
import { CollapsibleFieldsetView } from "../presentation/CollapsibleFieldsetView";
import { showFetchCycle, ShowFetchCycler, showRequestCycle, ShowRequestCycler } from "../../ui-helpers";

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
    apiGetter: ApiGetter
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

    updateName = (e: ChangeEvent<HTMLInputElement>) => this.setState({ name: e.target.value })
    onCreatePortfolio = async () => this.createPortfolio(this.getCreateParams())
    createPortfolio = async (newName: NewPortfolioParams): Promise<PortfolioInfoJson> => {
        const api: Polymesh = await this.props.apiGetter()
        const cyclerId: ShowFetchCycler = showFetchCycle("Your current identity")
        const me: Identity = await api.getCurrentIdentity()
        cyclerId.fetched()
        const cyclerReq: ShowRequestCycler = showRequestCycle("Your new portfolio")
        const queue = await me.portfolios.create(newName)
        cyclerReq.running()
        const created: NumberedPortfolio = await queue.run()
        cyclerReq.hasRun()
        const cyclerInfo: ShowFetchCycler = showFetchCycle("Your new portfolio info")
        const createdInfo: PortfolioInfoJson = await fetchPortfolioInfoJson(created)
        cyclerInfo.fetched()
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

export interface PortfolioBalanceViewProps {
    balance: PortfolioBalance
}

export class PortfolioBalanceView extends Component<PortfolioBalanceViewProps> {
    render() {
        const {
            balance: {
                token: {
                    ticker,
                },
                free,
                locked,
                total,
            },
        } = this.props
        return <ul>
            <li key="ticker">
                Ticker:&nbsp;
                {ticker}
            </li>
            <li key="free">
                Free:&nbsp;
                {free.toString(10)}
            </li>
            <li key="locked">
                Locked:&nbsp;
                {locked.toString(10)}
            </li>
            <li key="total">
                Total:&nbsp;
                {total.toString(10)}
            </li>
        </ul>
    }
}