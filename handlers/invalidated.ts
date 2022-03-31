import { client, data } from "../env";

client.on("invalidated", () => {
    console.log("The session was invalidated, shutting down.");
    data.saveDataSync();
    process.exit();
});
