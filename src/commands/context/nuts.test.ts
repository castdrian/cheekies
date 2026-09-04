import * as path from "node:path";

import { expect, mock, test } from "bun:test";
import type { MessageContextMenuCommandInteraction } from "discord.js";

import { DEEZ_NUTS_CLIP_PATH, DeezNutsCommand } from "./nuts";

test("sends the Yeonhee deez nuts clip without random selection", async () => {
	const reply = mock(async (_options: unknown) => ({}));
	const command = Object.create(DeezNutsCommand.prototype) as DeezNutsCommand;
	const interaction = {
		isMessageContextMenuCommand: true,
		targetMessage: { author: { toString: () => "@yeonhee" } },
		reply,
	} as unknown as MessageContextMenuCommandInteraction;
	const originalRandom = Math.random;
	const random = mock(() => 0.5);
	Math.random = random;

	try {
		await command.contextMenuRun(interaction);
	} finally {
		Math.random = originalRandom;
	}

	expect(path.basename(DEEZ_NUTS_CLIP_PATH)).toBe("DEEZNUTS.mov");
	expect(await Bun.file(DEEZ_NUTS_CLIP_PATH).exists()).toBe(true);
	expect(random).not.toHaveBeenCalled();
	expect(reply).toHaveBeenCalledWith({
		content: "@yeonhee",
		files: [DEEZ_NUTS_CLIP_PATH],
	});
});
