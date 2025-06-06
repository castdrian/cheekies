import { Command, version as sapphver } from "@sapphire/framework";
import { version as bunver } from "bun";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	type CommandInteraction,
	ContainerBuilder,
	MessageFlags,
	SectionBuilder,
	TextDisplayBuilder,
	ThumbnailBuilder,
	version as djsver,
	time,
} from "discord.js";
import { cpu, mem, osInfo } from "systeminformation";
import { version as tsver } from "typescript";

import pkg from "@root/package.json";
import { CHEEKIES_COLOR } from "@root/src/config";

export class InfoCommand extends Command {
	public override async chatInputRun(interaction: CommandInteraction) {
		try {
			const { readyAt } = this.container.client;
			const uptimeString = time(readyAt!, "R");

			const { cores, manufacturer, brand } = await cpu();
			const { total } = await mem();
			const { distro, release, arch } = await osInfo();

			const osString = `${distro} ${release} ${arch}`;
			const cpuString = `${cores}x ${manufacturer} ${brand}`;
			const memoryString = `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB / ${Math.round(
				total / 1024 / 1024,
			)} MB`;

			const content = new TextDisplayBuilder().setContent(
				`${pkg.name} [v${pkg.version}](<https://github.com/castdrian/cheekies>)\n${pkg.description}\n\n**Uptime:** Container started ${uptimeString}\n**System:** ${osString}\n**CPU:** ${cpuString}\n**Memory Usage:** ${memoryString}\n\n**Bun:** [v${bunver}](<https://bun.sh/>)\n**TypeScript:** [v${tsver}](<https://www.typescriptlang.org/>)\n**Discord.js:** [v${djsver}](<https://discord.js.org/>)\n**Sapphire:** [v${sapphver}](<https://www.sapphirejs.dev/>)`,
			);

			const section = new SectionBuilder()
				.addTextDisplayComponents(content)
				.setThumbnailAccessory(
					new ThumbnailBuilder().setURL(
						this.container.client.user!.displayAvatarURL(),
					),
				);

			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setLabel("Contact")
					.setStyle(ButtonStyle.Link)
					.setURL("discord://-/users/224617799434108928"),
				new ButtonBuilder()
					.setLabel("Discord")
					.setStyle(ButtonStyle.Link)
					.setURL("https://discord.gg/FmvvwgZzEX"),
				new ButtonBuilder()
					.setLabel("GitHub")
					.setStyle(ButtonStyle.Link)
					.setURL("https://github.com/castdrian/cheekies"),
				new ButtonBuilder()
					.setLabel("Add to Server")
					.setStyle(ButtonStyle.Link)
					.setURL("https://forms.gle/EqwSH6XzFoC2knWs7"),
			);

			const container = new ContainerBuilder()
				.addSectionComponents(section)
				.addActionRowComponents(row)
				.setAccentColor(CHEEKIES_COLOR);

			await interaction.reply({
				components: [container],
				flags: MessageFlags.IsComponentsV2,
			});
			await interaction.followUp({
				content:
					"*This application is currently in its invite-only stage, if you wish to add it to your guild please contact [@castdrian](<https://discord.com/users/224617799434108928>) directly or fill out the access request form.*",
				ephemeral: true,
			});
		} catch (ex) {
			this.container.logger.error(ex);
		}
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName("info")
				.setDescription("info about cheekies"),
		);
	}
}
