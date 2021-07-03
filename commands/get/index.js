import { makeSubCommands } from "../../util.js";
import * as mirroredchannels from "./mirroredchannels.js";
import * as ownedservers from "./ownedservers.js";

export const name = "get";
export const subcommands = makeSubCommands(mirroredchannels, ownedservers);
