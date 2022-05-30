const { ApplicationCommandOptionType, ActionRowBuilder,
    ButtonBuilder } = require("discord.js");
const CConfig = require("../classes/CaptchaConfig");
class setup extends require("../classes/Command"){
    constructor(){
        super(
            "setup",
            {
                name: "setup",
                description: "Setup the Captcha Modal.",
                options: [
                    {
                        name: "role",
                        description: "123",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "role",
                                description: "456",
                                type: ApplicationCommandOptionType.Role,
                                required: true
                            }
                        ]
                    }, {
                        name: "button",
                        description: "123",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "name",
                                description: "456",
                                type: ApplicationCommandOptionType.String,
                                required: true
                            }, {
                                name: "color",
                                description: "456",
                                type: ApplicationCommandOptionType.String,
                                autocomplete: true,
                                required: true
                            }, {
                                name: "emoji",
                                description: "456",
                                type: ApplicationCommandOptionType.String,
                                required: false
                            }
                        ]
                    }, {
                        name: "message",
                        description: "123",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "message",
                                description: "456",
                                type: ApplicationCommandOptionType.String,
                                required: true
                            }
                        ]
                    }, {
                        name: "description",
                        description: "123",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "description",
                                description: "456",
                                type: ApplicationCommandOptionType.String,
                                required: true
                            }
                        ]
                    }, {
                        name: "language",
                        description: "123",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "language",
                                description: "456",
                                type: ApplicationCommandOptionType.String,
                                autocomplete: true,
                                required: true
                            }
                        ]
                    }, {
                        name: "enabled",
                        description: "123",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "enabled",
                                description: "456",
                                type: ApplicationCommandOptionType.Boolean,
                                required: true
                            }
                        ]
                    }, {
                        name: "send",
                        description: "123",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "channel",
                                description: "456",
                                type: ApplicationCommandOptionType.Channel,
                                required: true
                            }
                        ]
                    }
                ]
            }
        );
        /* /setup
        *  -> role ROLE:role
        *  -> button STRING:name STRING:color:AUTOCOMPLETE, STRING:emoji:OPTIONAL
        *  -> message STRING:message
        *  -> description STRING:description
        *  -> locale STRING:set:AUTOCOMPLETE
        *  -> enabled BOOLEAN:enabled
        *  -> send CHANNEL:channel
        * */
    }

    cmdRun(interaction,bot){
        let configuration;

        if(!(bot.db.has(interaction.guild.id))){
            configuration = new CConfig({});
            bot.db.set(interaction.guild.id, configuration);
        } else {
            configuration = bot.db.get(interaction.guild.id);
        }

        if(interaction.options.get("channel")){
            interaction.deferReply();
            const button = new ButtonBuilder()
                .setLabel(configuration.button.name)
                .setCustomId(`captcha-${interaction.guild.id}`);
            if(configuration.button.emoji === null){
                button.setStyle(configuration.resolveStyle(configuration.button.color)) //TODO: Fix, broken.
            } else {
                button.setEmoji(configuration.button.emoji);
            }
            interaction.options.get("channel").send({
                content: configuration.message,
                components: [
                    new ActionRowBuilder().setComponents([button])
                ]
            }).then(()=>{
                interaction.editReply({content: "Sent."});
            });
        }
    }
}
module.exports = new setup();