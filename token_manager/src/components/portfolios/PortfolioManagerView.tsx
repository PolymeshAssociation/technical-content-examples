import { Polymesh } from "@polymathnetwork/polymesh-sdk"
import { DefaultPortfolio, Identity, NumberedPortfolio } from "@polymathnetwork/polymesh-sdk/types"
import { ChangeEvent, Component, KeyboardEvent } from "react"
import { fetchPortfolioInfoJsons, OnPortfolioPicked } from "../../handlers/portfolios/PortfolioHandlers"
import { ApiGetter, assertUnreachable, PortfolioInfoJson } from "../../types"
import { showFetchCycle, ShowFetchCycler } from "../../ui-helpers"
import { CollapsibleFieldsetView } from "../presentation/CollapsibleFieldsetView"
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
    apiGetter: ApiGetter
    myDid: string
    pickedPortfolio: PortfolioInfoJson
    cardStyle: any
    isWrongStyle: any
    onPortfolioPicked: OnPortfolioPicked
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
    onOtherOwnerChanged = (e: ChangeEvent<HTMLInputElement>) => this.setState({ otherOwner: e.target.value })
    onOtherOwnerKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" ? this.onLoadOtherPortfolios() : ""

    onLoadMyPortfolios = async () => {
        this.setState({ listType: PortfolioListType.Mine })
        this.setState({ myPortfolios: await this.fetchMyPortfolios() })
    }
    fetchMyPortfolios = async (): Promise<PortfolioInfoJson[]> => {
        const api: Polymesh = await this.props.apiGetter()
        const cycler: ShowFetchCycler = showFetchCycle("My identity")
        const me: Identity = await api.getCurrentIdentity()
        cycler.fetched()
        return await this.fetchPortfolios(me)
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
        const api: Polymesh = await this.props.apiGetter()
        const cycler: ShowFetchCycler = showFetchCycle("Portfolio owner identity")
        const otherOwner: Identity = await api.getIdentity({ did: this.state.otherOwner })
        cycler.fetched()
        return this.fetchPortfolios(otherOwner)
    }
    fetchPortfolios = async (owner: Identity): Promise<PortfolioInfoJson[]> => {
        const cyclerPort: ShowFetchCycler = showFetchCycle(`Portfolios of ${owner.did}`)
        const portfolios: (DefaultPortfolio | NumberedPortfolio)[] = await owner.portfolios.getPortfolios()
        cyclerPort.fetched()
        const cyclerInfo: ShowFetchCycler = showFetchCycle("Infos of portfolios")
        const infos = await fetchPortfolioInfoJsons(portfolios)
        cyclerInfo.fetched()
        return infos
    }

    onLoadMyCustodiedPortfolios = async () => {
        this.setState({ listType: PortfolioListType.MyCustodied })
        this.setState({ myCustodieds: await this.fetchMyCustodiedPortfolios() })
    }
    fetchMyCustodiedPortfolios = async (): Promise<PortfolioInfoJson[]> => {
        const api: Polymesh = await this.props.apiGetter()
        const cycler: ShowFetchCycler = showFetchCycle("Your current identity")
        const me: Identity = await api.getCurrentIdentity()
        cycler.fetched()
        return this.fetchCustodiedPortfolios(me)
    }
    fetchCustodiedPortfolios = async (custodian: Identity): Promise<PortfolioInfoJson[]> => {
        const cyclerPort: ShowFetchCycler = showFetchCycle("My custodied portfolios")
        const custodied: (DefaultPortfolio | NumberedPortfolio)[] = (await custodian.portfolios.getCustodiedPortfolios()).data
        cyclerPort.fetched()
        const cyclerInfo: ShowFetchCycler = showFetchCycle("Custodied portfolios infos")
        const infos: PortfolioInfoJson[] = await fetchPortfolioInfoJsons(custodied)
        cyclerInfo.fetched()
        return infos
    }

    onPortfolioInfosChanged = (listType: PortfolioListType) => (changed: PortfolioInfoJson[]) => {
        switch (listType) {
            case PortfolioListType.None: break
            case PortfolioListType.Mine:
                this.setState({ myPortfolios: changed })
                break
            case PortfolioListType.Other:
                this.setState({ otherPortfolios: changed })
                break
            case PortfolioListType.MyCustodied:
                this.setState({ myCustodieds: changed })
                break
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
        const { myDid, pickedPortfolio, apiGetter, cardStyle, isWrongStyle, canManipulate } = this.props
        const portfoliosToShow: PortfolioInfoJson[] = this.getPortfoliosToShow()
        const canLoadOther: boolean = listType !== PortfolioListType.Other || otherOwner !== loadedOtherOwner
        return <CollapsibleFieldsetView
            className={cardStyle}
            legend="Portfolios"
            collapsed={true}>

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
                    onChange={this.onOtherOwnerChanged}
                    onKeyDown={this.onOtherOwnerKeyDown}
                />
            </div>

            <CollapsibleFieldsetView
                className={cardStyle}
                legend="Loaded portfolios"
                collapsed={false}>

                <PortfolioJsonInfosView
                    portfolios={portfoliosToShow}
                    myDid={myDid}
                    pickedPortfolio={pickedPortfolio}
                    onPortfolioInfosChanged={this.onPortfolioInfosChanged(listType)}
                    onPortfolioPicked={this.props.onPortfolioPicked}
                    isWrongStyle={isWrongStyle}
                    canManipulate={canManipulate}
                />
            </CollapsibleFieldsetView>

            <div>See in the authorisations box above<br />for the pending custody authorisation</div>

            <NewPortfolioView
                apiGetter={apiGetter}
                cardStyle={cardStyle}
                canManipulate={canManipulate}
                onPortfolioInfoCreated={this.onPortfolioInfoCreated}
            />

        </CollapsibleFieldsetView >
    }
}