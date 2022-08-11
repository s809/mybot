import { fail } from "assert";
import { BitField, PermissionResolvable, PermissionsBitField } from "discord.js";
import { snakeCase } from "lodash-es";
import { CommandRequirement, InServer, ServerOwner } from ".";
import { capitalizeWords } from "../../../util";

function permissionsToString(raw: PermissionResolvable): string {
    if (typeof raw === "bigint")
        raw = raw.toString() as PermissionResolvable;

    if (typeof raw === "string") {
        if (raw.match(/^\d+$/))
            return permissionsToString(new PermissionsBitField(raw));
        else
            return capitalizeWords(snakeCase(raw).replaceAll("_", " "));
    }

    if (raw instanceof BitField)
        return permissionsToString(raw.toArray())

    if (Array.isArray(raw))
        return raw.map(p => permissionsToString(p)).join(", ");

    fail(`Permission type unmatched\nValue: ${raw}`);
};

export function ServerPermissions(permissions: PermissionResolvable): CommandRequirement {
    return {
        name: permissionsToString(permissions),
        check: msg => msg.member!.permissions.has(permissions),
        hideCommand: true,
        satisfiedBy: ServerOwner,
        requires: InServer,
        overridable: true
    }
};
