import { client, dataManager } from "../env";

client.on("invalidated", () => {
    console.log("The session was invalidated, shutting down.");
    dataManager.saveDataSync();
    process.exit();
});
