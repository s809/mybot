export class MapWithDefault<K = any, V = any> extends Map<K, V> {
    constructor(private defaultValue: () => V) {
        super();
    }

    get(key: K) {
        let value = super.get(key);
        if (!value) {
            value = this.defaultValue();
            this.set(key, value);
        }
        return value;
    }
}
