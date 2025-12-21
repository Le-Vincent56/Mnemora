import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import './EditorField.css';

interface EditorFieldProps {
    label: string;                      // Field label text
    icon?: LucideIcon;                  // Optional icon component
    variant?: 'default' | 'secrets';    // Variant styling
    hint?: string;                      // Optional hint text below field
    children: ReactNode;                // Field content (input, textarea, etc.)
}

export function EditorField({
    label,
    icon: Icon,
    variant = 'default',
    hint,
    children,
}: EditorFieldProps) {
    return (
        <div className={`editor-field ${variant !== 'default' ? `editor-field--${variant}` : ''}`}>
            <div className="editor-field__header">
                {Icon && (
                    <span className="editor-field__icon">
                        <Icon size={12} />
                    </span>
                )}
                <label className="editor-field__label">{label}</label>
            </div>
            <div className="editor-field__content">
                {children}
            </div>
            {hint && (
                <p className="editor-field__hint">{hint}</p>
            )}
        </div>
    );
}