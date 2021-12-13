import {
    DefaultPortfolio,
    NumberedPortfolio,
} from "@polymathnetwork/polymesh-sdk/types";
import { Component } from "react";
import {
    isNumberedPortfolio,
} from "../../types";
import { LongHexView } from "../LongHexView";

export interface PortfolioViewProps {
    portfolio: DefaultPortfolio | NumberedPortfolio
    myDid: string
}

export class PortfolioView extends Component<PortfolioViewProps> {
    render() {
        const { portfolio, myDid } = this.props
        return <ul>
            <li key="owner">
                Owner:&nbsp;<LongHexView value={portfolio.owner.did} lut={{ [myDid]: "me" }} />
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
                    Portfolio {index}:&nbsp;<PortfolioView portfolio={portfolio} myDid={myDid} />
                </li>)
        }</ul>
    }
}
