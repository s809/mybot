import { CommandRequest, defineCommand } from "@s809/noisecord";

export default defineCommand({
    key: "reset",

    translations: {
        errors: {
            thread_channel: true,
        }
    },

    handler: async (msg: CommandRequest<true>, { }, { errors }) => {
        if (msg.channel.isThread())
            return errors.thread_channel;

        let position = msg.channel.position;
        await Promise.all([
            msg.channel.clone().then(channel => {
                channel.setPosition(position)
            }),
            msg.channel.delete()
        ]);
    }
});
