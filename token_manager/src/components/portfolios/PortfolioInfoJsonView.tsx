import {
    DefaultPortfolio,
    NumberedPortfolio,
    RenamePortfolioParams,
    SetCustodianParams,
} from "@polymathnetwork/polymesh-sdk/internal";
import { Component } from "react";
import { isNumberedPortfolio, PortfolioInfoJson } from "../../types";
import { DateTimeEntryView } from "../elements/DateTimeEntry";
import { EventIdentifierView } from "../elements/EventIdentifierView";
import {
    OnPortfolioInfoChanged,
    OnPortfolioInfosChanged,
    fetchPortfolioInfoJson,
} from "../../handlers/portfolios/PortfolioHandlers";
import { PortfolioView } from "./PortfolioView";

interface PortfolioInfoJsonViewState {
    newName: string
    newCustodian: string
    custodianExpiry: Date | null
}

export interface PortfolioInfoJsonViewProps {
    portfolio: PortfolioInfoJson
    myDid: string
    onPortfolioInfoChanged: OnPortfolioInfoChanged
    isWrongStyle: any
    canManipulate: boolean
}

export class PortfolioInfoJsonView extends Component<PortfolioInfoJsonViewProps, PortfolioInfoJsonViewState> {
    constructor(props: PortfolioInfoJsonViewProps) {
        super(props);
        this.state = {
            newCustodian: props.portfolio.custodian,
            custodianExpiry: new Date(),
            newName: props.portfolio.name,
        }
    }

    onNewName = (e) => this.setState({ newName: e.target.value })
    onModifyName = async () => {
        const portfolio: DefaultPortfolio | NumberedPortfolio = this.props.portfolio.original
        isNumberedPortfolio(portfolio) ? this.modifyName(portfolio, this.getModifyNameParams()) : Promise.resolve()
    }
    modifyName = async (portfolio: NumberedPortfolio, params: RenamePortfolioParams): Promise<PortfolioInfoJson> => {
        const updated: PortfolioInfoJson = await fetchPortfolioInfoJson(await (await portfolio.modifyName(params)).run())
        this.props.onPortfolioInfoChanged(updated)
        return updated
    }
    getModifyNameParams = (): RenamePortfolioParams => ({ name: this.state.newName })

    onUpdateNewCustodian = (e) => this.setState({ newCustodian: e.target.value })
    onCustodianExpiryChanged = (expiry: Date) => this.setState({ custodianExpiry: expiry })
    onSetCustodian = async () => this.setCustodian(this.props.portfolio.original, this.getNewCustodianParams())
    setCustodian = async (portfolio: (DefaultPortfolio | NumberedPortfolio), params: SetCustodianParams): Promise<PortfolioInfoJson> => {
        await (await portfolio.setCustodian(params)).run()
        const updated: PortfolioInfoJson = await fetchPortfolioInfoJson(portfolio)
        this.props.onPortfolioInfoChanged(updated)
        return updated
    }
    getNewCustodianParams = (): SetCustodianParams => ({
        targetIdentity: this.state.newCustodian,
        expiry: this.state.custodianExpiry,
    })

    onQuitCustody = async () => this.quitCustody(this.props.portfolio.original)
    quitCustody = async (portfolio: DefaultPortfolio | NumberedPortfolio): Promise<PortfolioInfoJson> => {
        await (await portfolio.quitCustody()).run()
        const updated: PortfolioInfoJson = await fetchPortfolioInfoJson(portfolio)
        this.props.onPortfolioInfoChanged(updated)
        return updated
    }

