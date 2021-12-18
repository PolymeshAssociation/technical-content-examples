import { DefaultPortfolio, NumberedPortfolio, RenamePortfolioParams } from "@polymathnetwork/polymesh-sdk/internal";
import { Component } from "react";
import { isNumberedPortfolio, PortfolioInfoJson } from "../../types";
import { DateTimeEntryView } from "../elements/DateTimeEntry";
import { EventIdentifierView } from "../elements/EventIdentifierView";
import { PortfolioView } from "./PortfolioView";

export type DeletePortfolio = (portfolio: NumberedPortfolio) => Promise<void>
export type ModifyNamePortfolio = (portfolio: NumberedPortfolio, params: RenamePortfolioParams) => Promise<NumberedPortfolio>
export type SetCustodian = (portfolio: DefaultPortfolio | NumberedPortfolio, custodian: string) => Promise<void>
export type QuitCustody = (portfolio: DefaultPortfolio | NumberedPortfolio) => Promise<void>

interface PortfolioInfoJsonViewState {
    newCustodian: string
    custodianExpiry: Date | null
    newName: string
}

export interface PortfolioInfoJsonViewProps {
    portfolio: PortfolioInfoJson
    myDid: string
    modifyName: ModifyNamePortfolio,
    setCustodian: SetCustodian
    quitCustody: QuitCustody
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

    onUpdateNewCustodian = (e) => this.setState({ newCustodian: e.target.value })
    onNewName = (e) => this.setState({ newName: e.target.value })
    onModifyName = (portfolio: DefaultPortfolio | NumberedPortfolio) =>
        async () => isNumberedPortfolio(portfolio) ? this.props.modifyName(portfolio, { name: this.state.newName }) : Promise.resolve()
    onSetCustodian = (portfolio: PortfolioInfoJson) => async () => this.props.setCustodian(portfolio.original, this.state.newCustodian)
    onCustodianExpiryChanged = (expiry: Date) => this.setState({ custodianExpiry: expiry })
    onQuitCustody = (portfolio: PortfolioInfoJson) => async () => this.props.quitCustody(portfolio.original)

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
                    onClick={this.onModifyName(portfolio.original)}
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
                    onClick={this.onSetCustodian(portfolio)}
                    disabled={!canClickSetCustody}>
                    Set
                </button>
                &nbsp;
                <button
                    className="submit unset-custodian"
                    onClick={this.onQuitCustody(portfolio)}
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
    modifyName: ModifyNamePortfolio,
    deletePortfolio: DeletePortfolio
    setCustodian: SetCustodian
    quitCustody: QuitCustody
    isWrongStyle: any
    canManipulate: boolean
}

export class PortfolioJsonInfosView extends Component<PortfolioJsonInfosViewProps> {

    onDelete = (portfolio: DefaultPortfolio | NumberedPortfolio) =>
        async () => (isNumberedPortfolio(portfolio) ? this.props.deletePortfolio(portfolio) : Promise.resolve())

    render() {
        const {
            portfolios,
            myDid,
            modifyName,
            setCustodian,
            quitCustody,
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
                        {isNumberedPortfolio(original) ? "Numbered" : "Default"}&nbsp;Portfolio:&nbsp;
                        <button
                            className="submit delete-portfolio"
                            onClick={this.onDelete(original)}
                            disabled={!canManipulate || !isNumbered}>
                            Delete
                        </button>
                        <PortfolioInfoJsonView
                            portfolio={portfolio}
                            myDid={myDid}
                            modifyName={modifyName}
                            setCustodian={setCustodian}
                            quitCustody={quitCustody}
                            isWrongStyle={isWrongStyle}
                            canManipulate={canManipulate}
                        />
                    </li>
                })
        }</ol >
    }
}
