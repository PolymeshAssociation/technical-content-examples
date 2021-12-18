import { EventIdentifier } from "@polymathnetwork/polymesh-sdk/types";
import { Component } from "react";

export interface EventIdentifierProps {
    eventId: EventIdentifier | null
}

export class EventIdentifierView extends Component<EventIdentifierProps> {
    render() {
        const { eventId } = this.props
        if (eventId === null) return <span>null</span>
        return <ul>
            <li key="date">Block date:&nbsp;{eventId.blockDate.toISOString()}</li>
            <li key="number">Block number:&nbsp;{eventId.blockNumber.toString(10)}</li>
            <li key="eventIndex">Event index:&nbsp;{eventId.eventIndex}</li>
        </ul>
    }
}