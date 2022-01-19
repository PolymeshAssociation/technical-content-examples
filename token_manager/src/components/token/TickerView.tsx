import { Polymesh } from "@polymathnetwork/polymesh-sdk";
import { PolymeshError } from "@polymathnetwork/polymesh-sdk/base/PolymeshError";
import { ReserveTickerParams, TransactionQueue } from "@polymathnetwork/polymesh-sdk/internal";
import { SecurityToken, TickerReservation } from "@polymathnetwork/polymesh-sdk/types";
import { Component } from "react";
import { fetchReservationInfoJson, OnReservationInfoChanged, OnTickerChanged } from "../../handlers/token/ReservationHandlers";
import { fetchTokenInfoJson, OnTokenInfoChanged } from "../../handlers/token/TokenHandlers";
import { ApiGetter, getEmptyReservation, getEmptyTokenInfoJson, ReservationInfoJson, TokenInfoJson } from "../../types";
import { showFetchCycle, ShowFetchCycler, showInfoFetched, showRequestCycle, ShowRequestCycler } from "../../ui-helpers";

interface TickerManagerViewState {
    ticker: string
    myReservedTickers: string[]
    myTokenTickers: string[]
    fetchTimer: NodeJS.Timeout | null
}

export interface TickerManagerViewProps {
    reservation: ReservationInfoJson
    token: TokenInfoJson
    myDid: string
    cardStyle: any
    apiGetter: ApiGetter
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
    onUpdateTicker = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => this.updateTicker(e.target.value)
    onLoadMyTickers = async () => {
        const api: Polymesh = await this.props.apiGetter()
        const cyclerRes: ShowFetchCycler = showFetchCycle("Your ticker reservations")
        const myReservations: TickerReservation[] = await api.getTickerReservations({ owner: this.props.myDid });
        cyclerRes.fetched()
        const myReservedTickers: string[] = myReservations.map((element: TickerReservation) => element.ticker)
        const cyclerTok: ShowFetchCycler = showFetchCycle("Your tokens")
        const myTokens: SecurityToken[] = await api.getSecurityTokens({ owner: this.props.myDid })
        cyclerTok.fetched()
        const myTokenTickers: string[] = myTokens.map((element: SecurityToken) => element.ticker)
        const ticker: string = [...myReservedTickers, ...myTokenTickers][0] ?? ""
        this.setState({
            myReservedTickers: myReservedTickers,
            myTokenTickers: myTokenTickers,
            ticker: ticker,
        })
    }
    onReserveTicker = async (): Promise<ReservationInfoJson> => {
        const api: Polymesh = await this.props.apiGetter()
        const cyclerReq: ShowRequestCycler = showRequestCycle("Ticker reservation")
        const queue: TransactionQueue<TickerReservation, TickerReservation> = await api.reserveTicker(this.getReserveTickerParams())
        cyclerReq.running()
        const reserved: TickerReservation = await queue.run()
        cyclerReq.hasRun()
        const cycler: ShowFetchCycler = showFetchCycle("Ticker reservation info")
        const reservedInfo: ReservationInfoJson = await fetchReservationInfoJson(reserved)
        cycler.fetched()
        this.props.onReservationInfoChanged(reservedInfo)
        return reservedInfo
    }
    getReserveTickerParams = (): ReserveTickerParams => ({ ticker: this.state.ticker })
    loadReservation = async () => {
        this.setState({ fetchTimer: null })
        const { ticker } = this.state
        const api: Polymesh = await this.props.apiGetter()
        try {
            const cyclerRes: ShowFetchCycler = showFetchCycle(`Reservation for ticker ${ticker}`)
            const reservation: TickerReservation = await api.getTickerReservation({ ticker: ticker })
            cyclerRes.fetched()
            const cyclerInfo: ShowFetchCycler = showFetchCycle(`Reservation info for ticker ${ticker}`)
            const info: ReservationInfoJson = await fetchReservationInfoJson(reservation)
            cyclerInfo.fetched()
            this.props.onReservationInfoChanged(info)
            this.props.onTokenInfoChanged(getEmptyTokenInfoJson())
        } catch (e) {
            if (!(e instanceof PolymeshError)) throw e
            showInfoFetched(`No reservation for ${ticker}`)
            this.props.onReservationInfoChanged(getEmptyReservation())
            await this.loadToken()
        }
    }
    loadToken = async () => {
        const api: Polymesh = await this.props.apiGetter()
        const { ticker } = this.state
        try {
            const cyclerTok: ShowFetchCycler = showFetchCycle(`Security token of ${ticker}`)
            const securityToken: SecurityToken = await api.getSecurityToken({ ticker: ticker })
            cyclerTok.fetched()
            const cyclerInfo: ShowFetchCycler = showFetchCycle("Token info")
            const info: TokenInfoJson = await fetchTokenInfoJson(securityToken)
            cyclerInfo.fetched()
            this.props.onTokenInfoChanged(info)
        } catch (e) {
            if (!(e instanceof PolymeshError)) throw e
            showInfoFetched(`No security token for ${ticker}`)
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
                    <option
                        value="reservedTickers"
                        key="reservedTickers"
                        disabled={true}>
                        Reserved tickers
                    </option>
                    {
                        myReservedTickers.map((ticker: string) => <option
                            value={ticker}
                            key={ticker}>
                            {ticker}
                        </option>)
                    }
                    <option
                        value="createdTokens"
                        key="createdTokens"
                        disabled={true}>
                        Created tokens
                    </option>
                    {
                        myTokenTickers.map((ticker: string) => <option
                            value={ticker}
                            key={ticker}>
                            {ticker}
                        </option>)
                    }
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
