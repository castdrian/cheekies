import { version } from "@root/package.json";
import { ApplyOptions } from "@sapphire/decorators";
import { Listener, type ListenerOptions } from "@sapphire/framework";
import { ActivityType, type Client, User } from "discord.js";

import { config } from "@root/src/config";

@ApplyOptions<ListenerOptions>({ once: true })
export class ReadyListener extends Listener {
	public async run(client: Client) {
		await client.application?.fetch();

		const { username, id } = client.user!;
		this.container.logger.info(
			`Successfully logged in as ${username} (${id}) v${version}`,
		);

		if (!config.devGuildId && client.application?.owner instanceof User) {
			await client.application.owner.send(
				`Successfully logged in as ${username} (${id}) v${version}`,
			);
		}

		const updateActivity = () => {
			client.user?.setActivity({
				type: ActivityType.Custom,
				state: "all the cute cheekies",
				name: "cheekies",
			});
		};

		updateActivity();
		setInterval(updateActivity, 30e3);
	}
}
