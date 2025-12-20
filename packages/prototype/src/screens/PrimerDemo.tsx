import { useState } from 'react';
import { PrimerTextArea } from '@/components/primer/PrimerTextArea';
import './PrimerDemo.css';

export function PrimerDemo() {
    const [description, setDescription] = useState('');
    const [secrets, setSecrets] = useState('');

    return (
        <div className="primer-demo">
            <h1 className="primer-demo__title">Primer Demo</h1>
            <p className="primer-demo__subtitle">
                Focus on an empty field and wait 4 seconds to see the primer animation.
            </p>

            <div className="primer-demo__form">
                <PrimerTextArea
                    label="Description"
                    value={description}
                    onChange={setDescription}
                    entityType="character"
                    field="description"
                    placeholder="Describe this character..."
                />

                <PrimerTextArea
                    label="Secrets (GM Only)"
                    value={secrets}
                    onChange={setSecrets}
                    entityType="character"
                    field="secrets"
                    placeholder="What secrets do they hold?"
                />
            </div>
        </div>
    );
}