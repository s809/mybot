/**
 * @file Module for importing all commands.
 */

import { makeSubCommands } from "../util.js";

import * as bot from "../commands/bot/index.js";
import * as channel from "../commands/channel/index.js";
import * as clone from "../commands/clone/index.js";
import * as get from "../commands/get/index.js";
import * as mirror from "../commands/mirror/index.js";
import * as music from "../commands/music/index.js";
import * as owner from "../commands/owner/index.js";
import * as server from "../commands/server/index.js";

import * as delrange from "../commands/delrange.js";
import * as timer from "../commands/timer.js";

import * as help from "../commands/help.js";

export default makeSubCommands(
    bot,
    channel,
    clone,
    get,
    mirror,
    music,
    owner,
    server,

    delrange,
    timer,

    help,
);
