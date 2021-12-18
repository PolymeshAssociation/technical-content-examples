import { Polymesh } from "@polymathnetwork/polymesh-sdk";
import { PolymeshError } from "@polymathnetwork/polymesh-sdk/base/PolymeshError";
import { Identity, SecurityToken, TickerReservation } from "@polymathnetwork/polymesh-sdk/types";
import { Component } from "react";
import { TokenInfoJson } from "../../types";

export type OnTickerChanged = (ticker: TickerManagerViewState) => void
export type OnTickerReservationChanged = (reservation: TickerReservation | null) => void

export interface TickerManagerViewState {
    ticker: string
    myReservedTickers: string[]
    myTokenTickers: string[]
    reservation: TickerReservation | null
    fetchTimer: NodeJS.Timeout
}

export interface TickerManagerViewProps {
    token: TokenInfoJson
    cardStyle: any
    apiPromise: Promise<Polymesh>
    onTickerChanged: OnTickerChanged
    onTickerReservationChanged: OnTickerReservationChanged
}

export class TickerManagerView extends Component<TickerManagerViewProps, TickerManagerViewState> {
    constructor(props: TickerManagerViewProps) {
        super(props)
        this.state = {
            ticker: "",
            reservation: null,
            myReservedTickers: [],
            myTokenTickers: [],
            fetchTimer: setTimeout(this.onLoadMyTickers, 100),
        }
    }

    onStateChanged = () => this.props.onTickerChanged(this.state)
    updateTicker = (ticker: string) => {
        const { loadReservation } = this
        this.setState(
            (prev: TickerManagerViewState) => {
                if (prev.fetchTimer !== null) clearTimeout(prev.fetchTimer)
                return {
                    ...prev,
                    ticker: ticker,
                    fetchTimer: setTimeout(loadReservation, 1000)
                }
            },
            this.onStateChanged)
    }
    onUpdateTicker = (e) => this.updateTicker(e.target.value)
    onLoadMyTickers = async () => {
        const api: Polymesh = await this.props.apiPromise
        const me: Identity = await api.getCurrentIdentity()
        const myReservations: TickerReservation[] = await api.getTickerReservations({ owner: me });
        const myReservedTickers: string[] = myReservations.map((element: TickerReservation) => element.ticker)
        const myTokens: SecurityToken[] = await api.getSecurityTokens({ owner: me })
        const myTokenTickers: string[] = myTokens.map((element: SecurityToken) => element.ticker)
        const ticker: string = [...myReservedTickers, ...myTokenTickers][0] ?? ""
        this.setState({
            myReservedTickers: myReservedTickers,
            myTokenTickers: myTokenTickers,
            ticker: ticker,
        })
    }
    onReserveTicker = async () => {
        const api: Polymesh = await this.props.apiPromise
        await this.props.onTickerReservationChanged(await (await api.reserveTicker({ ticker: this.state.ticker })).run())
    }
    loadReservation = async () => {
        this.setState({ fetchTimer: null })
        const api: Polymesh = await this.props.apiPromise
        try {
            await this.props.onTickerReservationChanged(await api.getTickerReservation({ ticker: this.state.ticker }))
        } catch (e) {
            if (!(e instanceof PolymeshError)) throw e
            await this.props.onTickerReservationChanged(null)
        }
    }

    render() {
        const { myReservedTickers, myTokenTickers, reservation, fetchTimer } = this.state
        const { token, cardStyle } = this.props
        const canReserve = reservation === null && token.current === null
        return <fieldset className={cardStyle}>
            <legend>What ticker do you want to manage?</legend>

            <div>
                <input
                    name="ticker"
                    id="ticker"
                    type="text"
                    placeholder="ACME"
                    value={this.state.ticker}
                    onChange={this.onUpdateTicker}
                />&nbsp;
                <span>{fetchTimer ? "⏳" : " "}</span>
            </div>
            <div>
                <select
                    name="myTickers"
                    defaultValue={this.state.ticker}
                    onChange={this.onUpdateTicker}>
                    <option value="reservedTickers" key="reservedTickers" disabled={true}>Reserved tickers</option>
                    {myReservedTickers.map((ticker: string) => <option value={ticker} key={ticker}>{ticker}</option>)}
                    <option value="createdTokens" key="createdTokens" disabled={true}>Created tokens</option>
                    {myTokenTickers.map((ticker: string) => <option value={ticker} key={ticker}>{ticker}</option>)}
                </select>
                &nbsp;
                <button
                    className="submit my-tickers"
                    onClick={this.onLoadMyTickers}>
                    Load my tickers
                </button>
            </div>
            <div className="submit">
                <button
                    className="submit reservation"
                    onClick={this.onReserveTicker}
                    disabled={!canReserve}>
                    Reserve
                </button>
            </div>

        </fieldset>
    }
}
