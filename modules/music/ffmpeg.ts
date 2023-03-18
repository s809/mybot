import { spawn } from "child_process";
import { once } from "events";
import { Readable } from "stream";
import { debug } from "../../constants";
import { logDebug } from "../../log";

async function detectOpusStream(readable: Readable) {
    let ffprobe = spawn("ffprobe", [
        "-hide_banner",
        "-re",
        "-i", "-"
    ]);
    if (debug)
        ffprobe.stderr.pipe(process.stderr);

    let chunks: Buffer[] = [];
    const addChunk = (chunk: Buffer) => chunks.push(chunk);

    readable.on("data", addChunk);
    readable.pipe(ffprobe.stdin);

    let isOpus = false;
    ffprobe.stderr.setEncoding("utf8");
    ffprobe.stderr.on("data", output => {
        if (output.includes("opus"))
            isOpus = true;
    });

    await once(ffprobe.stdin, "close");

    readable.off("data", addChunk);
    readable.unshift(Buffer.concat(chunks));

    return isOpus;
}

export async function makeOpusStream(readable: Readable) {
    let isOpus = await detectOpusStream(readable);
    logDebug(`Is opus: ${isOpus}`);

    let ffmpeg = spawn("ffmpeg", [
        "-hide_banner",
        "-re",
        "-i", "-",
        "-vn",
        "-f", "opus",
        ...isOpus
            ? ["-c:a", "copy"]
            : ["-b:a", "384k"],
        "-"
    ]);
    ffmpeg.on("error", () => { /* Ignored */ });
    ffmpeg.stdout.on("close", () => ffmpeg.kill());
    if (debug)
        ffmpeg.stderr.pipe(process.stderr);

    readable.pipe(ffmpeg.stdin);
    return ffmpeg.stdout;
}
