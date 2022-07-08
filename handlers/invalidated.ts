import { client, dataManager } from "../env";
import { log } from "../log";

client.on("invalidated", () => {
    log("The session was invalidated, shutting down.");
    dataManager.saveDataSync();
    process.exit();
});
