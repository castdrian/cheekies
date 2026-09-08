import * as path from "node:path";

import { expect, mock, test } from "bun:test";
import {
	Collection,
	type MessageContextMenuCommandInteraction,
	TextInputStyle,
} from "discord.js";

import { DEEZ_NUTS_CLIP_PATH, DeezNutsCommand } from "./nuts";

function createInteraction({
	allowMentionsToPing = true,
	input,
	selectedUserIds = [],
}: {
	allowMentionsToPing?: boolean;
	input: string;
	selectedUserIds?: string[];
}) {
	const showModal = mock(async (_modal: unknown) => {});
	const submitReply = mock(async (_options: unknown) => ({}));
	const submit = {
		customId: "deez_nuts_modal",
		fields: {
			getCheckbox: mock(() => allowMentionsToPing),
			getSelectedUsers: mock(
				() => new Collection(selectedUserIds.map((id) => [id, {}])),
			),
			getTextInputValue: mock(() => input),
		},
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

test("shows an optional message modal and sends selected users and text after the mention", async () => {
	const { awaitModalSubmit, interaction, showModal, submitReply } =
		createInteraction({
			input: "inserted text",
			selectedUserIds: ["456", "789"],
		});
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
				component: {
					custom_id: string;
					max_length?: number;
					max_values?: number;
					min_values?: number;
					required?: boolean;
					style?: number;
					type: number;
					default?: boolean;
				};
				description?: string;
				label: string;
			}>;
			custom_id: string;
		};
	};
	const modalData = modal.toJSON();

	expect(modalData.custom_id).toBe("deez_nuts_modal");
	expect(modalData.components).toMatchObject([
		{
			component: {
				custom_id: "deez_nuts_text",
				max_length: 1993,
				required: false,
				style: TextInputStyle.Paragraph,
				type: 4,
			},
			description: "Optional — appears below the target mention.",
			label: "Extra text",
		},
		{
			component: {
				custom_id: "deez_nuts_users",
				max_values: 10,
				min_values: 0,
				required: false,
				type: 5,
			},
			description: "Optional — choose people to mention.",
			label: "Also ping",
		},
		{
			component: {
				custom_id: "deez_nuts_allow_mentions",
				default: true,
				type: 23,
			},
			description:
				"User mentions typed in the extra text will notify those users.",
			label: "Allow mentions to ping",
		},
	]);
	expect(submitReply).toHaveBeenCalledWith({
		content: "<@123>\n<@456> <@789> inserted text",
		allowedMentions: { parse: ["users"] },
		files: [DEEZ_NUTS_CLIP_PATH],
	});
});

test("sends only the target mention when the modal input is empty", async () => {
	const { interaction, submitReply } = createInteraction({ input: "" });
	const command = Object.create(DeezNutsCommand.prototype) as DeezNutsCommand;

	await command.contextMenuRun(interaction);

	expect(submitReply).toHaveBeenCalledWith({
		content: "<@123>",
		allowedMentions: { parse: ["users"] },
		files: [DEEZ_NUTS_CLIP_PATH],
	});
});

test("allows selected users to ping while typed mentions stay disabled", async () => {
	const { interaction, submitReply } = createInteraction({
		allowMentionsToPing: false,
		input: "typed <@999>",
		selectedUserIds: ["456"],
	});
	const command = Object.create(DeezNutsCommand.prototype) as DeezNutsCommand;

	await command.contextMenuRun(interaction);

	expect(submitReply).toHaveBeenCalledWith({
		content: "<@123>\n<@456> typed <@999>",
		allowedMentions: { users: ["123", "456"] },
		files: [DEEZ_NUTS_CLIP_PATH],
	});
});
