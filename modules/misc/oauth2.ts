import { OAuth2API, UsersAPI } from "@discordjs/core";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import { ApplicationRoleConnectionMetadataType, REST } from "discord.js";
import express from "express";
import { oauth2 } from "../../constants";
import { User as DbUser } from "../../database/models";
import { client } from "../../env";

export const app = express();
if (oauth2)
    app.use(cookieParser(oauth2!.cookieSecret))

app.get("/", (req, res) => {
    res.send("Nothing is here, yet.");
});

app.get("/oauth2/linked-roles", async (req, res) => {
    const state = crypto.randomUUID();
    res.cookie("clientState", state, { maxAge: 1000 * 60 * 5, signed: true });

    const oauth2Api = new OAuth2API(new REST());
    res.redirect(oauth2Api.generateAuthorizationURL({
        client_id: client.application!.id,
        redirect_uri: `${oauth2!.urlBase}/oauth2/callback`,
        response_type: "code",
        state,
        scope: "role_connections.write identify",
        prompt: "consent"
    }));
});

app.get("/oauth2/callback", async (req, res) => {
    const code = req.query["code"] as string;
    const discordState = req.query["state"];

    const { clientState } = req.signedCookies;
    if (clientState !== discordState)
        return res.status(403).send("State verification failed.");

    const rest = new REST({
        authPrefix: "Bearer"
    });
    rest.setToken("not-a-token");

    const oauth2Api = new OAuth2API(rest);
    const tokens = await oauth2Api.tokenExchange({
        client_id: client.application!.id,
        client_secret: oauth2!.clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: `${oauth2!.urlBase}/oauth2/callback`,
    });
    rest.setToken(tokens.access_token);

    const userApi = new UsersAPI(rest);

    const userData = await userApi.getCurrent();
    await DbUser.updateByIdWithUpsert(userData.id, {
        oauth2: {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt: Date.now() + tokens.expires_in * 1000
        }
    });

    await userApi.updateApplicationRoleConnection(client.application!.id, {
        platform_name: "I don't know what is this",
        platform_username: "yo wtf",
        metadata: {
            key1: 1
        }
    });

    res.send("You did it! Now go back to Discord.");
});

export async function startOAuth2Server() {
    if (!oauth2) return;

    await client.application!.editRoleConnectionMetadataRecords([{
        name: "cool role link",
        description: ":wtf2:",
        key: "key1",
        type: ApplicationRoleConnectionMetadataType.BooleanEqual
    }])
    app.listen(oauth2!.port);
}
