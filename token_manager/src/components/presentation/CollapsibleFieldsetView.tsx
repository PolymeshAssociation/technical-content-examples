import { Component } from "react";

interface CollapsibleFieldsetViewState {
    collapsed: boolean
}

export interface CollapsibleFieldsetViewProps {
    collapsed: boolean
    legend: Component | string
    className: any
}

export class CollapsibleFieldsetView extends Component<CollapsibleFieldsetViewProps, CollapsibleFieldsetViewState> {
    constructor(props: CollapsibleFieldsetViewProps) {
        super(props)
        this.state = {
            collapsed: props.collapsed,
        }
    }

    toggleContent = () => this.setState((prev: CollapsibleFieldsetViewState) => ({
        collapsed: !prev.collapsed,
    }))

    render() {
        const { collapsed } = this.state
        const { legend, className } = this.props
        const children = this.props.children
        return <fieldset className={className}>
            <legend onClick={this.toggleContent}>{legend}&nbsp;{collapsed ? "➕" : "➖"}</legend>
            {collapsed ? <span>Click legend to expand</span> : children
            }
        </fieldset>
    }
}