import { database } from "../database";
import { client } from "../env";
import { log } from "../log";

client.on("invalidated", () => {
    log("The session was invalidated, shutting down.");
    database.disconnect();
    process.exit();
});
