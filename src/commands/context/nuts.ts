import * as path from "node:path";

import { Command } from "@sapphire/framework";
import {
	ApplicationCommandType,
	ApplicationIntegrationType,
	CheckboxBuilder,
	LabelBuilder,
	Message,
	type MessageContextMenuCommandInteraction,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	UserSelectMenuBuilder,
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
const DEEZ_NUTS_USER_SELECT_ID = "deez_nuts_users";
const DEEZ_NUTS_ALLOW_MENTIONS_ID = "deez_nuts_allow_mentions";
const MAX_MESSAGE_LENGTH = 2000;
const MAX_SELECTED_USERS = 10;

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

			const targetUserId = interaction.targetMessage.author.id;
			const targetMention = interaction.targetMessage.author.toString();
			const modal = new ModalBuilder()
				.setCustomId(DEEZ_NUTS_MODAL_ID)
				.setTitle("DEEZ NUTS")
				.addComponents(
					new LabelBuilder()
						.setLabel("Extra text")
						.setDescription("Optional — appears below the target mention.")
						.setTextInputComponent(
							new TextInputBuilder()
								.setCustomId(DEEZ_NUTS_TEXT_INPUT_ID)
								.setStyle(TextInputStyle.Paragraph)
								.setPlaceholder("Add text after the mention")
								.setRequired(false)
								.setMaxLength(MAX_MESSAGE_LENGTH - targetMention.length - 1),
						),
					new LabelBuilder()
						.setLabel("Also ping")
						.setDescription("Optional — choose people to mention.")
						.setUserSelectMenuComponent(
							new UserSelectMenuBuilder()
								.setCustomId(DEEZ_NUTS_USER_SELECT_ID)
								.setPlaceholder("Select users to ping")
								.setMinValues(0)
								.setMaxValues(MAX_SELECTED_USERS)
								.setRequired(false),
						),
					new LabelBuilder()
						.setLabel("Allow mentions to ping")
						.setDescription(
							"User mentions typed in the extra text will notify those users.",
						)
						.setCheckboxComponent(
							new CheckboxBuilder()
								.setCustomId(DEEZ_NUTS_ALLOW_MENTIONS_ID)
								.setDefault(true),
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
			const selectedUsers = submit.fields.getSelectedUsers(
				DEEZ_NUTS_USER_SELECT_ID,
			);
			const selectedUserIds = selectedUsers ? [...selectedUsers.keys()] : [];
			const selectedMentions = selectedUserIds
				.filter((userId) => userId !== targetUserId)
				.map((userId) => `<@${userId}>`);
			const extraLine = [...selectedMentions, input.trim()]
				.filter((value) => value.length > 0)
				.join(" ");
			const content = extraLine
				? `${targetMention}\n${extraLine}`
				: targetMention;
			const allowedMentions = submit.fields.getCheckbox(
				DEEZ_NUTS_ALLOW_MENTIONS_ID,
			)
				? { parse: ["users"] as const }
				: { users: [...new Set([targetUserId, ...selectedUserIds])] };

			await submit.reply({
				content,
				allowedMentions,
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
