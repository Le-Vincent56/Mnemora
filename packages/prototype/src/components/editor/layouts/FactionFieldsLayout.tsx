import { EditorField } from '../EditorField';
import { EditorTextArea } from '../EditorTextArea';
import './TypeLayouts.css';

interface FactionFieldsLayoutProps {
    fields: Record<string, string>;
    onChange: (field: string, value: string) => void;
    focusedSection: string | null;
    onFocusChange: (section: string | null) => void;
}

// Ordered by faction "anatomy": beliefs → goals → resources → structure
const FIELD_CONFIG = [
    {
        name: 'ideology',
        label: 'Ideology',
        placeholder: 'What they believe in...',
        hint: 'Core beliefs and values driving the faction'
    },
    {
        name: 'goals',
        label: 'Goals',
        placeholder: 'What they work toward...',
        hint: 'Short-term objectives and long-term ambitions'
    },
    {
        name: 'resources',
        label: 'Resources',
        placeholder: 'Their assets and strengths...',
        hint: 'Money, people, influence, special capabilities'
    },
    {
        name: 'structure',
        label: 'Structure',
        placeholder: 'How they are organized...',
        hint: 'Hierarchy, key roles, how decisions are made'
    },
];

export function FactionFieldsLayout({
    fields,
    onChange,
    focusedSection,
    onFocusChange,
}: FactionFieldsLayoutProps) {
    return (
        <div className="type-layout type-layout--faction">
            <span className="type-layout__section-label">Faction Anatomy</span>

            <div className="type-layout__cascade">
                {FIELD_CONFIG.map(({ name, label, placeholder, hint }, index) => (
                    <div
                        key={name}
                        className={`type-layout__field type-layout__field--cascade ${focusedSection && focusedSection !== name
                                ? 'type-layout__field--dimmed'
                                : ''
                            }`}
                        style={{ '--cascade-depth': index } as React.CSSProperties}
                    >
                        <EditorField label={label} hint={hint}>
                            <EditorTextArea
                                value={fields[name] || ''}
                                onChange={(value) => onChange(name, value)}
                                entityType="faction"
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
