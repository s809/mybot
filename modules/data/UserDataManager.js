"use strict";

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { writeFile } from "fs/promises";

/**
 * @typedef ItemRoot
 * @property {any} src
 * @property {WeakRef} accessor
 * @property {boolean} deleteFlag Indicates if file was not accessed for long time.
 * @property {boolean} modified Only for objects.
 */

/**
 * Provides automatic saving and serialization of data.
 */
export class UserDataManager {
    constructor(path, schema) {
        /** @type {string} Path to data root directory. */
        this.path = path;
        /** @type {any} Defines directory structure. */
        this.schema = schema;
        /** @type {Map<string, ItemRoot>} */
        this.itemsToSave = new Map();

        this.readSchema(this, schema, `${this.path}/`);

        const onSave = () => this.saveData();
        const saveAndExit = () => {
            this.saveDataSync();
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
        let cacheKeys = [...this.itemsToSave.keys()]
            .filter(x => x.startsWith(path))
            .map(x => x.slice(path.length, -extension.length));
        return [...new Set([...files, ...cacheKeys]).values()];
    }

    has(filepath) {
        return this.itemsToSave.has(filepath) || existsSync(filepath);
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

                if (this.itemsToSave.has(filepath)) {
                    let data = this.itemsToSave.get(filepath);
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

                    this.itemsToSave.set(filepath, {
                        src: str,
                        deleteFlag: false
                    });

                    return str;
                }
            },
            set: (target, name, value) => {
                let filepath = `${path}${name}.txt`;

                this.itemsToSave.set(filepath, {
                    src: value,
                    deleteFlag: false
                });

                return true;
            },
            deleteProperty: (_target, name) => {
                let filepath = `${path}${name}.txt`;
                this.itemsToSave.delete(filepath);
                rmSync(filepath, { force: true });
                return true;
            },
            ownKeys: () => this.ownKeys(path, ".txt"),
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
                ownKeys: () => Object.keys(src),
                has: (_target, name) => name in src
            };
            let proxy = new Proxy({}, handler);

            handler.set = (target, name, value) => {
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
                if (this.itemsToSave.has(filepath)) {
                    let root = this.itemsToSave.get(filepath);
                    root.deleteFlag = false;

                    let proxy = root.accessor?.deref();
                    if (proxy === undefined) {
                        proxy = createProxy(root.src, root);
                        root.accessor = new WeakRef(proxy);
                    }

                    return proxy;
                }

                let str;
                try {
                    str = readFileSync(filepath, "utf8");
                } catch (e) {
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

                this.itemsToSave.set(filepath, root);
                return proxy;
            },
            set: (_target, name, value) => {
                let filepath = `${path}${name}.json`;

                /** @type {ItemRoot} */
                let root = {
                    src: value,
                    deleteFlag: false,
                    modified: true
                };

                this.itemsToSave.set(filepath, root);
                return true;
            },
            deleteProperty: (_target, name) => {
                let filepath = `${path}${name}.json`;
                this.itemsToSave.delete(filepath);
                rmSync(filepath, { force: true });
                return true;
            },
            ownKeys: () => this.ownKeys(path, ".json"),
            has: (_target, name) => this.has(`${path}${name}.json`)
        });
    }

    async saveData() {
        await this.saveDataInternal(writeFile);
    }

    saveDataSync() {
        this.saveDataInternal(writeFileSync);
    }

    /**
     * Saves data.
     * 
     * @private
     * @param {(file: string, data: string) => void | Promise<void>} writeFileFunction Function for writing to file.
     */
    async saveDataInternal(writeFileFunction) {
        for (let [path, root] of this.itemsToSave) {
            if (root.deleteFlag) {
                this.itemsToSave.delete(path);
                continue;
            }
            else {
                root.deleteFlag = true;
            }

            let promise;
            switch (typeof root.src) {
                case "string":
                    promise = writeFileFunction(path, root.src);
                    break;
                case "object":
                    if (root.accessor?.deref() !== undefined)
                        root.deleteFlag = false;
                    if (root.modified) {
                        promise = writeFileFunction(path, JSON.stringify(root.src, null, 2));
                        root.modified = false;
                    }
                    break;
            }
            if (promise instanceof Promise)
                await promise;
        }
    }
}
