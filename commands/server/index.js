import { makeSubCommands } from "../../util.js";
import * as clone from "./clone.js";
import * as create from "./create.js";
import * as delall from "./delall.js";
import * as _delete from "./delete.js";

export const name = "server";
export const subcommands = makeSubCommands(
    clone,
    create,
    delall,
    _delete
);
