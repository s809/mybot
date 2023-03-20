import { defineCommand } from "@s809/noisecord";
import { ApplicationCommandOptionType } from "discord.js";
import { commandFramework } from "../env";

const translations = commandFramework.translationChecker.checkTranslations({
    "invalid_repo": true,
    "repo_information": true,
    "no_forks": true
}, `${commandFramework.commandRegistry.getCommandTranslationPath("bestfork")}.strings`);

export default defineCommand({
    key: "bestfork",
    args: [{
        key: "url",
        type: ApplicationCommandOptionType.String
    }],
    handler: async (req, { url }: { url: string }) => {
        if (!url.match(/^https:\/\/github\.com\/[a-z0-9-_]+\/[a-z0-9-_]+$/i))
            return translations.invalid_repo.getTranslation(req);

        const repo = url.split("/").slice(-2).join("/");
        
        const fetchReq = await fetch(`https://api.github.com/repos/${repo}/forks?sort=stargazers&per_page=1`);
        const data = await fetchReq.json();
        
        await req.reply(data.length
            ? translations.repo_information.getTranslation(req, {
                url: data[0].html_url,
                stars: data[0].stargazers_count
            })
            : translations.no_forks.getTranslation(req));
    },
    interactionCommand: true
})