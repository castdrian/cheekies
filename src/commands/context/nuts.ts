import * as path from "node:path";

import { Command } from "@sapphire/framework";
import {
	ActionRowBuilder,
	ApplicationCommandType,
	ApplicationIntegrationType,
	Message,
	type MessageContextMenuCommandInteraction,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";

export const DEEZ_NUTS_CLIP_PATH = path.join(
	path.dirname(new URL(import.meta.url).pathname),
	"..",
	"..",
	"..",
	"media",
	"DEEZNUTS.mov",
);

const DEEZ_NUTS_MODAL_ID = "deez_nuts_modal";
const DEEZ_NUTS_TEXT_INPUT_ID = "deez_nuts_text";
const MAX_MESSAGE_LENGTH = 2000;

export class DeezNutsCommand extends Command {
	public override async contextMenuRun(
		interaction: MessageContextMenuCommandInteraction,
	) {
		try {
			if (
				!interaction.isMessageContextMenuCommand &&
				!(interaction.targetMessage instanceof Message)
			)
				return;

			const targetMention = interaction.targetMessage.author.toString();
			const modal = new ModalBuilder()
				.setCustomId(DEEZ_NUTS_MODAL_ID)
				.setTitle("DEEZ NUTS")
				.addComponents(
					new ActionRowBuilder<TextInputBuilder>().addComponents(
						new TextInputBuilder()
							.setCustomId(DEEZ_NUTS_TEXT_INPUT_ID)
							.setStyle(TextInputStyle.Paragraph)
							.setLabel("Optional text")
							.setPlaceholder("Add text after the mention")
							.setRequired(false)
							.setMaxLength(MAX_MESSAGE_LENGTH - targetMention.length - 1),
					),
				);

			await interaction.showModal(modal);

			const submit = await interaction
				.awaitModalSubmit({
					filter: (modalInteraction) =>
						modalInteraction.customId === DEEZ_NUTS_MODAL_ID &&
						modalInteraction.user.id === interaction.user.id,
					time: 60000,
				})
				.catch(() => null);

			if (!submit) return;

			const input = submit.fields.getTextInputValue(DEEZ_NUTS_TEXT_INPUT_ID);
			const content = input.trim()
				? `${targetMention}\n${input}`
				: targetMention;

			await submit.reply({
				content,
				allowedMentions: { parse: ["users"] },
				files: [DEEZ_NUTS_CLIP_PATH],
			});
		} catch (ex) {
			this.container.logger.error(ex);
		}
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerContextMenuCommand((builder) =>
			builder //
				.setName("DEEZ NUTS")
				.setIntegrationTypes([
					ApplicationIntegrationType.GuildInstall,
					ApplicationIntegrationType.UserInstall,
				])
				.setType(ApplicationCommandType.Message),
		);
	}
}
