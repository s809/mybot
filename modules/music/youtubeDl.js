import { execFile, spawn } from "child_process";
import { promisify } from "util";
import { isDebug } from "../../env.js";

/**
 * Fetches video or playlist.
 * 
 * @param {string} urlOrQuery
 * @returns
 */
export async function fetchVideoOrPlaylist(urlOrQuery) {
    let { stdout } = await promisify(execFile)("youtube-dl", [
        "--dump-json",
        "--no-playlist",
        "--flat-playlist",
        "--default-search", "ytsearch",
        urlOrQuery
    ]);

    /**
     * @type {{
     *  url?: string;
     *  webpage_url?: string;
     *  title?: string;
     *  uploader?: string;
     *  duration?: string;
     * }[]}
     */
    let json = JSON.parse(`[${stdout.replaceAll("\n{", ",\n{")}]`);

    return json.map(item => ({
        url: item.webpage_url ?? item.url,
        title: item.title,
        uploader: item.uploader,
        duration: item.duration
    }));
}

/**
 * Loads metadata for URL.
 * 
 * @param {string} url URL to fetch metadata for.
 * @returns Object with loaded metadata.
 */
export async function fetchVideoByUrl(url) {
    let { stdout } = await promisify(execFile)("youtube-dl", [
        "--dump-json",
        "--no-playlist",
        url
    ]);

    /**
     * @type {{
     *  url: string;
     *  title: string;
     *  uploader?: string;
     *  duration?: string;
     * }[]}
     */
    let json = JSON.parse(stdout);

    return {
        url: url,
        title: json.title,
        uploader: json.uploader,
        duration: json.duration
    };
}

export async function getDownloadStream(url) {
    let video = spawn("youtube-dl", [
        "--no-playlist",
        "-f", "bestaudio/best",
        "-o", "-",
        url
    ]);
    if (isDebug)
        video.stderr.pipe(process.stderr);
    return video.stdout;
}
