import { useState } from 'react';
import { PrepModeHeader, type BrowserView } from '@/components/prep/PrepModeHeader';
import { EntityBrowser } from '@/components/prep/EntityBrowser';
import styles from '@/components/prep/prep.module.css';

export function PrepModeWorkspace() {
  const [view, setView] = useState<BrowserView>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className={styles.workspace}>
      <PrepModeHeader
        view={view}
        onViewChange={setView}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCreateEntity={() => console.log('Create entity')}
      />
      <div className={styles.workspaceScroll}>
        <div className={styles.browserContent}>
          <EntityBrowser view={view} searchQuery={searchQuery} />
        </div>
      </div>
    </div>
  );
}
