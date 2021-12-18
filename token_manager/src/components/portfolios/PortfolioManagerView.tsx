import { Component } from "react"
import { PortfoliosInfoJson } from "../../types"
import {
    DeletePortfolio,
    ModifyNamePortfolio,
    PortfolioJsonInfosView,
    QuitCustody,
    SetCustodian,
} from "./PortfolioInfoJsonView"
import { CreatePortfolio, NewPortfolioView } from "./PortfolioView"

export type LoadPortfolios = (whose: string) => Promise<void>
export type LoadCustodiedPortfolios = (whose: string) => Promise<void>

interface PortfolioManagerViewState {
    otherOwner: string
}

export interface PortfolioManagerViewProps {
    portfolios: PortfoliosInfoJson
    myDid: string
    cardStyle: any
    loadPortfolios: LoadPortfolios,
    loadCustodiedPortfolios: LoadPortfolios,
    modifyName: ModifyNamePortfolio,
    deletePortfolio: DeletePortfolio
    setCustodian: SetCustodian
    quitCustody: QuitCustody
    createPortfolio: CreatePortfolio
    isWrongStyle: any
    canManipulate: boolean
}

export class PortfolioManagerView extends Component<PortfolioManagerViewProps, PortfolioManagerViewState> {
    constructor(props: PortfolioManagerViewProps) {
        super(props)
        this.state = {
            otherOwner: "",
        }
    }

    updateOtherOwner = (e) => this.setState({ otherOwner: e.target.value })
    onLoadMyPortfolios = (e) => this.props.loadPortfolios(this.props.myDid)
    onLoadOtherPortfolios = (e) => this.props.loadPortfolios(this.state.otherOwner)
    onLoadMyCustodiedPortfolios = (e) => this.props.loadCustodiedPortfolios(this.props.myDid)

    render() {
        const {
            portfolios,
            myDid,
            cardStyle,
            modifyName,
            deletePortfolio,
            setCustodian,
            quitCustody,
            createPortfolio,
            isWrongStyle,
            canManipulate,
        } = this.props
        return <fieldset className={cardStyle}>
            <legend>Portfolios</legend>

            <div className="submit">
                <button
                    className="submit load-my-portfolios"
                    onClick={this.onLoadMyPortfolios}>
                    Load my portfolios
                </button>
                &nbsp;
                <button
                    className="submit load-my-custodied-portfolios"
                    onClick={this.onLoadMyCustodiedPortfolios}>
                    Load my custodied portfolios
                </button>
                <br />
                <button
                    className="submit load-portfolios"
                    onClick={this.onLoadOtherPortfolios}>
                    Load portfolios of
                </button>
                &nbsp;
                <input
                    defaultValue={this.state.otherOwner}
                    placeholder="0x123"
                    onChange={this.updateOtherOwner}
                />
            </div>

            <fieldset className={cardStyle}>
                <legend>Loaded portfolios</legend>
                <PortfolioJsonInfosView
                    portfolios={portfolios.details}
                    modifyName={modifyName}
                    deletePortfolio={deletePortfolio}
                    setCustodian={setCustodian}
                    quitCustody={quitCustody}
                    myDid={myDid}
                    isWrongStyle={isWrongStyle}
                    canManipulate={canManipulate}
                />
            </fieldset>

            <div>See in the authorisations box above<br />for the pending custody authorisation</div>

            <NewPortfolioView
                cardStyle={cardStyle}
                canManipulate={canManipulate}
                createPortfolio={createPortfolio}
            />

        </fieldset>
    }
}