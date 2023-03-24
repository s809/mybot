import { debug } from "../../constants";
import { defineCommand } from "@s809/noisecord";

export default defineCommand({
    key: "test",
    ownerOnly: !debug
});
