import { DefaultPortfolio, NumberedPortfolio } from "@polymathnetwork/polymesh-sdk/internal";
import { Component } from "react";
import { isNumberedPortfolio, PortfolioInfoJson } from "../../types";
import { LongHexView } from "../LongHexView";

export type DeletePortfolio = (portfolio: NumberedPortfolio) => Promise<void>
export type SetCustodian = (portfolio: DefaultPortfolio | NumberedPortfolio, custodian: string) => Promise<void>
export type RelinquishCustody = (portfolio: DefaultPortfolio | NumberedPortfolio) => Promise<void>

const newCustodianKey = "newCustodian"

interface PortfolioInfoJsonViewState {
    [newCustodianKey]: string
}

export interface PortfolioInfoJsonViewProps {
    portfolio: PortfolioInfoJson
    myDid: string
    setCustodian: SetCustodian
    relinquishCustody: RelinquishCustody
    canManipulate: boolean
}

export class PortfolioInfoJsonView extends Component<PortfolioInfoJsonViewProps, PortfolioInfoJsonViewState> {
    constructor(props: PortfolioInfoJsonViewProps) {
        super(props);
        this.state = {
            [newCustodianKey]: props.portfolio.custodian,
        }
    }

    updateNewCustodian = (e) => {
        this.setState({
            [newCustodianKey]: e.target.value
        })
    }

    render() {
        const {
            portfolio,
            myDid,
            setCustodian,
            relinquishCustody,
            canManipulate,
        } = this.props
        const isCustodied: boolean = portfolio.original.owner.did !== portfolio.custodian
        const isMine: boolean = portfolio.original.owner.did === myDid
        const canSetCustody: boolean = canManipulate && isMine && !isCustodied
        const canRelinquish: boolean = canManipulate && isCustodied && portfolio.custodian === myDid
        const original = portfolio.original
        const isNumbered = isNumberedPortfolio(original)
        const id = isNumbered ? original.id.toString(10) : "null"
        return <ul>
            <li key="owner">
                Owner:&nbsp; <LongHexView value={original.owner.did} lut={{ [myDid]: "me" }} />
            </li>
            <li key="id">Id:&nbsp;{id}</li>
            <li key="name">Name:&nbsp;{portfolio.name}</li>
            <li key="custodian">Custodian:&nbsp;
                <input
                    defaultValue={this.state.newCustodian}
                    placeholder="0x123"
                    onChange={this.updateNewCustodian}
                    disabled={!canSetCustody}
                />
                &nbsp;
                <button
                    className="submit set-custodian"
                    onClick={() => setCustodian(portfolio.original, this.state.newCustodian)}
                    disabled={!canSetCustody}>
                    Set
                </button>
                &nbsp;
                <button
                    className="submit unset-custodian"
                    onClick={() => relinquishCustody(portfolio.original)}
                    disabled={!canRelinquish}>
                    Unset
                </button>
            </li>
        </ul>
    }
}

export interface PortfolioJsonInfosViewProps {
    portfolios: PortfolioInfoJson[]
    myDid: string
    deletePortfolio: DeletePortfolio
    setCustodian: SetCustodian
    relinquishCustody: RelinquishCustody
    canManipulate: boolean
}

export class PortfolioJsonInfosView extends Component<PortfolioJsonInfosViewProps> {
    render() {
        const {
            portfolios,
            myDid,
            deletePortfolio,
            setCustodian,
            relinquishCustody,
            canManipulate,
        } = this.props
        if (typeof portfolios === "undefined" || portfolios === null || portfolios.length === 0)
            return <div>There are no portfolios</div>
        return <ol>{
            portfolios
                .map((portfolio: PortfolioInfoJson, index: number) => {
                    const original: DefaultPortfolio | NumberedPortfolio = portfolio.original
                    const isNumbered: boolean = isNumberedPortfolio(original)
                    return <li key={index}>
                        Portfolio {index}:&nbsp;
                        <button
                            className="submit delete-portfolio"
                            onClick={() => isNumberedPortfolio(original) ? deletePortfolio(original) : ""}
                            disabled={!canManipulate || !isNumbered}>
                            Delete
                        </button>
                        <PortfolioInfoJsonView
                            portfolio={portfolio}
                            myDid={myDid}
                            setCustodian={setCustodian}
                            relinquishCustody={relinquishCustody}
                            canManipulate={canManipulate}
                        />
                    </li>
                })
        }</ol >
    }
}
