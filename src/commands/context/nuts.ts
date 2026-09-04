import * as path from "node:path";

import { Command } from "@sapphire/framework";
import {
	ApplicationCommandType,
	ApplicationIntegrationType,
	Message,
	type MessageContextMenuCommandInteraction,
} from "discord.js";

export const DEEZ_NUTS_CLIP_PATH = path.join(
	path.dirname(new URL(import.meta.url).pathname),
	"..",
	"..",
	"..",
	"media",
	"DEEZNUTS.mov",
);

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

			await interaction.reply({
				content: interaction.targetMessage.author.toString(),
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
