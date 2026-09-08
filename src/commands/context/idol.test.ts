import * as path from "node:path";

import { expect, mock, test } from "bun:test";
import type { MessageContextMenuCommandInteraction } from "discord.js";

import { IdolCommand } from "./idol";

test("replies to the target message and mentions its author", async () => {
	const reply = mock(async (_options: unknown) => ({}));
	const command = Object.create(IdolCommand.prototype) as IdolCommand;
	const interaction = {
		isMessageContextMenuCommand: true,
		targetMessage: {
			author: { id: "123", toString: () => "<@123>" },
		},
		reply,
	} as unknown as MessageContextMenuCommandInteraction;

	await command.contextMenuRun(interaction);

	const replyOptions = reply.mock.calls[0]?.[0] as {
		allowedMentions: { users: string[] };
		content: string;
		files: string[];
	};

	expect(replyOptions.content).toBe("<@123>");
	expect(replyOptions.allowedMentions).toEqual({ users: ["123"] });
	expect(path.basename(replyOptions.files[0])).toBe("IDOL.mp4");
});
