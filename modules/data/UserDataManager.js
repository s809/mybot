import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { writeFile } from "fs/promises";
import { isDebug } from "../../env.js";

/**
 * @typedef ItemRoot
 * @property {any} src
 * @property {WeakRef} accessor
 * @property {boolean} deleteFlag Indicates if file was not accessed for long time.
 * @property {boolean} modified Only for objects.
 */

/**
 * @typedef {"string" | "object"} UserDataFileType
 */

/**
 * @typedef {{
 *  [children: string]: UserDataSchemaNode;
 *  fileType?: UserDataFileType;
 * }} UserDataSchemaNode
 */

/**
 * @typedef {{
 *  [nodes: string]: UserDataSchemaNode;
 *  fileType: never;
 * }} UserDataSchema
 */

/**
 * Gets source data object from proxied object.
 * 
 * @param {any} obj Proxied object.
 * @returns Restored source object.
 */
export function getSrc(obj) {
    if (!obj)
        return obj;
    
    let symbol = Object.getOwnPropertySymbols(obj).find(symbol => symbol.description === "getSrc");
    if (!symbol)
        return obj;
    return obj[symbol]?.() ?? obj;
}

/**
 * Provides automatic saving and serialization of data.
 */
export class UserDataManager {
    /**
     * @param {string} path
     * @param {UserDataSchema} schema
     */
    constructor(path, schema) {
        /** @type {string} Path to data root directory. */
        this.path = path;
        /** @type {any} Defines directory structure. */
        this.schema = schema;

        /**
         * @type {Map<string, ItemRoot>}
         * @private
         */
        this.cache = new Map();
        /** @private */
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

    readSchema(ref, schemaPart, pathPart) {
        let fileType = schemaPart.fileType;
        if (ref === this && fileType)
            throw new Error("Files are not supported in root directory.");

        if (!existsSync(pathPart))
            mkdirSync(pathPart);

        for (let [key, value] of Object.entries(schemaPart)) {
            if (key === "fileType") continue;
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

    /**
     * @param {string} path
     * @param {string} extension
     * @returns {string[]}
     */
    ownKeys(path, extension) {
        let files = readdirSync(path).map(name => name.slice(0, -extension.length));
        let cacheKeys = [...this.cache.keys()]
            .filter(x => x.startsWith(path))
            .map(x => x.slice(path.length, -extension.length));
        return [...new Set([...files, ...cacheKeys]).values()];
    }

    has(filepath) {
        return this.cache.has(filepath) || existsSync(filepath);
    }

    /**
     * @param {any} target
     * @param {string} path
     * @returns {any}
     */
    createStringDirectoryProxy(target, path) {
        return new Proxy(target, {
            get: (target, name) => {
                let filepath = `${path}${name}.txt`;

                if (this.cache.has(filepath)) {
                    let data = this.cache.get(filepath);
                    data.deleteFlag = false;
                    return data.src;
                }
                else {
                    let str;

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

                let filepath = `${path}${name}.txt`;

                this.cache.set(filepath, {
                    src: value,
                    deleteFlag: false
                });

                return true;
            },
            deleteProperty: (_target, name) => {
                let filepath = `${path}${name}.txt`;
                this.cache.delete(filepath);
                rmSync(filepath, { force: true });
                return true;
            },
            ownKeys: () => this.ownKeys(path, ".txt"),
            // eslint-disable-next-line func-names
            getOwnPropertyDescriptor: function (target, key) {
                return { value: this.get(target, key), enumerable: true, configurable: true };
            },
            has: (_target, name) => this.has(`${path}${name}.txt`)
        });
    }

    /**
     * @param {any} target
     * @param {string} path
     * @returns {any}
     */
    createObjectDirectoryProxy(target, path) {
        /**
         * @param {any} src Source object
         * @param {ItemRoot} root Root with delete flag to update.
         * @returns {any}
         */
        let createProxy = (src, root, rootAccessor = null) => {
            if (typeof src !== "object" || src === null || Array.isArray(src))
                return src;

            /** @type {ProxyHandler} */
            let handler = {
                get: (target, name) => target[name],
                deleteProperty: (target, name) => {
                    delete src[name];
                    delete target[name];
                    return true;
                },
                ownKeys: target => [...Object.getOwnPropertySymbols(target), ...Object.keys(src)],
                // eslint-disable-next-line func-names
                getOwnPropertyDescriptor: function (target, key) {
                    return { value: this.get(target, key), enumerable: true, configurable: true };
                },
                has: (_target, name) => name in src
            };

            let obj = {};
            obj[Symbol("getSrc")] = () => src;
            let proxy = new Proxy(obj, handler);

            handler.set = (target, name, value) => {
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
                let filepath = `${path}${name}.json`;

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

                let str;
                try {
                    str = readFileSync(filepath, "utf8");
                }
                catch (e) {
                    if (e.code !== "ENOENT")
                        throw e;
                    return undefined;
                }

                /** @type {ItemRoot} */
                let root = {
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

                let filepath = `${path}${name}.json`;

                /** @type {ItemRoot} */
                let root = {
                    src: value,
                    deleteFlag: false,
                    modified: true
                };

                this.cache.set(filepath, root);
                return true;
            },
            deleteProperty: (_target, name) => {
                let filepath = `${path}${name}.json`;
                this.cache.delete(filepath);
                rmSync(filepath, { force: true });
                return true;
            },
            ownKeys: () => this.ownKeys(path, ".json"),
            // eslint-disable-next-line func-names
            getOwnPropertyDescriptor: function (target, key) {
                return { value: this.get(target, key), enumerable: true, configurable: true };
            },
            has: (_target, name) => this.has(`${path}${name}.json`)
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
    async saveDataInternal(writeFileFunction, markAndDelete = true) {
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

            let promise;
            switch (typeof item.src) {
                case "string":
                    promise = writeFileFunction(path, item.src);
                    break;
                case "object":
                    if (item.accessor?.deref() !== undefined)
                        item.deleteFlag = false;
                    if (item.modified) {
                        promise = writeFileFunction(path, JSON.stringify(item.src, null, 2));
                        item.modified = false;
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
