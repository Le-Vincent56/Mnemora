import { EditorTextArea } from '../EditorTextArea';
import './TypeLayouts.css';

interface NoteFieldsLayoutProps {
    fields: Record<string, string>;
    onChange: (field: string, value: string) => void;
    focusedSection: string | null;
    onFocusChange: (section: string | null) => void;
}

export function NoteFieldsLayout({
    fields,
    onChange,
    // Note layout has only one field, so dimming isn't applicable
    focusedSection: _focusedSection,
    onFocusChange,
}: NoteFieldsLayoutProps) {
    return (
        <div className="type-layout type-layout--note">
            {/* No section label for notes - pure writing surface */}
            <div className="type-layout__canvas">
                <EditorTextArea
                    value={fields.content || ''}
                    onChange={(value) => onChange('content', value)}
                    entityType="note"
                    field="content"
                    placeholder="Your thoughts, ideas, and notes..."
                    onFocus={() => onFocusChange('content')}
                    onBlur={() => onFocusChange(null)}
                />
            </div>
        </div>
    );
}
