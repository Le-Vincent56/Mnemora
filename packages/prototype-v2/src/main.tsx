import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CeremonyProvider } from '@/ceremony';
import { SessionModeProvider } from '@/adapters/session-mode';
import { App } from './App';
import './tokens/globals.css';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <CeremonyProvider>
            <SessionModeProvider>
                <App />
            </SessionModeProvider>
        </CeremonyProvider>
    </StrictMode>
);