    render() {
        const { newCustodian, custodianExpiry, newName } = this.state
        const { portfolio, myDid, isWrongStyle, canManipulate } = this.props
        const isCustodied: boolean = portfolio.original.owner.did !== portfolio.custodian
        const isMine: boolean = portfolio.original.owner.did === myDid
        const isNumbered: boolean = isNumberedPortfolio(portfolio.original)
        const canRename: boolean = canManipulate && isMine && isNumbered
        const canSetCustody: boolean = canManipulate && isMine && !isCustodied
        const canClickSetCustody: boolean = canSetCustody && newCustodian !== myDid
        const canQuit: boolean = canManipulate && isCustodied && portfolio.custodian === myDid
        return <ul>
            <li key="fields">
                Fields:&nbsp;
                <PortfolioView myDid={myDid} portfolio={portfolio.original} />
            </li>
            <li key="name">
                Name:&nbsp;
                <input
                    value={newName}
                    placeholder="My portfolio"
                    onChange={this.onNewName}
                    disabled={!canRename}
                />
                &nbsp;
                <button
                    className="submit rename"
                    onClick={this.onModifyName}
                    disabled={!canRename || portfolio.name === newName}>
                    Modify
                </button>
            </li>
            <li key="exists">
                Exists:&nbsp;
                <input
                    type="checkbox"
                    defaultChecked={portfolio.exists}
                    disabled={true}
                />
            </li>
            <li key="createdAt">
                Created at:&nbsp;
                <EventIdentifierView eventId={portfolio.createdAt}
                />
            </li>
            <li key="custodian">Custodian:&nbsp;
                <input
                    defaultValue={newCustodian}
                    placeholder="0x123"
                    onChange={this.onUpdateNewCustodian}
                    disabled={!canSetCustody}
                />
                &nbsp;
                <button
                    className="submit set-custodian"
                    onClick={this.onSetCustodian}
                    disabled={!canClickSetCustody}>
                    Set
                </button>
                &nbsp;
                <button
                    className="submit unset-custodian"
                    onClick={this.onQuitCustody}
                    disabled={!canQuit}>
                    Quit
                </button>
                <br />
                With expiry: &nbsp;
                <DateTimeEntryView
                    dateTime={custodianExpiry}
                    isOptional={true}
                    validDateChanged={this.onCustodianExpiryChanged}
                    isWrongStyle={isWrongStyle}
                    canManipulate={canManipulate && canSetCustody}
                />
            </li>
        </ul>
    }
}

export interface PortfolioJsonInfosViewProps {
    portfolios: PortfolioInfoJson[]
    myDid: string
    onPortfolioInfosChanged: OnPortfolioInfosChanged
    isWrongStyle: any
    canManipulate: boolean
}

export class PortfolioJsonInfosView extends Component<PortfolioJsonInfosViewProps> {

    onDeletePortfolio = (index: number) => () => {
        const portfolio: DefaultPortfolio | NumberedPortfolio = this.props.portfolios[index].original
        async () => (isNumberedPortfolio(portfolio) ? this.deletePortfolio(portfolio, index) : Promise.resolve())
    }
    deletePortfolio = async (toDelete: NumberedPortfolio, index: number) => {
        await (await toDelete.delete()).run()
        const list: PortfolioInfoJson[] = this.props.portfolios
        list.splice(index, 1)
        this.props.onPortfolioInfosChanged(list)
    }

    onPortfolioInfoChanged = (index: number) => (changed: PortfolioInfoJson) => {
        const list: PortfolioInfoJson[] = this.props.portfolios
        list[index] = changed
        this.props.onPortfolioInfosChanged(list)
    }

    render() {
        const {
            portfolios,
            myDid,
            isWrongStyle,
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
                        {isNumbered ? "Numbered" : "Default"}&nbsp;Portfolio:&nbsp;
                        <button
                            className="submit delete-portfolio"
                            onClick={this.onDeletePortfolio(index)}
                            disabled={!canManipulate || !isNumbered}>
                            Delete
                        </button>
                        <PortfolioInfoJsonView
                            portfolio={portfolio}
                            myDid={myDid}
                            onPortfolioInfoChanged={this.onPortfolioInfoChanged(index)}
                            isWrongStyle={isWrongStyle}
                            canManipulate={canManipulate}
                        />
                    </li>
                })
        }</ol >
    }
}
