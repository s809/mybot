import { formatDuration } from "../../util";
import { Translator } from "@s809/noisecord";
import EventEmitter from "events";
import { fetchVideoByUrl } from "./youtubeDl";
import { commandFramework } from "../../env";

const strings = commandFramework.translationChecker.checkTranslations({
    loading: true,
    unknown: true
}, "music_player.strings");

export interface MusicPlayerQueueEntry {
    url: string;
    title: string | null;
    uploader: string | null;
    duration: number | null;
}

export interface MusicPlayerQueue {
    on(event: "updateStatus", listener: () => void): this;
    on(event: "error", listener: (e: Error) => void): this;
}

export class MusicPlayerQueue extends EventEmitter {
    /** Queued videos. */
    get entries(): ReadonlyArray<Readonly<MusicPlayerQueueEntry>> {
        return this._entries;
    };
    private _entries: MusicPlayerQueueEntry[] = [];
    private modified = true;

    /** Whether the some of entries failed to load and were removed. */
    get hadErrors() {
        return this._hadErrors;
    }
    private _hadErrors = false;

    /** Whether the preloader is running. */
    private isLoading = false;

    constructor(initialEntries: MusicPlayerQueueEntry[]) {
        super();
        this.push(...initialEntries);
    }

    push(...entries: MusicPlayerQueueEntry[]) {
        this._entries.push(...entries);
        this.modified = true;
        this._hadErrors = false;
        this.loadData();
    }

    shift() {
        return this.splice(0, 1)[0];
    }

    splice(start: number, deleteCount?: number, ...items: MusicPlayerQueueEntry[]) {
        this.modified = true;
        return this._entries.splice(start, deleteCount!, ...items);
    }

    getQueueData(translator: Translator) {
        let result = "";
        let duration = 0;
        let tooLongFlag = false;
        for (let pos = 0; pos < this._entries.length; pos++) {
            let entry = this._entries[pos];

            duration += entry.duration ?? 0;

            if (result.length < 500) {
                let durationStr = entry.duration ? formatDuration(entry.duration) : strings.unknown.getTranslation(translator);
                result += `${pos + 1}) ${entry.title ?? strings.loading.getTranslation(translator)} (${durationStr})\n`;
            } else if (!tooLongFlag) {
                result += "...";
                tooLongFlag = true;
            }
        }

        return {
            formattedDuration: formatDuration(duration),
            text: result
        };
    }

    private async loadData() {
        if (this.isLoading) return;
        this.isLoading = true;

        let cache = new Map<string, MusicPlayerQueueEntry>();
        let failedUrls = new Set<string>();

        while (this.modified) {
            this.modified = false;

            for (let i = 0; i < this._entries.length; i++) {
                let entry = this._entries[i];

                // Metadata may already exist if it came with playlist.
                if (entry.title) continue;

                if (failedUrls.has(entry.url)) {
                    this.splice(i, 1);
                    this._hadErrors = true;
                    continue;
                }

                try {
                    let fetched = cache.get(entry.url);
                    if (!fetched) {
                        fetched = await fetchVideoByUrl(entry.url);
                        cache.set(entry.url, fetched);
                    }

                    Object.assign(entry, fetched);
                } catch (e) {
                    failedUrls.add(entry.url);
                    this.modified = true;
                }

                // Restart if queue was modified.
                if (this.modified) break;

                this.emit("updateStatus");
            }
        }
    }
}
