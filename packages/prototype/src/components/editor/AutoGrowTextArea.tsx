import { TextareaHTMLAttributes, forwardRef } from 'react';
import './AutoGrowTextArea.css';

interface AutoGrowTextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
    value: string;                      // Current value
    onChange: (value: string) => void;  // Change handler
    borderless?: boolean;               // Borderless variant for styled containers
    onFocus?: () => void;               // Focus handler
    onBlur?: () => void;                // Blur handler
}

export const AutoGrowTextArea = forwardRef<HTMLTextAreaElement, AutoGrowTextAreaProps>(
    function AutoGrowTextarea(
        { value, onChange, borderless = false, className = '', ...props },
        ref
    ) {
        return (
            <div className={`auto-grow-textarea ${borderless ? 'auto-grow-textarea--borderless' : ''} ${className}`}>
                {/* Hidden sizer that mirrors content to calculate height */}
                <div
                    className="auto-grow-textarea__sizer"
                    aria-hidden="true"
                >
                    {/* Add a space to ensure empty content still has height */}
                    {value || props.placeholder || ' '}
                    {/* Extra line for cursor room */}
                    {'\n'}
                </div>

                <textarea
                    ref={ref}
                    className="auto-grow-textarea__input"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    {...props}
                />
            </div>
        );
    }
);