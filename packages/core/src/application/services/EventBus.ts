import {
    DomainEvent,
    DomainEventTypeName
} from '../../domain/events/DomainEvent';

import {
    IEventBus,
    EventHandler,
    Unsubscribe
} from '../../domain/events/IEventBus';

/**
 * Special key for handlers that receive all events
 */
const WILDCARD = '*';

/**
 * In-memory Event Bus implementation.
 * Follows the Observer pattern - publishers don't know about subscribers;
 * enables loose coupling between components.
 */
export class EventBus implements IEventBus {
    private handlers: Map<string, EventHandler[]> = new Map();

    /**
     * Subscribe to events of a specific type.
     * @param eventType - The event string to subscribe to.
     * @param handler  - Function to call when the event is published.
     * @returns Unsubscribe function - call to remove the subscription.
     */
    subscribe<T extends DomainEvent>(
        eventType: DomainEventTypeName,
        handler: EventHandler<T>
    ): Unsubscribe {
        return this.addHandler(eventType, handler as EventHandler);
    }

    /**
     * Subscribe to all events (useful for logging, debugging, audit trails, etc.).
     * @param handler - Function to call for every event.
     * @returns Unsubscribe function.
     */
    subscribeAll(handler: EventHandler<DomainEvent>): Unsubscribe {
        return this.addHandler(WILDCARD, handler);
    }

    /**
     * Publish an event to all subscribers.
     * @param event - The domain event to publish.
     * @returns Promise that resolves when all handlers have completed.
     * Note: Handlers are invoked in parallel. If any handler throws,
     * the error is logged but other handlers still execute.
     */
    async publish(event: DomainEvent): Promise<void> {
        const specificHandlers = this.handlers.get(event.eventType) ?? [];
        const wildCardHandlers = this.handlers.get(WILDCARD) ?? [];
        const allHandlers = [...specificHandlers, ...wildCardHandlers];

        if(allHandlers.length === 0) {
            return;
        }

        // Run all handlers in parallel, but don't let one failure break others
        const results = await Promise.allSettled(
            allHandlers.map((handler) => this.invokeHandler(handler, event))
        );

        // Log any failures (in production, this would go to a proper logger)
        for(const result of results) {
            if(result.status === 'rejected') {
                console.error(`[EventBus] Handler failed for event ${event.eventType}:`, result.reason);
            }
        }
    }

    /**
     * Publish multiple events in order.
     * @param events - Array of events to publish sequentially
     */
    async publishAll(events: DomainEvent[]): Promise<void> {
        for(const event of events) {
            await this.publish(event);
        }
    }

    /**
     * Removes all subscriptions.
     */
    clear(): void {
        this.handlers.clear();
    }

    /**
     * Get the count of handlers for a specific event type (useful for testing).
     */
    handlerCount(eventType?: DomainEventTypeName): number {
        if(eventType) {
            return this.handlers.get(eventType)?.length ?? 0;
        }

        // Total count across all event types
        let total = 0;
        for(const handlers of this.handlers.values()) {
            total += handlers.length;
        }

        return total;
    }

    /**
     * Add a handler to a specific event.
     * Returns an unsubscribe function for later cleanup.
     */
    private addHandler(key: string, handler: EventHandler): Unsubscribe {
        const handlers = this.handlers.get(key) ?? [];
        handlers.push(handler);
        this.handlers.set(key, handlers);

        // Return the unsubscribe function
        return () => {
            const currentHandlers = this.handlers.get(key);
            if(currentHandlers) {
                const index = currentHandlers.indexOf(handler);
                if(index > -1) {
                    currentHandlers.splice(index, 1);
                }

                // Clean up empty arrows
                if(currentHandlers.length === 0) {
                    this.handlers.delete(key);
                }
            }
        }
    }

    /**
     * Invoke a handler's function when an Event is published
     */
    private async invokeHandler(handler: EventHandler, event: DomainEvent): Promise<void> {
        // Handler can be async or async, but we await either way
        const result = handler(event);
        if(result instanceof Promise) {
            await result;
        }
    }
}