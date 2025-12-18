type Factory<T> = () => T;

interface Registration<T> {
    factory: Factory<T>;
    singleton: boolean;
    instance?: T;
}

export class Container {
    private registry = new Map<symbol, Registration<unknown>>();

    /**
     * Registers a factory for a token.
     */
    register<T>(token: symbol, factory: Factory<T>, singleton = false): void {
        this.registry.set(token, { factory, singleton });
    }

    /**
     * Resolves a dependency by token.
     */
    resolve<T>(token: symbol): T {
        const registration = this.registry.get(token);

        if(!registration) {
            throw new Error(`No registration found for ${token.toString()}`);
        }

        if(registration.singleton) {
            if(!registration.instance) {
                registration.instance = registration.factory();
            }
            return registration.instance as T;
        }

        return registration.factory() as T;
    }

    /**
     * Checks if a token is registered.
     */
    has(token: symbol): boolean {
        return this.registry.has(token);
    }

    /**
     * Clears all registrations (useful for testing).
     */
    clear(): void {
        this.registry.clear();
    }
}