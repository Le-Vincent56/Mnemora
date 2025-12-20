import { useState, useRef, TextareaHTMLAttributes } from 'react';
import { PrimerText } from './PrimerText';
import './PrimerTextArea.css';

interface PrimerTextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
    value: string;
    onChange: (value: string) => void;
    entityType: string;
    field: string;
    label?: string;
}

export function PrimerTextArea({
    value,
    onChange,
    entityType,
    field,
    label,
    placeholder,
    ...props
}: PrimerTextAreaProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [primerDismissed, setPrimerDismissed] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const isEmpty = value.trim() === '';
    const showPrimer = isEmpty && isFocused && !primerDismissed;

    const handleFocus = () => {
        setIsFocused(true);
        setPrimerDismissed(false);
    };

    const handleBlur = () => {
        setIsFocused(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value);
        // If user starts typing, primer will naturally hide (isEmpty becomes false)
    };

    return (
        <div className="primer-textarea">
            {label && <label className="primer-textarea__label">{label}</label>}
            <div className="primer-textarea__wrapper">
                <textarea
                    ref={textareaRef}
                    className="primer-textarea__input"
                    value={value}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={showPrimer ? '' : placeholder}
                    {...props}
                />
                <PrimerText
                    entityType={entityType}
                    field={field}
                    isFieldEmpty={isEmpty}
                    isFieldFocused={isFocused}
                    onDismiss={() => setPrimerDismissed(true)}
                />
            </div>
        </div>
    );
}