import { Component } from "react";
import { Getter, ReservationInfoJson } from "../../types";

export type WorkWithTicker = (ticker: string) => Promise<void>

const tickerKey = "ticker"

interface TickerViewState {
    [tickerKey]: string
}

export interface TickerViewProps {
    myTickers: string[]
    reservation: ReservationInfoJson,
    cardStyle: any
    loadMyTickers: Getter<void>
    loadTicker: WorkWithTicker
    reserveTicker: WorkWithTicker
}

export class TickerManagerView extends Component<TickerViewProps, TickerViewState> {
    constructor(props: TickerViewProps) {
        super(props)
        this.state = {
            [tickerKey]: "",
        }
    }

    updateTicker = async (e) => {
        const ticker: string = e.target.value
        this.setState({ [tickerKey]: ticker })
        if (ticker !== "") await this.props.loadTicker(ticker)
    }

    onMyTickerSelected = async (e) => {
        await this.props.loadTicker(e.target.value)
    }

    onReserveTicker = async (e) => {
        await this.props.reserveTicker(this.state.ticker)
    }

    render() {
        const {
            myTickers,
            reservation,
            cardStyle,
            loadMyTickers,
        } = this.props
        return <fieldset className={cardStyle}>
            <legend>What ticker do you want to manage?</legend>

            <div>
                <input
                    name="ticker"
                    id="ticker"
                    type="text"
                    placeholder="ACME"
                    defaultValue={this.state.ticker}
                    onChange={this.updateTicker}
                />
            </div>
            <div>
                <select
                    name="myTickers"
                    defaultValue={this.state.ticker}
                    onChange={this.onMyTickerSelected}>
                    <option value="" key="Select 1" disabled={true}>Select 1</option>
                    {myTickers.map((myTicker: string) => <option value={myTicker} key={myTicker}>{myTicker}</option>)}
                </select>
                &nbsp;
                <button
                    className="submit my-tickers"
                    onClick={loadMyTickers}>
                    Load my tickers
                </button>
            </div>
            <div className="submit">
                <button
                    className="submit reservation"
                    onClick={this.onReserveTicker}
                    disabled={reservation.current !== null}>
                    Reserve
                </button>
            </div>

        </fieldset>
    }
}
