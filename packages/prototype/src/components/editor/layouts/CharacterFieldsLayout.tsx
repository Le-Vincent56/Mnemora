import { EditorField } from '../EditorField';
import { EditorTextArea } from '../EditorTextArea';
import './TypeLayouts.css';

interface CharacterFieldsLayoutProps {
    fields: Record<string, string>;
    onChange: (field: string, value: string) => void;
    focusedSection: string | null;
    onFocusChange: (section: string | null) => void;
}

const FIELD_CONFIG = [
    {
        name: 'appearance',
        label: 'Appearance',
        placeholder: 'What catches the eye first...',
        hint: 'Physical traits, clothing, distinctive features'
    },
    {
        name: 'personality',
        label: 'Personality',
        placeholder: 'Their core traits and behaviors...',
        hint: 'How they act, react, and relate to others'
    },
    {
        name: 'motivation',
        label: 'Motivation',
        placeholder: 'What drives them forward...',
        hint: 'Goals, fears, desires that guide their actions'
    },
    {
        name: 'voiceMannerisms',
        label: 'Voice & Mannerisms',
        placeholder: 'How you roleplay them...',
        hint: 'Speech patterns, gestures, habits to portray'
    },
];

export function CharacterFieldsLayout({
    fields,
    onChange,
    focusedSection,
    onFocusChange,
}: CharacterFieldsLayoutProps) {
    return (
        <div className="type-layout type-layout--character">
            <span className="type-layout__section-label">Character Details</span>

            <div className="type-layout__grid type-layout__grid--2x2">
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
                                entityType="character"
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
