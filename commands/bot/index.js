import { makeSubCommands } from "../../util.js";
import * as changelog from "./changelog.js";
import * as invite from "./invite.js";
import * as uptime from "./uptime.js";

export const name = "bot";
export const subcommands = makeSubCommands(
    changelog,
    invite,
    uptime
);
