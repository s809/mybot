import { defineCommand } from "@s809/noisecord";
import { ApplicationCommandOptionType } from "discord.js";
import { commandFramework } from "../env";

export default defineCommand({
    key: "bestfork",
    args: [{
        key: "url",
        type: ApplicationCommandOptionType.String
    }],

    translations: {
        strings: {
            invalid_repo: true,
            repo_information: true,
            no_forks: true
        }
    },

    handler: async (req, { url }, { strings }) => {
        if (!url.match(/^https:\/\/github\.com\/[a-z0-9-_]+\/[a-z0-9-_]+$/i))
            return strings.invalid_repo;

        const repo = url.split("/").slice(-2).join("/");

        const fetchReq = await fetch(`https://api.github.com/repos/${repo}/forks?sort=stargazers&per_page=1`);
        const data = await fetchReq.json();

        await req.replyOrEdit(data.length
            ? strings.repo_information.withArgs({
                url: data[0].html_url,
                stars: data[0].stargazers_count
            })
            : strings.no_forks);
    }
})
