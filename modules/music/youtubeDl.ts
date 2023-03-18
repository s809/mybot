import { execFile, spawn } from "child_process";
import { promisify } from "util";
import { debug } from "../../constants";

const downloader = "yt-dlp";

/**
 * Fetches video or playlist.
 */
export async function fetchVideoOrPlaylist(urlOrQuery: string) {
    let { stdout } = await promisify(execFile)(downloader, [
        "--dump-json",
        "--no-playlist",
        "--flat-playlist",
        "--default-search", "ytsearch",
        urlOrQuery
    ]);
    
    let json: {
        url?: string;
        webpage_url?: string;
        title?: string;
        uploader?: string;
        duration?: number;
    }[] = JSON.parse(`[${stdout.replaceAll("\n{", ",\n{")}]`);

    return json.map(item => ({
        url: item.webpage_url ?? item.url!,
        title: item.title ?? null,
        uploader: item.uploader ?? null,
        duration: item.duration ?? null
    }));
}

/**
 * Loads metadata for URL.
 * 
 * @param url URL to fetch metadata for.
 * @returns Object with loaded metadata.
 */
export async function fetchVideoByUrl(url: string) {
    let { stdout } = await promisify(execFile)(downloader, [
        "--dump-json",
        "--no-playlist",
        url
    ]);
    
    let json: {
        url: string;
        title: string;
        uploader?: string;
        duration?: number;
    } = JSON.parse(stdout);

    return {
        url: url,
        title: json.title,
        uploader: json.uploader ?? null,
        duration: json.duration ?? null
    };
}

export async function getDownloadStream(url: string) {
    let video = spawn(downloader, [
        "--no-playlist",
        "-f", "bestaudio/best",
        "-o", "-",
        url
    ]);
    if (debug)
        video.stderr.pipe(process.stderr);
    return video.stdout;
}
