import { Command } from "@sapphire/framework";
import {
	ActionRowBuilder,
	ButtonBuilder,
	type ButtonInteraction,
	ButtonStyle,
	ChannelSelectMenuBuilder,
	ChannelType,
	type CommandInteraction,
	type MessageComponentInteraction,
	ModalBuilder,
	ModalSubmitInteraction,
	RoleSelectMenuBuilder,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";

import { CHEEKIES_COLOR } from "@root/src/config";
import {
	type GreetingSettings,
	getOrCreateGreetingSettings,
	getOrCreateGuildSettings,
	removeGreetingSettings,
	updateGreetingSettings,
	updateGuildSettings,
} from "@src/database/db";

enum ButtonEmoji {
	ENABLED = "1194304761386770512",
	DISABLED = "1194304728830582785",
	SETTINGS = "1196567420178026516",
}

export class SettingsCommand extends Command {
	public override async chatInputRun(interaction: CommandInteraction) {
		try {
			if (!interaction.isChatInputCommand()) return;
			if (!interaction.inCachedGuild()) return;

			await interaction.reply(await constructResponse());

			async function constructResponse(disabled = false) {
				const settings = await getOrCreateGuildSettings(interaction.guildId!);
				const greetingSettings = await getOrCreateGreetingSettings(
					interaction.guildId!,
				);
				const greetingConfigured = !!(
					greetingSettings.greetingChannelId &&
					greetingSettings.greetingMessageContent &&
					greetingSettings.greetingEmbedTitle &&
					greetingSettings.greetingEmbedDescription
				);

				const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder()
						.setCustomId("x")
						.setLabel("Embed X Posts")
						.setDisabled(disabled)
						.setEmoji(
							settings.XAutoEmbed ? ButtonEmoji.ENABLED : ButtonEmoji.DISABLED,
						)
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId("instagram")
						.setLabel("Embed Instagram Posts")
						.setDisabled(disabled)
						.setEmoji(
							settings.instagramAutoEmbed
								? ButtonEmoji.ENABLED
								: ButtonEmoji.DISABLED,
						)
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId("tiktok")
						.setLabel("Embed TikTok Posts")
						.setDisabled(disabled)
						.setEmoji(
							settings.tiktokAutoEmbed
								? ButtonEmoji.ENABLED
								: ButtonEmoji.DISABLED,
						)
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId("greeting")
						.setLabel("Member Greeting")
						.setDisabled(disabled || !greetingConfigured)
						.setEmoji(
							settings.greetingEnabled
								? ButtonEmoji.ENABLED
								: ButtonEmoji.DISABLED,
						)
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId("joinrole")
						.setLabel("Apply Join Role")
						.setDisabled(disabled || !settings.joinRoleId)
						.setEmoji(
							settings.joinRoleEnabled
								? ButtonEmoji.ENABLED
								: ButtonEmoji.DISABLED,
						)
						.setStyle(ButtonStyle.Primary),
				);

				const alsoRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder()
						.setCustomId("configure_greeting")
						.setLabel("Configure Greeting")
						.setDisabled(disabled)
						.setEmoji(ButtonEmoji.SETTINGS)
						.setStyle(ButtonStyle.Secondary),
				);

				const anotherRow =
					new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
						new RoleSelectMenuBuilder()
							.setCustomId("joinrole_select")
							.setPlaceholder("Select a join role")
							.setDisabled(disabled)
							.addDefaultRoles(settings.joinRoleId ? [settings.joinRoleId] : [])
							.setMinValues(1)
							.setMaxValues(1),
					);

				return { components: [row, alsoRow, anotherRow] };
			}

			const collector = interaction.channel!.createMessageComponentCollector({
				filter: (i) => i.user.id === interaction.user.id,
				time: 60000,
			});

			async function updateEmbedSettings(customId: string) {
				const settings = await getOrCreateGuildSettings(interaction.guildId!);
				const settingKey =
					customId === "x" ? "XAutoEmbed" : "instagramAutoEmbed";
				const settingValue = !settings[settingKey];

				await updateGuildSettings(interaction.guildId!, {
					[settingKey]: settingValue,
				});
			}

			async function testGreeting(
				i: MessageComponentInteraction,
				settings: GreetingSettings,
			) {
				const {
					greetingMessageContent,
					greetingEmbedTitle,
					greetingEmbedDescription,
				} = settings;

				const content = greetingMessageContent?.replace(
					/{{member}}/g,
					i.user.toString(),
				);
				const title = greetingEmbedTitle?.replace(
					/{{guild}}/g,
					i.guild!.toString(),
				);

				const embed =
					greetingEmbedTitle && greetingEmbedDescription
						? {
								title,
								description: greetingEmbedDescription,
								thumbnail: {
									url: i.user.displayAvatarURL(),
								},
								color: CHEEKIES_COLOR,
							}
						: null;

				await i.followUp({
					content,
					embeds: embed ? [embed] : undefined,
					ephemeral: true,
				});
			}

			async function configureGreetingReply() {
				const greetingSettings = await getOrCreateGreetingSettings(
					interaction.guildId!,
				);

				const greetingConfigured = !!(
					greetingSettings.greetingChannelId &&
					greetingSettings.greetingMessageContent &&
					greetingSettings.greetingEmbedTitle &&
					greetingSettings.greetingEmbedDescription
				);

				const greetingChannelSelected = !!greetingSettings.greetingChannelId;

				const row =
					new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
						new ChannelSelectMenuBuilder()
							.setCustomId("greeting_channel")
							.addChannelTypes(ChannelType.GuildText)
							.addDefaultChannels(
								greetingSettings.greetingChannelId
									? [greetingSettings.greetingChannelId]
									: [],
							)
							.setMinValues(1)
							.setMaxValues(1),
					);

				const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder()
						.setCustomId("configure_greeting_message")
						.setLabel("Configure Message")
						.setDisabled(!greetingChannelSelected)
						.setEmoji(ButtonEmoji.SETTINGS)
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId("test_greeting")
						.setLabel("Test Greeting")
						.setDisabled(!greetingConfigured)
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId("remove_greeting")
						.setLabel("Remove Greeting")
						.setDisabled(!greetingConfigured)
						.setStyle(ButtonStyle.Danger),
				);

				return {
					components: [row, buttonRow],
					ephemeral: true,
				};
			}

			async function greetingModal(i: ButtonInteraction) {
				const settings = await getOrCreateGreetingSettings(
					interaction.guildId!,
				);

				const modal = new ModalBuilder()
					.setCustomId("greeting_config_modal")
					.setTitle("Greeting Configuration")
					.addComponents(
						new ActionRowBuilder<TextInputBuilder>().addComponents(
							new TextInputBuilder()
								.setCustomId("greeting_message_content")
								.setStyle(TextInputStyle.Short)
								.setLabel("Message Content")
								.setPlaceholder("hi {{member}}")
								.setRequired(true)
								.setMaxLength(2000)
								.setValue(settings.greetingMessageContent ?? ""),
						),
						new ActionRowBuilder<TextInputBuilder>().addComponents(
							new TextInputBuilder()
								.setCustomId("greeting_embed_title")
								.setStyle(TextInputStyle.Short)
								.setLabel("Embed Title")
								.setPlaceholder("Welcome to {{guild}}!")
								.setRequired(true)
								.setMaxLength(256)
								.setValue(settings.greetingEmbedTitle ?? ""),
						),
						new ActionRowBuilder<TextInputBuilder>().addComponents(
							new TextInputBuilder()
								.setCustomId("greeting_embed_description")
								.setStyle(TextInputStyle.Paragraph)
								.setLabel("Embed Description")
								.setPlaceholder("Thanks for joining!")
								.setRequired(true)
								.setMaxLength(2048)
								.setValue(settings.greetingEmbedDescription ?? ""),
						),
					);

				await i.showModal(modal);

				const submit = await i
					.awaitModalSubmit({
						filter: (int) => int.customId === "greeting_config_modal",
						time: 60000,
					})
					.catch(() =>
						i.followUp({ content: "Config modal timed out.", ephemeral: true }),
					);

				if (submit instanceof ModalSubmitInteraction) {
					await submit.deferUpdate();

					const greetingMessageContent = submit.fields.getTextInputValue(
						"greeting_message_content",
					);
					const greetingEmbedTitle = submit.fields.getTextInputValue(
						"greeting_embed_title",
					);
					const greetingEmbedDescription = submit.fields.getTextInputValue(
						"greeting_embed_description",
					);

					await updateGreetingSettings(interaction.guildId!, {
						greetingMessageContent,
						greetingEmbedTitle,
						greetingEmbedDescription,
					});

					await i.editReply(await configureGreetingReply());
					await interaction.editReply(await constructResponse());
				}
			}

			collector.on("collect", async (i) => {
				if (i.customId === "x" || i.customId === "instagram") {
					await updateEmbedSettings(i.customId);
					await i.update(await constructResponse());
				}
				if (i.customId === "greeting") {
					const settings = await getOrCreateGuildSettings(interaction.guildId!);
					const greetingEnabled = !settings.greetingEnabled;

					await updateGuildSettings(interaction.guildId!, { greetingEnabled });
					await i.update(await constructResponse());
				}
				if (i.customId === "tiktok") {
					const settings = await getOrCreateGuildSettings(interaction.guildId!);
					const tiktokEnabled = !settings.tiktokAutoEmbed;

					await updateGuildSettings(interaction.guildId!, {
						tiktokAutoEmbed: tiktokEnabled,
					});
					await i.update(await constructResponse());
				}
				if (i.customId === "configure_greeting") {
					await i.reply(await configureGreetingReply());
				}
				if (i.customId === "greeting_channel") {
					if (!i.isChannelSelectMenu()) return;
					const greetingChannelId = i.values[0];
					await updateGreetingSettings(interaction.guildId!, {
						greetingChannelId,
					});
					await i.update(await configureGreetingReply());
				}
				if (i.customId === "configure_greeting_message") {
					await greetingModal(i as ButtonInteraction);
				}
				if (i.customId === "test_greeting") {
					await i.deferUpdate();
					const settings = await getOrCreateGreetingSettings(
						interaction.guildId!,
					);
					await testGreeting(i, settings);
				}
				if (i.customId === "remove_greeting") {
					await i.deferUpdate();
					await removeGreetingSettings(interaction.guildId!);
					await updateGuildSettings(interaction.guildId!, {
						greetingEnabled: false,
					});

					await i.editReply(await configureGreetingReply());
					await interaction.editReply(await constructResponse());
				}
				if (i.customId === "joinrole") {
					const settings = await getOrCreateGuildSettings(interaction.guildId!);
					const joinRoleEnabled = !settings.joinRoleEnabled;

					await updateGuildSettings(interaction.guildId!, { joinRoleEnabled });
					await i.update(await constructResponse());
				}
				if (i.customId === "joinrole_select") {
					if (!i.isRoleSelectMenu()) return;
					const joinRoleId = i.values[0];
					await updateGuildSettings(interaction.guildId!, { joinRoleId });
					await i.update(await constructResponse());
				}
			});

			collector.on("end", async () => {
				await interaction.editReply(await constructResponse(true));
			});
		} catch (ex) {
			this.container.logger.error(ex);
		}
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName("settings")
				.setDescription("configure guild settings")
				.setDefaultMemberPermissions(0),
		);
	}
}
