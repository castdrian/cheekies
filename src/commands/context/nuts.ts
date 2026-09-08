import * as path from "node:path";

import { Command } from "@sapphire/framework";
import {
	ApplicationCommandType,
	ApplicationIntegrationType,
	LabelBuilder,
	Message,
	type MessageContextMenuCommandInteraction,
	ModalBuilder,
	TextDisplayBuilder,
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
const MAX_MESSAGE_LENGTH = 2000;
const MAX_SELECTED_USERS = 10;
const MAX_USER_MENTION_LENGTH = 23;
const MIN_USER_MENTION_SYNTAX_LENGTH = 4;
const MENTION_ESCAPE_LENGTH = 1;
const MAX_SELECTED_MENTIONS_LENGTH =
	MAX_SELECTED_USERS * MAX_USER_MENTION_LENGTH + MAX_SELECTED_USERS - 1;

function escapeUserMentionSyntax(input: string) {
	return input.replace(/<(@!?)(\d+)>/g, "<\u200b$1$2>");
}

function getMaxTextInputLength(targetMention: string) {
	const availableMessageLength =
		MAX_MESSAGE_LENGTH -
		targetMention.length -
		1 -
		MAX_SELECTED_MENTIONS_LENGTH -
		1;

	return Math.floor(
		(availableMessageLength * MIN_USER_MENTION_SYNTAX_LENGTH) /
			(MIN_USER_MENTION_SYNTAX_LENGTH + MENTION_ESCAPE_LENGTH),
	);
}

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
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						"The target author will be mentioned first. Choose additional people to ping, then add optional plain text.",
					),
				)
				.addLabelComponents(
					new LabelBuilder()
						.setLabel("People to ping")
						.setDescription(
							"Optional — selected users will be mentioned below the target.",
						)
						.setUserSelectMenuComponent(
							new UserSelectMenuBuilder()
								.setCustomId(DEEZ_NUTS_USER_SELECT_ID)
								.setPlaceholder("Select users to ping")
								.setMinValues(0)
								.setMaxValues(MAX_SELECTED_USERS)
								.setRequired(false),
						),
				)
				.addLabelComponents(
					new LabelBuilder()
						.setLabel("Message text")
						.setDescription("Optional — plain text below the target mention.")
						.setTextInputComponent(
							new TextInputBuilder()
								.setCustomId(DEEZ_NUTS_TEXT_INPUT_ID)
								.setStyle(TextInputStyle.Paragraph)
								.setPlaceholder("Add a message")
								.setRequired(false)
								.setMaxLength(getMaxTextInputLength(targetMention)),
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
			const plainText = escapeUserMentionSyntax(input.trim());
			const selectedMentionsText = selectedMentions.join(" ");
			const extraLine = [selectedMentionsText, plainText]
				.filter((value) => value.length > 0)
				.join(" ");
			const content = extraLine
				? `${targetMention}\n${extraLine}`
				: targetMention;
			const allowedMentions = {
				users: [...new Set([targetUserId, ...selectedUserIds])],
			};

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
