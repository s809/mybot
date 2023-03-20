import { execFile, spawn } from "child_process";
import { randomUUID } from "crypto";
import { mkdir, rm } from "fs/promises";
import path from "path";
import { promisify } from "util";
import { debug } from "../../constants";

const downloader = "yt-dlp";

const tempBasePath = `${downloader}-temp/`;
await rm(tempBasePath, {
    recursive: true,
    force: true
});

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
    const tempPath = path.resolve(tempBasePath, randomUUID());

    await mkdir(tempPath, {
        recursive: true
    });

    let video = spawn(downloader, [
        "--no-playlist",
        "-f", "bestaudio[acodec=opus]/best*[acodec=opus]/bestaudio/best",
        "-o", "-",
        url
    ], {
        cwd: tempPath
    });
    if (debug)
        video.stderr.pipe(process.stderr);
    
    video.once("close", () => rm(tempPath, {
        recursive: true,
        force: true
    }));

    return video.stdout;
}
