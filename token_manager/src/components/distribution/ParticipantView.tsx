import { DistributionParticipant } from "@polymathnetwork/polymesh-sdk/types";
import { Component } from "react";
import { IdentityView } from "../identity/IdentityView";

export interface DistributionParticipantViewProps {
    participant: DistributionParticipant
    myDid: string
}

export class DistributionParticipantView extends Component<DistributionParticipantViewProps> {
    render() {
        const {
            participant: {
                identity,
                amount,
                paid,
            },
            myDid,
        } = this.props
        return <ul>
            <li key="identity">Identity:&nbsp;
                <IdentityView
                    value={identity.did}
                    lut={{ [myDid]: "me" }}
                />
            </li>
            <li key="amount">Amount:&nbsp;{amount.toString(10)}</li>
            <li key="paid">Paid:&nbsp;
                <input
                    type="checkbox"
                    checked={paid} />
            </li>
        </ul>
    }
}

export interface DistributionParticipantsViewProps {
    participants: DistributionParticipant[]
    myDid: string
}

export class DistributionParticipantsView extends Component<DistributionParticipantsViewProps> {
    render() {
        const { participants, myDid } = this.props
        if (participants.length === 0) return <div>No participants</div>
        return <ul>{
            participants.map((participant: DistributionParticipant, index: number) => <li key={index}>
                Participant {index}:&nbsp;<DistributionParticipantView
                    participant={participant}
                    myDid={myDid}
                />
            </li>)
        }</ul>
    }
}