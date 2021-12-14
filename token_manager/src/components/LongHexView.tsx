import { Component } from "react"

export interface BasicLongViewProps {
    value: string
    /**
     * Look-up table to replace well-known values.
     */
    lut: { [key: string]: string } | undefined | null
}

export interface LongHexViewProps extends BasicLongViewProps {
}

export class LongHexView extends Component<LongHexViewProps> {
    render() {
        const { value, lut } = this.props
        return <LongView
            value={value}
            left={8}
            right={6}
            lut={lut}
        />
    }
}

interface LongViewState {
    shrink: boolean
}

export interface LongViewProps extends BasicLongViewProps {
    left: number
    right: number
}

export class LongView extends Component<LongViewProps, LongViewState> {
    constructor(props: LongViewProps) {
        super(props)
        this.state = {
            shrink: true
        }
    }

    onClick = (e) => this.setState({ shrink: !this.state.shrink })

    render() {
        const { value, left, right, lut } = this.props
        if (typeof value === "undefined") return <span>undefined</span>
        if (value === null) return <span>null</span>

        if (!this.state.shrink) return <span onClick={this.onClick}>{value}</span>

        const lookedUp = (lut ?? {})[value]
        if (typeof lookedUp === "string") return <span onClick={this.onClick}>{lookedUp}</span>
        const first: string = value.slice(0, left)
        const last: string = value.slice(-right)
        return <span onClick={this.onClick}>{first}...{last}</span>
    }
}
