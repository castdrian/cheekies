import { Command } from "@sapphire/framework";
import {
	ActionRowBuilder,
	ApplicationCommandType,
	Message,
	type MessageContextMenuCommandInteraction,
	ModalBuilder,
	ModalSubmitInteraction,
	type TextChannel,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";

export class EditCommand extends Command {
	public override async contextMenuRun(
		interaction: MessageContextMenuCommandInteraction,
	) {
		try {
			if (
				!interaction.isMessageContextMenuCommand &&
				!(interaction.targetMessage instanceof Message)
			)
				return;
			if (interaction.targetMessage.author.id !== interaction.client.id) return;

			const modal = new ModalBuilder()
				.setCustomId("edit_message_modal")
				.setTitle(
					`Edit message in ${(interaction.targetMessage.channel as TextChannel).name}`,
				)
				.addComponents(
					new ActionRowBuilder<TextInputBuilder>().addComponents(
						new TextInputBuilder()
							.setCustomId("edit_message_content")
							.setStyle(TextInputStyle.Paragraph)
							.setLabel("Message Content")
							.setValue(interaction.targetMessage.content)
							.setRequired(true)
							.setMaxLength(2000),
					),
				);

			await interaction.showModal(modal);

			const submit = await interaction
				.awaitModalSubmit({
					filter: (i) => i.customId === "edit_message_modal",
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

				const content = submit.fields.getTextInputValue("edit_message_content");
				await interaction.targetMessage.edit(content);
				await submit.deleteReply();
			}
		} catch (ex) {
			this.container.logger.error(ex);
		}
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerContextMenuCommand((builder) =>
			builder //
				.setName("Edit message")
				.setType(ApplicationCommandType.Message)
				.setDefaultMemberPermissions(0),
		);
	}
}
