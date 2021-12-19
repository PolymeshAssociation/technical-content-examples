import { Polymesh } from "@polymathnetwork/polymesh-sdk"
import { Identity } from "@polymathnetwork/polymesh-sdk/types"
import { Component } from "react"
import { fetchPortfolioInfoJsons, OnPortfolioInfosChanged } from "../../handlers/portfolios/PortfolioHandlers"
import { assertUnreachable, PortfolioInfoJson } from "../../types"
import { PortfolioJsonInfosView } from "./PortfolioInfoJsonView"
import { NewPortfolioView } from "./PortfolioView"

declare enum PortfolioListType {
    None = "None",
    Mine = "Mine",
    Other = "Other",
    MyCustodied = "MyCustodied"
}

interface PortfolioManagerViewState {
    listType: PortfolioListType
    otherOwner: string
    loadedOtherOwner: string
    myPortfolios: PortfolioInfoJson[]
    otherPortfolios: PortfolioInfoJson[]
    myCustodieds: PortfolioInfoJson[]
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
            listType: PortfolioListType.None,
            otherOwner: "",
            loadedOtherOwner: "",
            myPortfolios: [],
            otherPortfolios: [],
            myCustodieds: [],
        }
    }

    getPortfoliosToShow = (): PortfolioInfoJson[] => {
        switch (this.state.listType) {
            case PortfolioListType.None: return []
            case PortfolioListType.Mine: return this.state.myPortfolios
            case PortfolioListType.Other: return this.state.otherPortfolios
            case PortfolioListType.MyCustodied: return this.state.myCustodieds
            default: assertUnreachable(this.state.listType)
        }
    }
    updateOtherOwner = (e) => this.setState({ otherOwner: e.target.value })

    onLoadMyPortfolios = async () => {
        this.setState({ listType: PortfolioListType.Mine })
        this.setState({ myPortfolios: await this.fetchMyPortfolios() })
    }
    fetchMyPortfolios = async (): Promise<PortfolioInfoJson[]> => {
        const api: Polymesh = await this.props.apiPromise
        const myPortfolios: PortfolioInfoJson[] = await this.fetchPortfolios(await api.getCurrentIdentity())
        this.props.onMyPortfolioInfosChanged(myPortfolios)
        return myPortfolios
    }
    onLoadOtherPortfolios = async () => {
        const loadedOtherOwner: string = this.state.otherOwner
        this.setState({ listType: PortfolioListType.Other })
        this.setState({
            loadedOtherOwner: loadedOtherOwner,
            otherPortfolios: await this.fetchOtherPortfolios()
        })
    }
    fetchOtherPortfolios = async (): Promise<PortfolioInfoJson[]> => {
        const api: Polymesh = await this.props.apiPromise
        const otherOwner: Identity = await api.getIdentity({ did: this.state.otherOwner })
        return this.fetchPortfolios(otherOwner)
    }
    fetchPortfolios = async (owner: Identity): Promise<PortfolioInfoJson[]> =>
        fetchPortfolioInfoJsons(await owner.portfolios.getPortfolios())

    onLoadMyCustodiedPortfolios = async () => {
        this.setState({ listType: PortfolioListType.MyCustodied })
        this.setState({ myCustodieds: await this.fetchMyCustodiedPortfolios() })
    }
    fetchMyCustodiedPortfolios = async (): Promise<PortfolioInfoJson[]> => {
        const api: Polymesh = await this.props.apiPromise
        const me: Identity = await api.getCurrentIdentity()
        return this.fetchCustodiedPortfolios(me)
    }
    fetchCustodiedPortfolios = async (custodian: Identity): Promise<PortfolioInfoJson[]> =>
        fetchPortfolioInfoJsons((await custodian.portfolios.getCustodiedPortfolios()).data)

    onPortfolioInfosChanged = (listType: PortfolioListType) => (changed: PortfolioInfoJson[]) => {
        switch (listType) {
            case PortfolioListType.None: return
            case PortfolioListType.Mine:
                this.setState({ myPortfolios: changed })
                this.props.onMyPortfolioInfosChanged(changed)
                return
            case PortfolioListType.Other:
                this.setState({ otherPortfolios: changed })
                return
            case PortfolioListType.MyCustodied:
                this.setState({ myCustodieds: changed })
                return
            default: assertUnreachable(listType)
        }
    }
    onPortfolioInfoCreated = (created: PortfolioInfoJson) => this.setState((prev: PortfolioManagerViewState) => ({
        myPortfolios: [
            ...prev.myPortfolios,
            created,
        ]
    }))

    render() {
        const { listType, otherOwner, loadedOtherOwner } = this.state
        const { myDid, apiPromise, cardStyle, isWrongStyle, canManipulate } = this.props
        const portfoliosToShow: PortfolioInfoJson[] = this.getPortfoliosToShow()
        const canLoadOther: boolean = listType !== PortfolioListType.Other || otherOwner !== loadedOtherOwner
        return <fieldset className={cardStyle}>
            <legend>Portfolios</legend>

            <div className="submit">
                <button
                    className="submit load-my-portfolios"
                    onClick={this.onLoadMyPortfolios}
                    disabled={listType === PortfolioListType.Mine}>
                    Load my portfolios
                </button>
                &nbsp;
                <button
                    className="submit load-my-custodied-portfolios"
                    onClick={this.onLoadMyCustodiedPortfolios}
                    disabled={listType === PortfolioListType.MyCustodied}>
                    Load my custodied portfolios
                </button>
                <br />
                <button
                    className="submit load-other-portfolios"
                    onClick={this.onLoadOtherPortfolios}
                    disabled={!canLoadOther}>
                    Load portfolios of
                </button>
                &nbsp;
                <input
                    defaultValue={otherOwner}
                    placeholder="0x123"
                    onChange={this.updateOtherOwner}
                />
            </div>

            <fieldset className={cardStyle}>
                <legend>Loaded portfolios</legend>
                <PortfolioJsonInfosView
                    portfolios={portfoliosToShow}
                    onPortfolioInfosChanged={this.onPortfolioInfosChanged(listType)}
                    myDid={myDid}
                    isWrongStyle={isWrongStyle}
                    canManipulate={canManipulate}
                />
            </fieldset>

            <div>See in the authorisations box above<br />for the pending custody authorisation</div>

            <NewPortfolioView
                apiPromise={apiPromise}
                cardStyle={cardStyle}
                canManipulate={canManipulate}
                onPortfolioInfoCreated={this.onPortfolioInfoCreated}
            />

        </fieldset >
    }
}