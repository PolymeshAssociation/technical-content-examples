import { TokenIdentifier, TokenIdentifierType } from "@polymathnetwork/polymesh-sdk/types"
import { Component } from "react"
import { EnumSelectView } from "../EnumView";

export type OnTokenIdentifierChanged = (identifier: TokenIdentifier) => void

const typeKey = "type"
const valueKey = "value"

interface TokenIdentifierViewState {
    [typeKey]: TokenIdentifierType,
    [valueKey]: string,
}

export interface TokenIdentifierViewProps {
    identifier: TokenIdentifier,
    hasTitleStyle: any,
    canManipulate: boolean,
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

    public getIdentifier = () => ({
        type: this.state.type,
        value: this.state.value,
    }) as TokenIdentifier

    updateType = async (e) => {
        const type: TokenIdentifierType = e.target.value
        this.setState({ type: type })
        this.props.onChange({ type: type, value: this.state.value })
    }
    updateValue = (e) => {
        const value: string = e.target.value
        this.setState({ value: value })
        this.props.onChange({ type: this.state.type, value: value })
    }

    render() {
        const { hasTitleStyle, canManipulate } = this.props
        return <div>
            <div>
                <label htmlFor="token-type">
                    <span className={hasTitleStyle} title="Type of the token identifier">Type</span>
                </label>
                <EnumSelectView<TokenIdentifierType>
                    theEnum={TokenIdentifierType}
                    defaultValue={this.state.type}
                    onChange={this.updateType}
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
                    defaultValue={this.state.value}
                    disabled={!canManipulate}
                    onChange={this.updateValue}
                />
            </div>
        </div>
    }
}

export type OnTokenIdentifiersChanged = (identifiers: TokenIdentifier[]) => void

const identifiersKey = "identifiers"

interface TokenIdentifiersViewState {
    [identifiersKey]: TokenIdentifier[],
}

export interface TokenIdentifiersViewProps {
    identifiers: TokenIdentifier[],
    hasTitleStyle: any,
    canManipulate: boolean,
    onChange: OnTokenIdentifiersChanged,
}

export class TokenIdentifiersView extends Component<TokenIdentifiersViewProps, TokenIdentifiersViewState> {
    constructor(props: TokenIdentifiersViewProps) {
        super(props)
        this.state = { identifiers: props.identifiers }
    }

    addTokenIdentifier = () => this.setState((prev: TokenIdentifiersViewState) => {
        const identifiers = [
            { type: TokenIdentifierType.Cins, value: "" },
            ...prev.identifiers,
        ]
        this.props.onChange(identifiers)
        return { identifiers: identifiers }
    })
    onIdentifierChanged = (atIndex: number) =>
        (identifier: TokenIdentifier) =>
            this.setState((prev: TokenIdentifiersViewState) => {
                const identifiers = prev.identifiers
                identifiers[atIndex] = identifier
                this.props.onChange(identifiers)
                return { identifiers: identifiers }
            })
    removeTokenIdentifier = (atIndex: number) =>
        this.setState((prev: TokenIdentifiersViewState) => {
            const identifiers = prev.identifiers
            identifiers.splice(atIndex, 1)
            this.props.onChange(identifiers)
            this.setState({ identifiers: identifiers })
        })

    render() {
        const { hasTitleStyle, canManipulate } = this.props
        return <div>
            <button
                className="submit add-tokenIdentifier"
                onClick={this.addTokenIdentifier}
                disabled={!canManipulate}>
                Add identifier
            </button>

            <ul>{
                this.state.identifiers.map((identifier: TokenIdentifier, index: number) => <li key={index}>
                    <TokenIdentifierView
                        identifier={identifier}
                        hasTitleStyle={hasTitleStyle}
                        canManipulate={canManipulate}
                        onChange={this.onIdentifierChanged(index)}
                    />
                    <button
                        className="submit remote-tokenIdentifier"
                        onClick={() => this.removeTokenIdentifier(index)}
                        disabled={!canManipulate}>
                        Remove the above
                    </button>
                </li>)
            }</ul>
        </div>
    }
}
