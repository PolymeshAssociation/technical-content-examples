import { Polymesh } from "@polymathnetwork/polymesh-sdk"
import { DefaultPortfolio, Identity, NumberedPortfolio } from "@polymathnetwork/polymesh-sdk/types"
import { Component } from "react"
import { fetchPortfolioInfoJsons, OnPortfolioInfosChanged } from "../../handlers/portfolios/PortfolioHandlers"
import { PortfolioInfoJson } from "../../types"
import { PortfolioJsonInfosView } from "./PortfolioInfoJsonView"
import { NewPortfolioView } from "./PortfolioView"

declare enum PortfolioListType {
    Mine = "Mine",
    Other = "Other",
    MyCustodied = "MyCustodied"
}

interface PortfolioManagerViewState {
    listType: PortfolioListType
    otherOwner: string
    portfolios: PortfolioInfoJson[]
}

export interface PortfolioManagerViewProps {
    apiPromise: Promise<Polymesh>
    myDid: string
    cardStyle: any
    isWrongStyle: any
    onMyPortfolioInfosChanged: OnPortfolioInfosChanged
    canManipulate: boolean
}

export class PortfolioManagerView extends Component<PortfolioManagerViewProps, PortfolioManagerViewState> {
    constructor(props: PortfolioManagerViewProps) {
        super(props)
        this.state = {
            listType: PortfolioListType.Mine,
            otherOwner: "",
            portfolios: [],
        }
    }

    updateOtherOwner = (e) => this.setState({ otherOwner: e.target.value })

    onLoadMyPortfolios = async () => {
        this.setState({ listType: PortfolioListType.Mine })
        await this.loadMyPortfolios()
    }
    loadMyPortfolios = async (): Promise<PortfolioInfoJson[]> => {
        const api: Polymesh = await this.props.apiPromise
        const me: Identity = await api.getCurrentIdentity()
        const myPortfolios: PortfolioInfoJson[] = await this.loadPortfolios(me)
        this.props.onMyPortfolioInfosChanged(myPortfolios)
        return myPortfolios
    }
    onLoadOtherPortfolios = async () => {
        this.setState({ listType: PortfolioListType.Other })
        await this.loadOtherPortfolios()
    }
    loadOtherPortfolios = async (): Promise<PortfolioInfoJson[]> => {
        const api: Polymesh = await this.props.apiPromise
        const other: Identity = await api.getIdentity({ did: this.state.otherOwner })
        return this.loadPortfolios(other)
    }
    loadPortfolios = async (otherOwner: Identity): Promise<PortfolioInfoJson[]> => {
        const portfolios: (DefaultPortfolio | NumberedPortfolio)[] = await otherOwner.portfolios.getPortfolios()
        const infos: PortfolioInfoJson[] = await fetchPortfolioInfoJsons(portfolios)
        return infos
    }

    onLoadMyCustodiedPortfolios = async () => {
        this.setState({ listType: PortfolioListType.MyCustodied })
        await this.loadMyCustodiedPortfolios();
    }
    loadMyCustodiedPortfolios = async () => {
        const api: Polymesh = await this.props.apiPromise
        const me: Identity = await api.getCurrentIdentity()
        await this.loadCustodiedPortfolios(me)
    }
    loadCustodiedPortfolios = async (custodian: Identity): Promise<(DefaultPortfolio | NumberedPortfolio)[]> => {
        const portfolios: (DefaultPortfolio | NumberedPortfolio)[] = (await custodian.portfolios.getCustodiedPortfolios()).data
        return portfolios
    }

    onPortfolioInfosChanged = (changed: PortfolioInfoJson[]) => {
        this.setState({ portfolios: changed })
        if (this.state.listType === PortfolioListType.Mine) this.props.onMyPortfolioInfosChanged(changed)
    }
    onPortfolioInfoCreated = (created: PortfolioInfoJson) => this.setState((prev: PortfolioManagerViewState) => ({
        portfolios: [
            ...prev.portfolios,
            created,
        ]
    }))

    render() {
        const { portfolios } = this.state
        const {
            myDid,
            cardStyle,
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
                    portfolios={portfolios}
                    onPortfolioInfosChanged={this.onPortfolioInfosChanged}
                    myDid={myDid}
                    isWrongStyle={isWrongStyle}
                    canManipulate={canManipulate}
                />
            </fieldset>

            <div>See in the authorisations box above<br />for the pending custody authorisation</div>

            <NewPortfolioView
                apiPromise={this.props.apiPromise}
                cardStyle={cardStyle}
                canManipulate={canManipulate}
                onPortfolioInfoCreated={this.onPortfolioInfoCreated}
            />

        </fieldset>
    }
}