import { ChangeEvent, Component } from "react"
import { OnValidDateChanged } from "../../handlers/elements/DateTimeEntryHandlers"

export interface DateTimeEntryViewState {
    dateTime: string
    isDateTimeValid: boolean
    hasDateTime: boolean
}

export interface DateTimeEntryViewProps {
    dateTime: Date | null
    isOptional: boolean
    onValidDateChanged: OnValidDateChanged
    isWrongStyle: any
    canManipulate: boolean
}

export class DateTimeEntryView extends Component<DateTimeEntryViewProps, DateTimeEntryViewState> {
    constructor(props: DateTimeEntryViewProps) {
        super(props)
        this.state = {
            dateTime: (props.dateTime ?? new Date()).toISOString(),
            isDateTimeValid: true,
            hasDateTime: !props.isOptional,
        }
    }

    onDateTimeChanged = (e: ChangeEvent<HTMLInputElement>) => {
        const newDate: string = e.target.value
        const isDateTimeValid: boolean = new Date(newDate).toString() !== "Invalid Date"
        this.setState({
            dateTime: e.target.value,
            isDateTimeValid: isDateTimeValid,
        })
        if (isDateTimeValid) this.props.onValidDateChanged(new Date(newDate))
    }
    onHasDateTimeChanged = (e: ChangeEvent<HTMLInputElement>) => this.setState((prev: DateTimeEntryViewState) => {
        const isDateTimeValid: boolean = new Date(prev.dateTime).toString() !== "Invalid Date"
        if (!e.target.checked) this.props.onValidDateChanged(null)
        else if (isDateTimeValid) this.props.onValidDateChanged(new Date(prev.dateTime))
        return { hasDateTime: e.target.checked }
    })
    onNowPicked = () => {
        this.setState({
            dateTime: new Date().toISOString(),
            isDateTimeValid: true,
        })
        this.props.onValidDateChanged(new Date())
    }

    render() {
        const { dateTime, isDateTimeValid, hasDateTime } = this.state
        const { isOptional, isWrongStyle, canManipulate } = this.props
        const canChangePresence: boolean = canManipulate && isOptional
        const canChangeDate = canManipulate && hasDateTime
        const hasDateTimeElem: JSX.Element = <li key="hasDateTime">
            Has it:&nbsp;
            <input
                name="has-date-time"
                type="checkbox"
                defaultChecked={hasDateTime}
                disabled={!canChangePresence}
                onChange={this.onHasDateTimeChanged}
            />
        </li>
        return <ul>
            {isOptional ? hasDateTimeElem : <span></span>}
            <li key="dateTime">
                When:&nbsp;
                <input
                    type="text"
                    className={isDateTimeValid ? "" : isWrongStyle}
                    placeholder={new Date().toISOString()}
                    value={dateTime}
                    disabled={!canChangeDate}
                    onChange={this.onDateTimeChanged}
                />&nbsp;
                <button
                    name="pick-now"
                    className="submit pick-now"
                    disabled={!canChangeDate}
                    onClick={this.onNowPicked}>
                    Pick now
                </button>
            </li>
        </ul>
    }
}

