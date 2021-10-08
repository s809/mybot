import { client, data } from "../env.js";

client.on("invalidated", () => {
    console.log("The session was invalidated, shutting down.");
    data.saveDataSync();
    process.exit();
});
