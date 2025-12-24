/**
 * ComponentShowcase - Test page for Phase 12d-12f components
 *
 * This page renders all the new session components for visual testing
 * and design review. Access via /#/showcase route.
 */

import { useState } from 'react';
import { SafetyToolQuickRef, SafetyTool } from '../components/session/SafetyToolQuickRef';
import { SafetyToolsIconRailItem } from '../components/session/SafetyToolsIconRailItem';
import { QuickNoteCapture } from '../components/session/QuickNoteCapture';
import { QuickNoteIconRailItem, QuickNote } from '../components/session/QuickNoteIconRailItem';
import { SessionThoughtsSection } from '../components/session/SessionThoughtsSection';
import { StarsAndWishesSection } from '../components/session/StarsAndWishesSection';
import { EntityReferenceSummary, ReferencedEntity } from '../components/session/EntityReferenceSummary';
import './ComponentShowcase.css';

// Mock data
const MOCK_SAFETY_TOOLS: SafetyTool[] = [
    {
        id: 'xcard',
        name: 'X-Card',
        description: 'Any player can "X" a scene to immediately pause, skip, or fade-to-black — no explanation needed.'
    },
    {
        id: 'lines',
        name: 'Lines & Veils',
        description: 'Define content that should never appear (Lines) or happen off-screen (Veils).',
        details: 'Lines: Harm to children, Sexual assault. Veils: Graphic torture, Explicit romance.'
    },
    {
        id: 'opendoor',
        name: 'Open Door',
        description: 'Anyone can step away from the table at any time. No questions asked, no pressure to explain.'
    }
];

const MOCK_QUICK_NOTES: QuickNote[] = [
    { id: '1', content: 'Player asked about the prophecy — need to prep!', timestamp: new Date(Date.now() - 1000 * 60 * 5) },
    { id: '2', content: 'Aldric discovered the secret passage', timestamp: new Date(Date.now() - 1000 * 60 * 12) },
];

const MOCK_ENTITIES: ReferencedEntity[] = [
    { id: '1', name: 'Aldric the Bold', type: 'character', accessCount: 5 },
    { id: '2', name: 'Elena Nightwhisper', type: 'character', accessCount: 3 },
    { id: '3', name: 'The Stranger', type: 'character', accessCount: 1 },
    { id: '4', name: 'The Broken Spire', type: 'location', accessCount: 4 },
    { id: '5', name: 'Thornhaven', type: 'location', accessCount: 2 },
    { id: '6', name: 'The Iron Pact', type: 'faction', accessCount: 2 },
];

export function ComponentShowcase() {
    // Phase 12d state
    const [safetyModalOpen, setSafetyModalOpen] = useState(false);

    // Phase 12e state
    const [quickNotes, setQuickNotes] = useState<QuickNote[]>(MOCK_QUICK_NOTES);
    const [quickNoteOpen, setQuickNoteOpen] = useState(false);

    // Phase 12f state
    const [reflection, setReflection] = useState('');
    const [stars, setStars] = useState<string[]>(['The puzzle in the crypt was really engaging']);
    const [wishes, setWishes] = useState<string[]>(['More roleplay with the NPCs in Thornhaven']);

    const handleSaveNote = (content: string, timestamp: Date) => {
        setQuickNotes(prev => [...prev, {
            id: String(Date.now()),
            content,
            timestamp
        }]);
    };

    const handleRemoveNote = (id: string) => {
        setQuickNotes(prev => prev.filter(n => n.id !== id));
    };

    return (
        <div className="showcase">
            <header className="showcase__header">
                <h1>Component Showcase</h1>
                <p>Phase 12d-12f Session Mode Components</p>
            </header>

            {/* Phase 12d: Safety Tools */}
            <section className="showcase__section">
                <h2>Phase 12d: Safety Tools Reference</h2>

                <div className="showcase__demo">
                    <h3>SafetyToolsIconRailItem</h3>
                    <p>Icon button with badge showing enabled tools count:</p>
                    <div className="showcase__icon-demo">
                        <SafetyToolsIconRailItem
                            tools={MOCK_SAFETY_TOOLS}
                            isSessionActive={true}
                        />
                    </div>
                </div>

                <div className="showcase__demo">
                    <h3>SafetyToolQuickRef Modal</h3>
                    <button
                        className="showcase__trigger"
                        onClick={() => setSafetyModalOpen(true)}
                    >
                        Open Safety Tools Modal
                    </button>
                    <SafetyToolQuickRef
                        isOpen={safetyModalOpen}
                        onClose={() => setSafetyModalOpen(false)}
                        tools={MOCK_SAFETY_TOOLS}
                    />
                </div>
            </section>

            {/* Phase 12e: Quick Notes */}
            <section className="showcase__section">
                <h2>Phase 12e: Quick Notes Capture</h2>

                <div className="showcase__demo">
                    <h3>QuickNoteIconRailItem</h3>
                    <p>Icon button with badge and pulse animation on new note:</p>
                    <div className="showcase__icon-demo">
                        <QuickNoteIconRailItem
                            notes={quickNotes}
                            onSaveNote={handleSaveNote}
                            isSessionActive={true}
                        />
                    </div>
                </div>

                <div className="showcase__demo">
                    <h3>QuickNoteCapture Popover</h3>
                    <button
                        className="showcase__trigger"
                        onClick={() => setQuickNoteOpen(true)}
                    >
                        Open Quick Note Capture
                    </button>
                    <QuickNoteCapture
                        isOpen={quickNoteOpen}
                        onClose={() => setQuickNoteOpen(false)}
                        onSave={handleSaveNote}
                    />
                </div>
            </section>

            {/* Phase 12f: Session End */}
            <section className="showcase__section">
                <h2>Phase 12f: Session End Enhancement</h2>

                <div className="showcase__demo showcase__demo--wide">
                    <h3>SessionThoughtsSection</h3>
                    <SessionThoughtsSection
                        quickNotes={quickNotes}
                        onRemoveNote={handleRemoveNote}
                        reflection={reflection}
                        onReflectionChange={setReflection}
                    />
                </div>

                <div className="showcase__demo showcase__demo--wide">
                    <h3>StarsAndWishesSection</h3>
                    <p>(Only renders when Stars & Wishes tool is enabled)</p>
                    <StarsAndWishesSection
                        isEnabled={true}
                        stars={stars}
                        wishes={wishes}
                        onAddStar={(star) => setStars(prev => [...prev, star])}
                        onRemoveStar={(index) => setStars(prev => prev.filter((_, i) => i !== index))}
                        onAddWish={(wish) => setWishes(prev => [...prev, wish])}
                        onRemoveWish={(index) => setWishes(prev => prev.filter((_, i) => i !== index))}
                    />
                </div>

                <div className="showcase__demo showcase__demo--wide">
                    <h3>EntityReferenceSummary</h3>
                    <EntityReferenceSummary
                        entities={MOCK_ENTITIES}
                        onEntityClick={(id) => console.log('Navigate to entity:', id)}
                    />
                </div>
            </section>

            {/* Keyboard shortcuts info */}
            <section className="showcase__section">
                <h2>Keyboard Shortcuts</h2>
                <ul className="showcase__shortcuts">
                    <li><kbd>S</kbd> — Open Safety Tools Reference (when session active)</li>
                    <li><kbd>N</kbd> — Open Quick Note Capture (when session active)</li>
                    <li><kbd>Escape</kbd> — Close any open modal/popover</li>
                    <li><kbd>Enter</kbd> — Save quick note (in capture popover)</li>
                </ul>
            </section>
        </div>
    );
}
