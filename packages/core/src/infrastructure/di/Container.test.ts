import { describe, it, expect, beforeEach } from 'vitest';
import { Container } from './Container';

describe('Container', () => {
    let container: Container;

    beforeEach(() => {
        container = new Container();
    });

    describe('register and resolve', () => {
        it('should resolve a registered dependency', () => {
            const token = Symbol('test');
            container.register(token, () => 'hello');

            const result = container.resolve<string>(token);

            expect(result).toBe('hello');
        });

        it('should throw when resolving unregistered dependency', () => {
            const token = Symbol('unknown');

            expect(() => container.resolve(token)).toThrow();
        });

        it('should create a new instance each time for transient registrations', () => {
            const token = Symbol('transient');

            // Register transient by default
            container.register(token, () => ({ id: Math.random() }));

            const first = container.resolve<{ id: number }>(token);
            const second = container.resolve<{ id: number}>(token);

            expect(first.id).not.toBe(second.id);
        });

        it('should return the same instance for singleton registrations', () => {
            const token = Symbol('singleton');
            container.register(token, () => ({ id: Math.random() }), true);

            const first = container.resolve<{ id: number }>(token);
            const second = container.resolve<{ id: number }>(token);
        });
    });

    describe('has', () => {
        it('should return true for a registered token', () => {
            const token = Symbol('exists');
            container.register(token, () => 'value');

            expect(container.has(token)).toBe(true);
        });

        it('should return false for an unregistered token', () => {
            const token = Symbol('missing');

            expect(container.has(token)).toBe(false);
        });
    });

    describe('clear', () => {
        it('should remove all registrations', () => {
            const token = Symbol('test');
            container.register(token, () => 'value');

            container.clear();

            expect(container.has(token)).toBe(false);
        });
    });
});