const { ApplicationCommandOptionType, ActionRowBuilder,
    ButtonBuilder, ButtonStyle } = require("discord.js");
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
                        description: "Setup the Role to be given upon a successful Captcha.",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "role",
                                description: "Role to be given.",
                                type: ApplicationCommandOptionType.Role,
                                required: true
                            }
                        ]
                    }, {
                        name: "button",
                        description: "Setup the Button that will open the Captcha Modal.",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "name",
                                description: "Button's label.",
                                type: ApplicationCommandOptionType.String,
                                required: true
                            }, {
                                name: "color",
                                description: "Button's color.",
                                type: ApplicationCommandOptionType.String,
                                autocomplete: true,
                                required: true
                            }, {
                                name: "emoji",
                                description: "Button's emoji (can be custom and animated).",
                                type: ApplicationCommandOptionType.String,
                                required: false
                            }
                        ]
                    }, {
                        name: "message",
                        description: "Message that is sent with the Button to open Captcha Modal.",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "message",
                                description: "Message to be sent.",
                                type: ApplicationCommandOptionType.String,
                                required: true
                            }
                        ]
                    }, {
                        name: "description",
                        description: "Short description that will be displayed inside the Captcha Modal.",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "description",
                                description: "Description to be displayed.",
                                type: ApplicationCommandOptionType.String,
                                required: true
                            }
                        ]
                    }, {
                        name: "enabled",
                        description: "Enable or disable the Button that opens the Captcha Modal.",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "enabled",
                                description: "Enable the button?",
                                type: ApplicationCommandOptionType.Boolean,
                                required: true
                            }
                        ]
                    }, {
                        name: "send",
                        description: "Channel to send the Captcha Message and Button on.",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "channel",
                                description: "The channel that the Captcha Message and Modal will be sent.",
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

    async cmdRun(interaction,bot){
        let configuration;

        if(!(bot.db.has(interaction.guild.id))){
            configuration = new CConfig({});
            bot.db.set(interaction.guild.id, configuration);
        } else {
            configuration = bot.db.get(interaction.guild.id);
        }

        if(interaction.options.get("channel")){
            if(configuration.post){
                const msg = await interaction.guild.channels.cache.get(configuration.post.split("/")[1])
                    .messages.fetch({message: configuration.post.split("/")[2], force: true}).catch(e => console.log(e));
                if(msg) return interaction.reply({content: `You already have a Captcha post [here](<https://discord.com/channels/${configuration.post}>).`});
                bot.db.set(interaction.guild.id, null, "post");
            }
            if(configuration.role === null) return interaction.reply({content: "❌ ERROR: `No role set.`"});
            if(!(interaction.options.get("channel").channel.isText())) return interaction.reply({content: `❌ ERROR: \`${interaction.options.get("channel").channel.name} is not a text channel.\``});
            const button = new ButtonBuilder()
                .setLabel(configuration.button.name)
                .setCustomId(`captcha-${interaction.guild.id}`)
                .setStyle(this.resolveStyle(configuration.button.color));
            if(configuration.button.emoji !== null){
                let emoji = configuration.button.emoji;
                if(/(\d{17,19})/.test(emoji)){
                    emoji = bot.emojis.resolve(emoji);
                    if(emoji){
                        button.setEmoji(emoji);
                    }
                } else {
                    button.setEmoji(configuration.button.emoji);
                }
            }
            return interaction.options.get("channel").channel.send({
                content: configuration.message,
                components: [
                    new ActionRowBuilder().setComponents([button])
                ]
            }).then((sent)=>{
                interaction.reply({content: "Sent."});
                const post = `${interaction.guild.id}/${sent.channel.id}/${sent.id}`;
                bot.db.set(interaction.guild.id, post, "post");
            });
        }

        if(interaction.options.get("role")){
            const role = interaction.options.get("role").role;
            if(configuration.role === role.id) return interaction.reply({content: "❌ ERROR: `New role cannot be the same as the old role.`"});
            configuration.role = role.id;
            bot.db.set(interaction.guild.id, role.id, "role");
            interaction.reply({content: `Role set to: ${role.name}.`});
            return this.updateCaptcha(interaction,configuration);
        }

        if(interaction.options.get("message")){
            const message = interaction.options.get("message").value;
            configuration.message = message;
            bot.db.set(interaction.guild.id, message, "message");
            interaction.reply({content: `Message set.`});
            return this.updateCaptcha(interaction,configuration);
        }

        if(interaction.options.get("description")){
            const description = interaction.options.get("description").value;
            configuration.description = description;
            bot.db.set(interaction.guild.id, description, "description");
            interaction.reply({content: `Description set.`});
            return this.updateCaptcha(interaction,configuration);
        }

        if(interaction.options.get("enabled")){
            const enabled = interaction.options.get("enabled").value;
            if(configuration.enabled === enabled) return interaction.reply({content: `❌ ERROR: \`Button is already set to ${enabled ? "enabled" : "disabled"}\`.`});
            configuration.enabled = enabled;
            bot.db.set(interaction.guild.id, enabled, "enabled");
            interaction.reply({content: `Button ${enabled ? "enabled" : "disabled"}.`});
            return this.updateCaptcha(interaction,configuration);
        }

        if(interaction.options.getSubcommand() === "button"){
            const name = interaction.options.get("name").value;
            let color = interaction.options.get("color").value;
            let emoji = "";
            if(interaction.options.get("emoji")){
                emoji = interaction.options.get("emoji").value;
                const discordEmojiRgx = /<a?:(\w{2,32}):(\d{17,19})>/;
                const unicodeEmojiRgx = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/;
                if(discordEmojiRgx.test(emoji)){
                    let id = emoji.split(":")[2].slice(0,-1);
                    let emojiTest = bot.emojis.resolve(id);
                    if(emojiTest){
                        configuration.button.emoji = id;
                    } else {
                        return interaction.reply({content: `❌ ERROR: \`Emoji provided is from a server I am not on.\``});
                    }
                } else if(unicodeEmojiRgx.test(emoji)){
                    configuration.button.emoji = emoji;
                } else {
                    return interaction.reply({content: `❌ ERROR: \`${emoji} is not a valid Emoji.\``});
                }
            } else if(configuration.button.emoji){
                configuration.button.emoji = null;
            }
            if(!(["Gray", "Green", "Red", "Blurple"].includes(color))){
                return interaction.reply({content: `❌ ERROR: \`${color} is not a valid color.\``});
            }
            configuration.button.name = name;
            configuration.button.color = color;
            bot.db.set(interaction.guild.id,configuration.button, "button");
            interaction.reply({content: `Following properties were set:
Name: ${name}
Color: ${color}${emoji !== "" ? `
Emoji: ${emoji}` : ""}`});
            return this.updateCaptcha(interaction,configuration);
        }
    }

    acRun(interaction){
        const focus = interaction.options.getFocused(true);
        if(focus.name === "color") {
            interaction.respond(["Gray", "Green", "Red", "Blurple"].filter(x => x.toLowerCase().startsWith(focus.value.toLowerCase())).map(x => ({name: x, value: x})));
        } else {
            interaction.respond([]);
        }
    }

    resolveStyle(style){
        switch(style){
            case "Gray":
                return ButtonStyle.Secondary;
            case "Green":
                return ButtonStyle.Success;
            case "Red":
                return ButtonStyle.Danger;
            case "Blurple":
            default:
                return ButtonStyle.Primary;
        }
    }

    updateCaptcha(interaction,configuration){
        if(configuration.post === null) return;
        interaction.guild.channels.cache.get(configuration.post.split("/")[1])
            .messages.fetch({message: configuration.post.split("/")[2], force: true}).then(message => {
            const button = new ButtonBuilder()
                .setLabel(configuration.button.name)
                .setCustomId(`captcha-${interaction.guild.id}`)
                .setStyle(this.resolveStyle(configuration.button.color));
            if(configuration.button.emoji !== null){
                let emoji = configuration.button.emoji;
                if(/(\d{17,19})/.test(emoji)){
                    emoji = bot.emojis.resolve(emoji);
                    if(emoji){
                        button.setEmoji(emoji);
                    }
                } else {
                    button.setEmoji(configuration.button.emoji);
                }
            }
            message.edit({
                content: configuration.message,
                components: [
                    new ActionRowBuilder().setComponents([button])
                ]
            });
        }).catch(() => {
            console.log("Post information invalid, resetting it.");
            bot.db.set(interaction.guild.id, null, "post");
        });
    }
}
module.exports = new setup();