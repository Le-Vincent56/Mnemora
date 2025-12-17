import { DomainEvent, DomainEventTypeName } from './DomainEvent';

/**
 * Handler function type of domain events
 */
export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => void | Promise<void>;

/**
 * Unsubscribe function returned by subscribe()
 */
export type Unsubscribe = () => void;

/**
 * Interface for the Event Bus.
 * Lives in the domain layer so that domain services and use
 * cases can depend on it without coupling to the concrete implementation.
 */
export interface IEventBus {
    /**
     * Subscribe to events of a specific type.
     * @param eventType - The event string to subscribe to.
     * @param handler  - Function to call when the event is published.
     * @returns Unsubscribe function - call to remove the subscription.
     */
    subscribe<T extends DomainEvent>(
        eventType: DomainEventTypeName,
        handler: EventHandler<T>
    ): Unsubscribe;

    /**
     * Subscribe to all events (useful for logging, debugging, audit trails, etc.).
     * @param handler - Function to call for every event.
     * @returns Unsubscribe function.
     */
    subscribeAll(handler: EventHandler<DomainEvent>): Unsubscribe;

    /**
     * Publish an event to all subscribers.
     * @param event - The domain event to publish.
     * @returns Promise that resolves when all handlers have completed.
     * Note: Handlers are invoked in parallel. If any handler throws,
     * the error is logged but other handlers still execute.
     */
    publish(event: DomainEvent): Promise<void>;

    /**
     * Publish multiple events in order.
     * @param events - Array of events to publish sequentially
     */
    publishAll(events: DomainEvent[]): Promise<void>;

    /**
     * Removes all subscriptions. Useful for testing and cleanup.
     */
    clear(): void;
}