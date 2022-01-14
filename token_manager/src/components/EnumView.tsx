import { Component } from "react"

export function presentEnumOptions<EnumType>(theEnum: EnumType): JSX.Element[] {
    const selects: JSX.Element[] = []
    for (const element in theEnum) selects.push(<option
        value={element}
        key={element}>
        {theEnum[element]}
    </option>)
    return selects
}

export interface EnumSelectViewProps<EnumType> {
    theEnum: any
    defaultValue: EnumType
    onChange: ((e: React.ChangeEvent<HTMLSelectElement>) => Promise<void>) | undefined
    canManipulate: boolean
}

export class EnumSelectView<EnumType> extends Component<EnumSelectViewProps<EnumType>> {
    render() {
        const { theEnum, defaultValue, onChange, canManipulate } = this.props
        return <select
            value={defaultValue.toString()}
            onChange={onChange}
            disabled={!canManipulate}>
            {presentEnumOptions(theEnum)}
        </select>
    }
}
