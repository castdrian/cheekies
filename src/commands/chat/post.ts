import { canSendMessages } from "@sapphire/discord.js-utilities";
import { Command } from "@sapphire/framework";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	type CommandInteraction,
	ModalBuilder,
	ModalSubmitInteraction,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";

export class InfoCommand extends Command {
	public override async chatInputRun(interaction: CommandInteraction) {
		try {
			if (!interaction.isChatInputCommand()) return;
			if (!interaction.inCachedGuild()) return;

			const channel = interaction.options.getChannel("channel", true, [
				ChannelType.GuildText,
				ChannelType.GuildAnnouncement,
			]);

			if (!canSendMessages(channel))
				return interaction.reply({
					content: "cheekies cannot send messages to that channel.",
					ephemeral: true,
				});

			const mentionsDisabled =
				interaction.options.getBoolean("disable_mentions") ?? false;
			const file = interaction.options.getAttachment("file")?.url;

			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setCustomId("message")
					.setLabel("Add Message")
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId("file")
					.setLabel("Send File Only")
					.setStyle(ButtonStyle.Primary),
			);

			const modal = new ModalBuilder()
				.setCustomId("post_message_modal")
				.setTitle(`Send message to ${channel.name}`)
				.addComponents(
					new ActionRowBuilder<TextInputBuilder>().addComponents(
						new TextInputBuilder()
							.setCustomId("post_message_content")
							.setStyle(TextInputStyle.Paragraph)
							.setLabel("Message Content")
							.setRequired(true)
							.setMaxLength(2000),
					),
				);

			if (file) {
				await interaction.reply({ components: [row], ephemeral: true });

				const collector = interaction.channel!.createMessageComponentCollector({
					filter: (i) => i.user.id === interaction.user.id,
					time: 60000,
				});

				collector.on("collect", async (i) => {
					if (i.customId === "message") {
						await i.showModal(modal);

						const submit = await i
							.awaitModalSubmit({
								filter: (int) => int.customId === "post_message_modal",
								time: 60000,
							})
							.catch(() =>
								interaction.followUp({
									content: "Message modal timed out.",
									ephemeral: true,
								}),
							);

						if (submit instanceof ModalSubmitInteraction) {
							await submit.deferReply({ ephemeral: true });

							const content = submit.fields.getTextInputValue(
								"post_message_content",
							);

							await channel.send({
								content,
								files: file ? [file] : undefined,
								allowedMentions: mentionsDisabled ? { parse: [] } : undefined,
							});
							await submit.deleteReply().catch(() => null);
							await i.deleteReply().catch(() => null);
						}
					}
					if (i.customId === "file") {
						await i.deferUpdate();
						await channel.send({
							files: file ? [file] : undefined,
							allowedMentions: mentionsDisabled ? { parse: [] } : undefined,
						});
						await i.deleteReply().catch(() => null);
					}
				});

				collector.on("end", async () => {
					await interaction.deleteReply().catch(() => null);
				});
			} else {
				await interaction.showModal(modal);

				const submit = await interaction
					.awaitModalSubmit({
						filter: (i) => i.customId === "post_message_modal",
						time: 60000,
					})
					.catch(() =>
						interaction.followUp({
							content: "Message modal timed out.",
							ephemeral: true,
						}),
					);

				if (submit instanceof ModalSubmitInteraction) {
					await submit.deferReply({ ephemeral: true });

					const content = submit.fields.getTextInputValue(
						"post_message_content",
					);
					await channel.send({
						content,
						allowedMentions: mentionsDisabled ? { parse: [] } : undefined,
					});
					await submit.deleteReply().catch(() => null);
				}
			}
		} catch (ex) {
			this.container.logger.error(ex);
		}
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName("post")
				.setDescription("send message to channel")
				.addChannelOption((option) =>
					option //
						.setName("channel")
						.setDescription("channel to send message to")
						.setRequired(true)
						.addChannelTypes(
							ChannelType.GuildText,
							ChannelType.GuildAnnouncement,
						),
				)
				.addBooleanOption((option) =>
					option //
						.setName("disable_mentions")
						.setDescription("disable mentions"),
				)
				.addAttachmentOption((option) =>
					option //
						.setName("file")
						.setDescription("file to send"),
				)
				.setDefaultMemberPermissions(0),
		);
	}
}
