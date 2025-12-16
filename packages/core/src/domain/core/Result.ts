/**
 * Result<T, E> - Railway-Oriented Programming for explicit error handling
 * Every operation that can fail returns a Result, making errors part of the type signature.
 * This eliminates unexpected exceptions and enables composable error hanlding via map/flatMap chains.
 */
export class Result<T, E = Error> {
    private readonly _isSuccess : boolean;
    private readonly _value?: T | undefined;
    private readonly _error?: E | undefined;
 
    get isSuccess(): boolean {
        return this._isSuccess;
    }

    get isFailure(): boolean {
        return !this._isSuccess;
    }
    
    get value(): T {
        if(!this._isSuccess) {
            throw new Error('Cannot access value of a failed Result. Check isSuccess before accessing value.');
        }
        return this._value as T;
    }

    get error(): E {
        if(this._isSuccess) {
            throw new Error('Cannot access an error of a successful Result. Check isFailure before accessing error');
        }
        return this._error as E;
    }

    private constructor(isSuccess: boolean, value?: T, error?: E) {
        this._isSuccess = isSuccess;
        this._value = value;
        this._error = error;
        
        Object.freeze(this);
    }

    static ok<T>(value: T): Result<T, never> {
        return new Result<T, never>(true, value, undefined);
    }

    static okVoid() : Result<void, never> {
        return new Result<void, never>(true, undefined, undefined);
    }

    static fail<E>(error: E): Result<never, E> {
        return new Result<never, E>(false, undefined, error);
    }

    static combine<T, E>(results: Result<T, E>[]): Result<T[], E> {
        const values: T[] = [];
        for(const result of results) {
            if(result.isFailure) {
                return Result.fail(result.error);
            }
            values.push(result.value);
        }
        return Result.ok(values);
    }

    static combineAll<T, E>(results: Result<T, E>[]): Result<T[], E[]> {
        const values: T[] = [];
        const errors: E[] = [];

        for(const result of results) {
            if(result.isFailure) {
                errors.push(result.error);
            } else {
                values.push(result.value);
            }
        }

        if(errors.length > 0) {
            return Result.fail(errors);
        }

        return Result.ok(values);
    }

    getOrElse(factory: (error: E) => T): T {
        if(this._isSuccess) {
            return this._value as T;
        }
        return factory(this._error as E);
    }

    map<U>(fn: (value: T) => U): Result<U, E> {
        if(this.isFailure) {
            return Result.fail(this._error as E);
        }
        return Result.ok(fn(this._value as T));
    }

    mapError<F>(fn: (error: E) => F): Result<T, F> {
        if(this.isSuccess) {
            return Result.ok(this._value as T);
        }
        return Result.fail(fn(this._error as E));
    }

    flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
        if(this.isFailure) {
            return Result.fail(this._error as E);
        }
        return fn(this._value as T);
    }

    andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
        return this.flatMap(fn);
    }

    tap(fn: (value: T) => void): Result<T, E> {
        if(this.isSuccess) {
            fn(this._value as T);
        }
        return this;
    }

    tapError(fn: (error: E) => void): Result<T, E> {
        if(this.isFailure) {
            fn(this._error as E);
        } 
        return this;
    }

    match<U>(handlers: { ok : (value: T) => U; fail: (error: E) => U}): U {
        if(this.isSuccess) {
            return handlers.ok(this._value as T);
        }
        return handlers.fail(this._error as E);
    }

    toPromise(): Promise<T> {
        if(this.isSuccess) {
            return Promise.resolve(this._value as T);
        }
        return Promise.reject(this._error);
    }

    unwrap(): T {
        if(this.isFailure) {
            throw this._error;
        }
        return this._value as T;
    }

    expect(message: string): T {
        if(this.isFailure) {
            throw new Error(`${message}: ${String(this._error)}`);
        }
        return this._value as T;
    }
}