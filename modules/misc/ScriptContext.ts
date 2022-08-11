import { Awaitable, Client, ClientEvents } from "discord.js";

export class ScriptContext {
    private _immediates: Map<NodeJS.Immediate, () => void> = new Map();
    private _intervals: Map<NodeJS.Timer, {
        callback: () => void,
        delay: number,
        next: number
    }> = new Map();
    private _timeouts: Map<NodeJS.Timeout, {
        callback: () => void,
        next: number
    }> = new Map();
    private _events: {
        [event in keyof ClientEvents]?: ((...args: ClientEvents[event]) => Awaitable<void>)[]
    } = {};
    private alive: boolean = true;

    private _proxiedClient?: Client;

    private static _store: Map<string, ScriptContext> = new Map();

    constructor(private _client: Client, private _scriptName: string) {
        ScriptContext._store.set(_scriptName, this);
    }

    static get(scriptName: string) {
        return ScriptContext._store.get(scriptName) ?? null;
    }

    static getOrCreate(client: Client, scriptName: string) {
        if (ScriptContext._store.has(scriptName))
            return ScriptContext._store.get(scriptName);
        else
            return new ScriptContext(client, scriptName);
    }

    rename(scriptName: string) {
        if (!ScriptContext._store.delete(this._scriptName))
            throw new Error("ScriptContext not found");
        this._scriptName = scriptName;
        ScriptContext._store.set(scriptName, this);
    }

    destroy() {
        for (let id of this._immediates.keys())
            this.clearImmediate(id);
        for (let id of this._intervals.keys())
            this.clearInterval(id);
        for (let id of this._timeouts.keys())
            this.clearTimeout(id);
        for (let [event, listeners] of Object.entries(this._events)) {
            for (let listener of listeners)
                this._client.removeListener(event, listener);
        }
            
        ScriptContext._store.delete(this._scriptName);
        this.alive = false;
    }

    get client() {
        const clientOnlyFunctions = {
            on: this.on.bind(this),
            off: this.off.bind(this)
        }

        if (!this._proxiedClient) {
            this._proxiedClient = new Proxy(this._client, {
                get: (target, prop) => {
                    if (prop in this.functions)
                        return (this.functions as any)[prop];
                    else if (prop in clientOnlyFunctions)
                        return (clientOnlyFunctions as any)[prop];
                
                    return (target as any)[prop];
                }
            });
        }

        return this._proxiedClient;
    }

    readonly functions = {
        setImmediate: this.setImmediate.bind(this),
        clearImmediate: this.clearImmediate.bind(this),
        setInterval: this.setInterval.bind(this),
        clearInterval: this.clearInterval.bind(this),
        setTimeout: this.setTimeout.bind(this),
        clearTimeout: this.clearTimeout.bind(this)
    }

    private setImmediate(callback: () => void) {
        if (!this.alive) return;

        let id = setImmediate(() => {
            callback();
            this._immediates.delete(id);
        });
        this._immediates.set(id, callback);
        return id;
    }

    private clearImmediate(id: NodeJS.Immediate) {
        clearImmediate(id);
        this._immediates.delete(id);
    }

    private setInterval(callback: () => void, delay: number) {
        if (!this.alive) return;

        let info = {
            callback,
            delay,
            next: Date.now() + delay
        };

        let id = setInterval(() => {
            callback();
            info.next = Date.now() + info.delay;
        }, delay);

        this._intervals.set(id, info);
        return id;
    }

    private clearInterval(id: NodeJS.Timeout) {
        clearInterval(id);
        this._intervals.delete(id);
    }

    private setTimeout(callback: () => void, delay: number) {
        if (!this.alive) return;

        let id = setTimeout(() => {
            callback();
            this._timeouts.delete(id);
        }, delay);

        this._timeouts.set(id, {
            callback,
            next: Date.now() + delay
        });

        return id;
    }

    private clearTimeout(id: NodeJS.Timeout) {
        clearTimeout(id);
        this._timeouts.delete(id);
    }

    private on<K extends keyof typeof this._events>(event: K, callback: Exclude<typeof this._events[K], undefined>) {
        if (!this.alive) return;

        this._client.addListener(event, callback as any);
        
        this._events[event] ??= [];
        this._events[event]!.push(callback as any);
    }

    private off<K extends keyof typeof this._events>(event: K, callback: Exclude<typeof this._events[K], undefined>) {
        this._client.removeListener(event, callback as any);

        this._events[event]?.splice(this._events[event]!.indexOf(callback as any), 1);
        if (this._events[event]?.length === 0)
            delete this._events[event];
    }
}
