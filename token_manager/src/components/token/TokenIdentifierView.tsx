import { TokenIdentifier, TokenIdentifierType } from "@polymathnetwork/polymesh-sdk/types"
import { Component } from "react"
import { OnTokenIdentifierChanged, OnTokenIdentifiersChanged } from "../../handlers/token/TokenHandlers";
import { EnumSelectView } from "../EnumView";

interface TokenIdentifierViewState {
    type: TokenIdentifierType
    value: string
}

export interface TokenIdentifierViewProps {
    identifier: TokenIdentifier
    hasTitleStyle: any
    canManipulate: boolean
    onChange: OnTokenIdentifierChanged
}

export class TokenIdentifierView extends Component<TokenIdentifierViewProps, TokenIdentifierViewState> {
    constructor(props: TokenIdentifierViewProps) {
        super(props)
        this.state = {
            type: props.identifier.type,
            value: props.identifier.value,
        }
    }

    onStateChanged = () => this.props.onChange({ type: this.state.type, value: this.state.value })
    onTypeChanged = async (e) => this.setState(
        { type: e.target.value },
        this.onStateChanged)
    onValueChanged = (e) => this.setState(
        { value: e.target.value },
        this.onStateChanged)

    render() {
        const { type, value } = this.state
        const { hasTitleStyle, canManipulate } = this.props
        return <div>
            <div>
                <label htmlFor="token-type">
                    <span className={hasTitleStyle} title="Type of the token identifier">Type</span>
                </label>
                <EnumSelectView<TokenIdentifierType>
                    theEnum={TokenIdentifierType}
                    defaultValue={type}
                    onChange={this.onTypeChanged}
                    canManipulate={canManipulate}
                />
            </div>
            <div>
                <label htmlFor="token-value">
                    <span className={hasTitleStyle} title="Value of the token identifier">Value</span>
                </label>
                <input
                    name="token-value"
                    type="text"
                    placeholder="ACME"
                    defaultValue={value}
                    disabled={!canManipulate}
                    onChange={this.onValueChanged}
                />
            </div>
        </div>
    }
}

interface TokenIdentifiersViewState {
    identifiers: TokenIdentifier[]
}

export interface TokenIdentifiersViewProps {
    identifiers: TokenIdentifier[]
    hasTitleStyle: any
    canManipulate: boolean
    onChange: OnTokenIdentifiersChanged
}

export class TokenIdentifiersView extends Component<TokenIdentifiersViewProps, TokenIdentifiersViewState> {
    constructor(props: TokenIdentifiersViewProps) {
        super(props)
        this.state = { identifiers: props.identifiers }
    }

    onStateChanged = () => this.props.onChange(this.state.identifiers)
    onAddTokenIdentifier = () => this.setState(
        (prev: TokenIdentifiersViewState) => ({
            ...prev,
            identifiers: [
                { type: TokenIdentifierType.Cins, value: "" },
                ...prev.identifiers,
            ]
        }),
        this.onStateChanged)
    onTokenIdentifierChanged = (atIndex: number) => (identifier: TokenIdentifier) => this.setState(
        (prev: TokenIdentifiersViewState) => {
            const identifiers = prev.identifiers
            identifiers[atIndex] = identifier
            return { identifiers: identifiers }
        },
        this.onStateChanged)
    onRemoveTokenIdentifier = (atIndex: number) => () => this.setState(
        (prev: TokenIdentifiersViewState) => {
            const identifiers = prev.identifiers
            identifiers.splice(atIndex, 1)
            this.setState({ identifiers: identifiers })
        },
        this.onStateChanged)

    render() {
        const { identifiers } = this.state
        const { hasTitleStyle, canManipulate } = this.props
        const addButton: JSX.Element = <button
            className="submit add-tokenIdentifier"
            onClick={this.onAddTokenIdentifier}
            disabled={!canManipulate}>
            Add identifier
        </button>
        if (identifiers.length === 0) return <div>
            There are no identifiers&nbsp;{addButton}
        </div>
        return <div>
            {addButton}
            <ol>{
                identifiers.map((identifier: TokenIdentifier, index: number) => <li key={index}>
                    <button
                        className="submit remote-tokenIdentifier"
                        onClick={this.onRemoveTokenIdentifier(index)}
                        disabled={!canManipulate}>
                        Remove
                    </button>
                    <TokenIdentifierView
                        identifier={identifier}
                        hasTitleStyle={hasTitleStyle}
                        canManipulate={canManipulate}
                        onChange={this.onTokenIdentifierChanged(index)}
                    />
                </li>)
            }</ol>
        </div>
    }
}
