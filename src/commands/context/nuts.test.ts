import * as path from "node:path";

import { expect, mock, test } from "bun:test";
import {
	type MessageContextMenuCommandInteraction,
	TextInputStyle,
} from "discord.js";

import { DEEZ_NUTS_CLIP_PATH, DeezNutsCommand } from "./nuts";

function createInteraction(input: string) {
	const showModal = mock(async (_modal: unknown) => {});
	const submitReply = mock(async (_options: unknown) => ({}));
	const submit = {
		customId: "deez_nuts_modal",
		fields: { getTextInputValue: mock(() => input) },
		reply: submitReply,
		user: { id: "runner" },
	};
	const awaitModalSubmit = mock(async (_options: unknown) => submit);
	const interaction = {
		awaitModalSubmit,
		id: "interaction-1",
		isMessageContextMenuCommand: true,
		showModal,
		targetMessage: {
			author: { id: "123", toString: () => "<@123>" },
		},
		user: { id: "runner" },
	} as unknown as MessageContextMenuCommandInteraction;

	return { awaitModalSubmit, interaction, showModal, submitReply };
}

test("shows an optional message modal and sends the inserted text after the mention", async () => {
	const { awaitModalSubmit, interaction, showModal, submitReply } =
		createInteraction("inserted text for <@456>");
	const command = Object.create(DeezNutsCommand.prototype) as DeezNutsCommand;
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
	expect(showModal).toHaveBeenCalledTimes(1);
	expect(awaitModalSubmit).toHaveBeenCalledTimes(1);
	const modal = showModal.mock.calls[0]?.[0] as {
		toJSON: () => {
			components: Array<{
				components: Array<{
					custom_id: string;
					max_length: number;
					required: boolean;
					style: number;
				}>;
			}>;
			custom_id: string;
		};
	};
	const modalData = modal.toJSON();
	const textInput = modalData.components[0]?.components[0];

	expect(modalData.custom_id).toBe("deez_nuts_modal");
	expect(textInput).toMatchObject({
		custom_id: "deez_nuts_text",
		max_length: 1993,
		required: false,
		style: TextInputStyle.Paragraph,
	});
	expect(submitReply).toHaveBeenCalledWith({
		content: "<@123>\ninserted text for <@456>",
		allowedMentions: { parse: ["users"] },
		files: [DEEZ_NUTS_CLIP_PATH],
	});
});

test("sends only the target mention when the modal input is empty", async () => {
	const { interaction, submitReply } = createInteraction("");
	const command = Object.create(DeezNutsCommand.prototype) as DeezNutsCommand;

	await command.contextMenuRun(interaction);

	expect(submitReply).toHaveBeenCalledWith({
		content: "<@123>",
		allowedMentions: { parse: ["users"] },
		files: [DEEZ_NUTS_CLIP_PATH],
	});
});
