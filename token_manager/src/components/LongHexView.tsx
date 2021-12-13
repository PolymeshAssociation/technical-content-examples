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

export interface LongViewProps extends BasicLongViewProps {
    left: number
    right: number
}

export class LongView extends Component<LongViewProps> {
    render() {
        const { value, left, right, lut } = this.props
        if (typeof value === "undefined") return <span>undefined</span>
        if (value === null) return <span>null</span>
        const lookedUp = (lut ?? {})[value]
        if (typeof lookedUp === "string") return <span>{lookedUp}</span>
        const first: string = value.slice(0, left)
        const last: string = value.slice(-right)
        return <span>{first}...{last}</span>
    }
}
