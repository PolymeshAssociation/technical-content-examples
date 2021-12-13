import { DefaultPortfolio, NumberedPortfolio } from "@polymathnetwork/polymesh-sdk/internal";
import { Component } from "react";
import { isNumberedPortfolio, PortfolioInfoJson } from "../../types";
import { BasicProps } from "../BasicProps";
import { LongHexView } from "../LongHexView";

export type DeletePortfolio = (portfolio: NumberedPortfolio) => Promise<void>
export type SetCustodian = (portfolio: DefaultPortfolio | NumberedPortfolio, custodian: string) => Promise<void>
export type RelinquishCustody = (portfolio: DefaultPortfolio | NumberedPortfolio) => Promise<void>

const newCustodianKey = "newCustodian"

interface PortfolioInfoJsonViewState {
    [newCustodianKey]: string
}

export interface PortfolioInfoJsonViewProps extends BasicProps {
    portfolio: PortfolioInfoJson
    myDid: string
    deletePortfolio: DeletePortfolio
    setCustodian: SetCustodian
    relinquishCustody: RelinquishCustody
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
            deletePortfolio,
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
            <li key="id">
                Id:&nbsp;{id}&nbsp;{(function () {
                    if (!isNumbered) return ""
                    return <button
                        className="submit delete-portfolio"
                        onClick={() => deletePortfolio(original)}
                        disabled={!canManipulate}>
                        Delete
                    </button>
                })()}
            </li>
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

export interface PortfolioJsonInfosViewProps extends BasicProps {
    portfolios: PortfolioInfoJson[]
    myDid: string
    deletePortfolio: DeletePortfolio
    setCustodian: SetCustodian
    relinquishCustody: RelinquishCustody
}

export class PortfolioJsonInfosView extends Component<PortfolioJsonInfosViewProps> {
    render() {
        const {
            portfolios,
            myDid,
            deletePortfolio,
            setCustodian,
            relinquishCustody,
            location,
            canManipulate,
        } = this.props
        if (typeof portfolios === "undefined" || portfolios === null || portfolios.length === 0)
            return <div>There are no portfolios</div>
        return <ul>{
            portfolios
                .map((portfolio: PortfolioInfoJson, index: number) => <li key={index}>
                    Portfolio {index}:&nbsp;
                    <PortfolioInfoJsonView
                        portfolio={portfolio}
                        myDid={myDid}
                        deletePortfolio={deletePortfolio}
                        setCustodian={setCustodian}
                        relinquishCustody={relinquishCustody}
                        location={[...location, index]}
                        canManipulate={canManipulate}
                    />
                </li>)
        }</ul>
    }
}
