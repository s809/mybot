import { makeSubCommands } from "../../util.js";
import * as reset from "./reset.js";
import * as scan from "./scan.js";

export const name = "channel";
export const subcommands = makeSubCommands(
    reset,
    scan
);
