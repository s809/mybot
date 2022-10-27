export class MapWithDefault<K = any, V = any> extends Map<K, V> {
    private _setDefault?: () => V;

    setDefault(func: () => V) {
        this._setDefault = func;
        return this;
    };
    
    getOrSetDefault(key: K) {
        let value = this.get(key);
        if (value)
            return value;

        value = this._setDefault!();
        return this.set(key, value), value;
    };
}
