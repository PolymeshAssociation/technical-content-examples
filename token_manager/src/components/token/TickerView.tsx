import { Polymesh } from "@polymathnetwork/polymesh-sdk";
import { PolymeshError } from "@polymathnetwork/polymesh-sdk/base/PolymeshError";
import { ReserveTickerParams } from "@polymathnetwork/polymesh-sdk/internal";
import { Identity, SecurityToken, TickerReservation } from "@polymathnetwork/polymesh-sdk/types";
import { Component } from "react";
import { fetchReservationInfoJson, OnReservationInfoChanged, OnTickerChanged } from "../../handlers/token/ReservationHandlers";
import { fetchTokenInfoJson, OnTokenInfoChanged } from "../../handlers/token/TokenHandlers";
import { getEmptyReservation, getEmptyTokenInfoJson, ReservationInfoJson, TokenInfoJson } from "../../types";

interface TickerManagerViewState {
    ticker: string
    myReservedTickers: string[]
    myTokenTickers: string[]
    fetchTimer: NodeJS.Timeout | null
}

export interface TickerManagerViewProps {
    reservation: ReservationInfoJson
    token: TokenInfoJson
    cardStyle: any
    apiPromise: Promise<Polymesh>
    onTickerChanged: OnTickerChanged
    onReservationInfoChanged: OnReservationInfoChanged
    onTokenInfoChanged: OnTokenInfoChanged
}

export class TickerManagerView extends Component<TickerManagerViewProps, TickerManagerViewState> {
    constructor(props: TickerManagerViewProps) {
        super(props)
        this.state = {
            ticker: "",
            myReservedTickers: [],
            myTokenTickers: [],
            fetchTimer: null,
        }
    }

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
    onStateChanged = () => this.props.onTickerChanged(this.state.ticker)
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
    onReserveTicker = async () => this.reserveTicker()
    reserveTicker = async (): Promise<ReservationInfoJson> => {
        const api: Polymesh = await this.props.apiPromise
        const reserved: TickerReservation = await (await api.reserveTicker(this.getReserveTickerParams())).run()
        const reservedInfo: ReservationInfoJson = await fetchReservationInfoJson(reserved)
        this.props.onReservationInfoChanged(reservedInfo)
        return reservedInfo
    }
    getReserveTickerParams = (): ReserveTickerParams => ({ ticker: this.state.ticker })
    loadReservation = async () => {
        this.setState({ fetchTimer: null })
        const api: Polymesh = await this.props.apiPromise
        try {
            const reservation: TickerReservation = await api.getTickerReservation({ ticker: this.state.ticker })
            this.props.onReservationInfoChanged(await fetchReservationInfoJson(reservation))
            this.props.onTokenInfoChanged(getEmptyTokenInfoJson())
        } catch (e) {
            if (!(e instanceof PolymeshError)) throw e
            this.props.onReservationInfoChanged(getEmptyReservation())
            await this.loadToken()
        }
    }
    loadToken = async () => {
        const api: Polymesh = await this.props.apiPromise
        try {
            const securityToken: SecurityToken = await api.getSecurityToken({ ticker: this.state.ticker })
            this.props.onTokenInfoChanged(await fetchTokenInfoJson(securityToken))
        } catch (e) {
            if (!(e instanceof PolymeshError)) throw e
            this.props.onTokenInfoChanged(getEmptyTokenInfoJson())
        }
    }

    render() {
        const { myReservedTickers, myTokenTickers, fetchTimer } = this.state
        const { reservation, token, cardStyle } = this.props
        const canReserve = reservation.current === null && token.current === null
        return <fieldset className={cardStyle}>
            <legend>What ticker do you want to manage?</legend>

            <div>
                <input
                    name="ticker"
                    id="ticker"
                    type="text"
                    placeholder="ACME"
                    defaultValue={this.state.ticker}
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
