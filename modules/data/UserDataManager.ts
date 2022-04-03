import { existsSync, mkdirSync, PathLike, readdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { writeFile } from "fs/promises";
import { isDebug } from "../../env";

interface ItemRoot {
    src: object | string;
    /** Indicates if file was not accessed for long time. */
    deleteFlag: boolean;

    /* Only for objects. */
    accessor?: WeakRef<object>;
    modified?: boolean;
}

type UserDataFileType = "string" | "object";

type UserDataSchemaNode = {
    [x: string | "fileType"]: UserDataSchemaNode | UserDataFileType
};

type UserDataSchema = Omit<UserDataSchemaNode, "fileType"> & {
    fileType?: never
};

export function getSrc(obj: any) {
    if (!obj)
        return obj;

    let symbol = Object.getOwnPropertySymbols(obj)
        .find(symbol => symbol.description === "getSrc");
    if (!symbol)
        return obj;
    return obj[symbol]?.() ?? obj;
}

/**
 * Provides automatic saving and serialization of data.
 */
export class UserDataManager {
    /** Path to data root directory. */
    path: string;
    /** Defines directory structure. */
    schema: UserDataSchema;
    private cache: Map<string, ItemRoot>;
    private saveLock: number;
    [x: string]: any;

    constructor(path: string, schema: UserDataSchema) {
        this.path = path;
        this.schema = schema;
        this.cache = new Map();
        this.saveLock = 0;

        this.readSchema(this, schema, `${this.path}/`);

        const onSave = () => this.saveData();
        const saveAndExit = () => {
            this.saveDataSync(true);
            process.exit();
        };

        process.on("SIGINT", saveAndExit);
        process.on("SIGTERM", saveAndExit);

        setInterval(onSave, 60000 * 5);
    }

    readSchema(ref: this, schemaNode: UserDataSchemaNode, pathPart: PathLike) {
        let fileType = schemaNode.fileType;
        if (ref === this && fileType)
            throw new Error("Files are not supported in root directory.");

        if (!existsSync(pathPart))
            mkdirSync(pathPart);

        for (let [key, value] of Object.entries(schemaNode)) {
            if (key === "fileType") continue;
            value = value as UserDataSchemaNode;

            let newPathPart = `${pathPart}${key}/`;

            ref[key] = {};
            this.readSchema(ref[key], value, newPathPart);

            switch (value.fileType) {
                case "string":
                    ref[key] = this.createStringDirectoryProxy(ref[key], newPathPart);
                    break;
                case "object":
                    ref[key] = this.createObjectDirectoryProxy(ref[key], newPathPart);
                    break;
            }
        }
    }

    ownKeys(path: string, extension: string): string[] {
        let files = readdirSync(path).map(name => name.slice(0, -extension.length));
        let cacheKeys = [...this.cache.keys()]
            .filter(x => x.startsWith(path))
            .map(x => x.slice(path.length, -extension.length));
        return [...new Set([...files, ...cacheKeys]).values()];
    }

    has(filepath: PathLike) {
        return this.cache.has(filepath as string) || existsSync(filepath);
    }

    createStringDirectoryProxy(target: any, path: string): any {
        return new Proxy(target, {
            get: (target, name) => {
                let filepath = `${path}${name.toString()}.txt`;

                if (this.cache.has(filepath)) {
                    let data = this.cache.get(filepath);
                    data.deleteFlag = false;
                    return data.src;
                }
                else {
                    let str: string;

                    try {
                        str = readFileSync(filepath, "utf8");
                    } catch (e) {
                        if (e.code !== "ENOENT")
                            throw e;
                        return undefined;
                    }

                    this.cache.set(filepath, {
                        src: str,
                        deleteFlag: false
                    });

                    return str;
                }
            },
            set: (target, name, value) => {
                if (typeof value !== "string")
                    return false;

                let filepath = `${path}${name.toString()}.txt`;

                this.cache.set(filepath, {
                    src: value,
                    deleteFlag: false
                });

                return true;
            },
            deleteProperty: (_target, name) => {
                let filepath = `${path}${name.toString()}.txt`;
                this.cache.delete(filepath);
                rmSync(filepath, { force: true });
                return true;
            },
            ownKeys: () => this.ownKeys(path, ".txt"),
            getOwnPropertyDescriptor: function (target, key) {
                return { value: this.get(target, key), enumerable: true, configurable: true };
            },
            has: (_target, name) => this.has(`${path}${name.toString()}.txt`)
        });
    }

    createObjectDirectoryProxy(target: any, path: string): any {
        let createProxy = (src: any, root: ItemRoot, rootAccessor: any = null): any => {
            if (typeof src !== "object" || src === null || Array.isArray(src))
                return src;

            let handler: ProxyHandler<any> = {
                get: (target: any, name: string | symbol) => target[name],
                deleteProperty: (target: any, name: string | symbol) => {
                    delete src[name];
                    delete target[name];
                    return true;
                },
                ownKeys: (target: any) => [...Object.getOwnPropertySymbols(target), ...Object.keys(src)],
                getOwnPropertyDescriptor: function (target: any, key: any) {
                    return { value: this.get(target, key), enumerable: true, configurable: true };
                },
                has: (_target: any, name: string) => name in src
            };

            let obj: any = {};
            obj[Symbol("getSrc")] = () => src;
            let proxy = new Proxy(obj, handler);

            handler.set = (target: any, name: string | symbol, value: any) => {
                // Restore source object from data proxy
                value = getSrc(value);

                root.deleteFlag = false;
                root.modified = true;

                target[name] = createProxy(value, root, rootAccessor ?? proxy);
                src[name] = value;
                return true;
            };

            for (let [key, value] of Object.entries(src))
                proxy[key] = value;

            return proxy;
        };

        return new Proxy(target, {
            get: (_target, name) => {
                let filepath = `${path}${name.toString()}.json`;

                // If object is cached, return it and update flag
                if (this.cache.has(filepath)) {
                    let item = this.cache.get(filepath);
                    item.deleteFlag = false;

                    let proxy = item.accessor?.deref();
                    if (proxy === undefined) {
                        proxy = createProxy(item.src, item);
                        item.accessor = new WeakRef(proxy);
                    }

                    return proxy;
                }

                let str: string;
                try {
                    str = readFileSync(filepath, "utf8");
                }
                catch (e) {
                    if (e.code !== "ENOENT")
                        throw e;
                    return undefined;
                }

                let root: ItemRoot = {
                    src: JSON.parse(str),
                    deleteFlag: false
                };
                let proxy = createProxy(root.src, root);
                root.accessor = new WeakRef(proxy);

                this.cache.set(filepath, root);
                return proxy;
            },
            set: (_target, name, value) => {
                if (typeof value !== "object")
                    return false;

                let filepath = `${path}${name.toString()}.json`;

                let root: ItemRoot = {
                    src: value,
                    deleteFlag: false,
                    modified: true
                };

                this.cache.set(filepath, root);
                return true;
            },
            deleteProperty: (_target, name) => {
                let filepath = `${path}${name.toString()}.json`;
                this.cache.delete(filepath);
                rmSync(filepath, { force: true });
                return true;
            },
            ownKeys: () => this.ownKeys(path, ".json"),
            // eslint-disable-next-line func-names
            getOwnPropertyDescriptor: function (target, key) {
                return { value: this.get(target, key), enumerable: true, configurable: true };
            },
            has: (_target, name) => this.has(`${path}${name.toString()}.json`)
        });
    }

    async saveData() {
        if (this.saveLock !== 0) {
            this.saveLock++;
            return;
        }

        let saveLock = this.saveLock;
        await this.saveDataInternal(writeFile);

        while (saveLock !== this.saveLock) {
            saveLock = this.saveLock;
            await this.saveDataInternal(writeFile, false);
        }
    }

    saveDataSync(exiting = false) {
        if (this.saveLock !== 0 && !exiting) {
            this.saveLock++;
            return;
        }

        this.saveDataInternal(writeFileSync);
    }

    /**
     * Saves data.
     * 
     * @private
     * @param {(file: string, data: string) => (void | Promise<void>)} writeFileFunction Function for writing to file.
     * @param {boolean} markAndDelete Whether to mark and delete items from cache.
     */
    async saveDataInternal(writeFileFunction: (file: string, data: string) => (void | Promise<void>), markAndDelete: boolean = true) {
        if (isDebug)
            console.log(`Saving data... (${writeFileFunction.name})`);

        for (let [path, item] of this.cache) {
            if (markAndDelete) {
                if (item.deleteFlag) {
                    this.cache.delete(path);
                    continue;
                }
                else {
                    item.deleteFlag = true;
                }
            }

            let promise: void | Promise<void>;
            switch (typeof item.src) {
                case "string":
                    promise = writeFileFunction(path, item.src);
                    if (isDebug)
                        console.log(`Written: ${path}`);
                    break;
                case "object":
                    if (item.accessor?.deref() !== undefined)
                        item.deleteFlag = false;
                    if (item.modified) {
                        promise = writeFileFunction(path, JSON.stringify(item.src, null, 2));
                        item.modified = false;
                        if (isDebug)
                            console.log(`Written: ${path}`);
                    }
                    break;
            }
            if (promise instanceof Promise)
                await promise;
        }

        if (isDebug)
            console.log("Saved.");
    }
}
