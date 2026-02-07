import { useMemo } from 'react';
import { CalendarClock, Link2, BookOpen, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Text, Icon, Badge } from '@/primitives';
import { EntityCard } from '@/components/composed';
import { useReducedMotion } from '@/hooks';
import { EASING, TIMING, toSeconds } from '@/tokens';
import { getAllEntities, ENTITY_ICONS } from '@/data/mockEntities';
import { getUpcomingSession, getSessionHistory } from '@/data/mockSessions';
import styles from '@/components/prep/prep.module.css';

/** Hardcoded plot hooks */
const OPEN_THREADS = [
  {
    id: 'thread-1',
    title: 'The Grandmother Oak',
    description: 'The party has the map fragment. The path to the planar anchor awaits.',
    linkedCount: 3,
  },
  {
    id: 'thread-2',
    title: 'Theron\'s Double Game',
    description: 'Theron\'s role as a Compact informant was exposed at the auction. How will he respond?',
    linkedCount: 2,
  },
  {
    id: 'thread-3',
    title: 'Fey Incursions Escalating',
    description: 'Border patrols report increased fey crossings. The Thornwild grows restless.',
    linkedCount: 4,
  },
  {
    id: 'thread-4',
    title: 'Seraphine\'s Missing Notes',
    description: 'The stolen ley line notes may contain more than just maps. Who has the rest?',
    linkedCount: 2,
  },
];

export function DashboardWorkspace() {
  const reducedMotion = useReducedMotion();
  const upcoming = getUpcomingSession();
  const history = getSessionHistory();
  const allEntities = useMemo(() => getAllEntities(), []);

  const recentEntities = useMemo(() => {
    return [...allEntities]
      .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))
      .slice(0, 6);
  }, [allEntities]);

  const mostLinked = useMemo(() => {
    return [...allEntities].sort(
      (a, b) => b.connections.length - a.connections.length
    )[0];
  }, [allEntities]);

  const daysSinceLastSession = useMemo(() => {
    const latest = history[0];
    if (!latest) return 0;
    const last = new Date(latest.date);
    return Math.floor((Date.now() - last.getTime()) / 86_400_000);
  }, [history]);

  const sectionDelay = (sectionIndex: number) =>
    reducedMotion ? 0 : sectionIndex * 0.08;

  return (
    <div className={styles.dashboardWorkspace}>
      {/* Next Session */}
      {upcoming && (
        <motion.section
          initial={reducedMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { duration: toSeconds(TIMING.gentle), ease: EASING.memory, delay: sectionDelay(0) }
          }
        >
          <Text variant="caption" color="tertiary" style={{ letterSpacing: '0.08em' }}>
            NEXT SESSION
          </Text>
          <div className={styles.dashboardNextSession}>
            <span className={styles.dashboardNextNumber}>{upcoming.number}</span>
            <div className={styles.dashboardNextInfo}>
              <Text variant="title" weight="semibold" style={{ fontFamily: 'var(--font-display)' }}>
                {upcoming.title}
              </Text>
              <span className={styles.dashboardNextDate}>
                {new Date(upcoming.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            <Badge variant="session" size="sm">
              {formatRelative(upcoming.date)}
            </Badge>
          </div>
        </motion.section>
      )}

      {/* Recently Modified */}
      <motion.section
        initial={reducedMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { duration: toSeconds(TIMING.gentle), ease: EASING.memory, delay: sectionDelay(1) }
        }
      >
        <Text variant="caption" color="tertiary" style={{ letterSpacing: '0.08em' }}>
          RECENTLY MODIFIED
        </Text>
        <div className={styles.dashboardRecentStrip}>
          {recentEntities.map((entity) => (
            <div key={entity.id} className={styles.dashboardRecentCard}>
              <EntityCard
                name={entity.name}
                entityType={entity.type}
                icon={ENTITY_ICONS[entity.type]}
                excerpt={entity.description}
                tags={entity.tags.slice(0, 2)}
                connectionCount={entity.connections.length}
                onSelect={() => console.log('Open entity:', entity.id)}
              />
            </div>
          ))}
        </div>
      </motion.section>

      {/* Open Threads */}
      <motion.section
        initial={reducedMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { duration: toSeconds(TIMING.gentle), ease: EASING.memory, delay: sectionDelay(2) }
        }
      >
        <Text variant="caption" color="tertiary" style={{ letterSpacing: '0.08em' }}>
          OPEN THREADS
        </Text>
        <div className={styles.dashboardThreads}>
          {OPEN_THREADS.map((thread) => (
            <div key={thread.id} className={styles.dashboardThread}>
              <div className={styles.dashboardThreadContent}>
                <Text variant="body" weight="semibold" style={{ fontFamily: 'var(--font-display)' }}>
                  {thread.title}
                </Text>
                <Text variant="body-sm" color="secondary">
                  {thread.description}
                </Text>
              </div>
              <span className={styles.dashboardThreadLinks}>
                <Icon icon={Link2} size={16} color="inherit" />
                {thread.linkedCount}
              </span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Campaign Stats */}
      <motion.section
        initial={reducedMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { duration: toSeconds(TIMING.gentle), ease: EASING.memory, delay: sectionDelay(3) }
        }
      >
        <Text variant="caption" color="tertiary" style={{ letterSpacing: '0.08em' }}>
          CAMPAIGN STATS
        </Text>
        <div className={styles.dashboardStats}>
          <StatCard
            icon={Users}
            value={allEntities.length}
            label="Entities"
          />
          <StatCard
            icon={BookOpen}
            value={history.length + (upcoming ? 1 : 0)}
            label="Sessions"
          />
          <StatCard
            icon={Link2}
            value={mostLinked?.name ?? '—'}
            label="Most Linked"
            isText
          />
          <StatCard
            icon={CalendarClock}
            value={daysSinceLastSession}
            label="Days Since Last"
          />
        </div>
      </motion.section>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  isText = false,
}: {
  icon: typeof Users;
  value: string | number;
  label: string;
  isText?: boolean;
}) {
  return (
    <div className={styles.dashboardStatCard}>
      <Icon icon={icon} size={20} color="secondary" />
      <span className={isText ? styles.dashboardStatText : styles.dashboardStatNumber}>
        {value}
      </span>
      <Text variant="caption" color="tertiary">{label}</Text>
    </div>
  );
}

function formatRelative(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  const days = Math.ceil(diff / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days > 1) return `In ${days} days`;
  return `${Math.abs(days)}d ago`;
}
