import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CeremonyProvider } from '@/ceremony';
import { App } from './App';
import './tokens/globals.css';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <CeremonyProvider>
            <App />
        </CeremonyProvider>
    </StrictMode>
);