import { Listener } from "@sapphire/framework";
import type { GuildMember } from "discord.js";

import {
	getOrCreateGuildSettings,
	isJoinRoleEnabled,
} from "@root/src/database/db";

export class GuildMemberUpdateListener extends Listener {
	public async run(oldMember: GuildMember, newMember: GuildMember) {
		if (!(await isJoinRoleEnabled(newMember.guild.id))) return;
		if (oldMember.pending && !newMember.pending) {
			const settings = await getOrCreateGuildSettings(newMember.guild.id);
			const joinRole = newMember.guild.roles.cache.get(settings.joinRoleId!);
			if (joinRole) {
				await newMember.roles.add(joinRole).catch(() => null);
			}
		}
	}
}
