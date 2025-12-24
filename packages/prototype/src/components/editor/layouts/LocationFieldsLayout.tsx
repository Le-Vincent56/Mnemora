import { EditorField } from '../EditorField';
import { EditorTextArea } from '../EditorTextArea';
import './TypeLayouts.css';

interface LocationFieldsLayoutProps {
    fields: Record<string, string>;
    onChange: (field: string, value: string) => void;
    focusedSection: string | null;
    onFocusChange: (section: string | null) => void;
}

// Ordered by GM workflow: atmosphere first (feel), then appearance (see), then features (interact)
const FIELD_CONFIG = [
    {
        name: 'atmosphere',
        label: 'Atmosphere',
        placeholder: 'The mood and feeling of this place...',
        hint: 'What players sense before seeing details'
    },
    {
        name: 'appearance',
        label: 'Appearance',
        placeholder: 'What the eye takes in...',
        hint: 'Visual details, architecture, natural features'
    },
    {
        name: 'notableFeatures',
        label: 'Notable Features',
        placeholder: 'Points of interest to explore...',
        hint: 'Interactive elements, landmarks, hidden areas'
    },
];

export function LocationFieldsLayout({
    fields,
    onChange,
    focusedSection,
    onFocusChange,
}: LocationFieldsLayoutProps) {
    return (
        <div className="type-layout type-layout--location">
            <span className="type-layout__section-label">Location Details</span>

            <div className="type-layout__stack">
                {FIELD_CONFIG.map(({ name, label, placeholder, hint }) => (
                    <div
                        key={name}
                        className={`type-layout__field ${focusedSection && focusedSection !== name
                                ? 'type-layout__field--dimmed'
                                : ''
                            }`}
                    >
                        <EditorField label={label} hint={hint}>
                            <EditorTextArea
                                value={fields[name] || ''}
                                onChange={(value) => onChange(name, value)}
                                entityType="location"
                                field={name}
                                placeholder={placeholder}
                                onFocus={() => onFocusChange(name)}
                                onBlur={() => onFocusChange(null)}
                            />
                        </EditorField>
                    </div>
                ))}
            </div>
        </div>
    );
}
