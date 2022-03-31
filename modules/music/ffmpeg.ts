import { spawn } from "child_process";
import { once } from "events";
import { Readable } from "stream";
import { isDebug } from "../../env";

async function detectOpusStream(readable: Readable) {
    let ffprobe = spawn("ffprobe", [
        "-hide_banner",
        "-i", "-"
    ]);
    if (isDebug)
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
    if (isDebug)
        console.log(`Is opus: ${isOpus}`);

    let ffmpeg = spawn("ffmpeg", [
        "-hide_banner",
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
    if (isDebug)
        ffmpeg.stderr.pipe(process.stderr);

    readable.pipe(ffmpeg.stdin);
    return ffmpeg.stdout;
}
