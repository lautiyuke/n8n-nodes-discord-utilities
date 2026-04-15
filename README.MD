# n8n-nodes-discord-utilities

Community nodes for [n8n](https://n8n.io/) focused on Discord-related utilities.

This package currently includes two nodes and is designed to grow over time with more utilities for Discord integrations, automations, and webhook handling inside n8n.

## Current Nodes

### Discord Signature Validator

Validates Discord request signatures using the ED25519 public key of your Discord application.

This is useful when you receive Discord interaction requests through a webhook and need to verify that the request really comes from Discord before continuing your workflow.

### Discord Raw Trigger

Connects to the Discord Gateway using the official n8n Discord credential and starts a workflow whenever Discord emits RAW gateway packets.

This is useful when you want to react to low-level Discord events such as `MESSAGE_CREATE`, `MESSAGE_UPDATE`, `GUILD_MEMBER_ADD`, or any other gateway dispatch event before or without relying on the higher-level abstractions of `discord.js`.

## Installation

### Option 1: From the n8n Community Nodes UI

In your n8n instance:

1. Go to **Settings** > **Community Nodes**.
2. Select **Install**.
3. Search for `n8n-nodes-discord-utilities`.
4. Install the package and restart n8n if needed.

### Option 2: With npm

Install the package in the same environment where n8n is running:

```bash
npm install n8n-nodes-discord-utilities
```

Then restart your n8n instance.

## Using Discord Signature Validator

The node expects the values required by Discord signature verification:

- `Public Key (hex)`: your Discord application's public key in hexadecimal format.
- `Signature (hex)`: the `x-signature-ed25519` header.
- `Timestamp`: the `x-signature-timestamp` header.
- `Raw Body`: the raw request body as an unparsed string.

### Output

The node returns an item containing:

- `valid`: `true` if the signature is valid, otherwise `false`.
- `signature`: the received signature.
- `timestamp`: the received timestamp.
- `messageSample`: a short sample of the raw body when validation succeeds.
- `error`: an error message when parsing or validation fails unexpectedly.

## Using Discord Raw Trigger

The trigger opens a Discord gateway connection using an existing `Discord Bot API` credential from n8n and emits workflow items containing the RAW packet data received from Discord.

### Main Parameters

- `Credential for Discord Bot API`: select the same official n8n credential used by the built-in Discord node. The trigger reads the `Bot Token` from there.
- `Gateway Intents`: the gateway intents Discord should enable for this connection.
- `Event Names`: optional comma-separated gateway event names such as `MESSAGE_CREATE, MESSAGE_UPDATE`.
- `Disable Self Message Notifications`: when enabled, skips message events where the author id matches the bot's own user id (useful to avoid reacting to messages sent by the bot itself).

### More Options

- `Include Non-Dispatch Packets`: emits packets without `t`, such as gateway acknowledgements.
- `Emit Client Lifecycle Events`: optionally emits `ready`, `warn`, `error`, and `invalidated` events as workflow items.

### Output

Each execution returns one item per gateway packet with fields like:

- `source`: identifies whether the item came from the raw gateway stream or a client lifecycle event.
- `receivedAt`: ISO timestamp of when the event was received.
- `eventName`: the Discord gateway event name, such as `MESSAGE_CREATE`.
- `opcode`: Discord gateway opcode.
- `sequence`: packet sequence number when present.
- `data`: raw event payload from Discord.

## Typical Workflow

A common use case in n8n is:

1. Receive a Discord webhook or interaction request.
2. Preserve the raw request body before parsing it.
3. Read the `x-signature-ed25519` and `x-signature-timestamp` headers.
4. Send those values to `Discord Signature Validator`.
5. Continue the workflow only if `valid` is `true`.

## Notes

- Discord signature validation requires the exact raw body sent by Discord.
- If the body is modified before validation, the signature check will fail.
- `Discord Raw Trigger` reuses n8n's built-in `Discord Bot API` credential instead of defining its own.

## Roadmap

This repository starts with a single node, but more Discord utility nodes are planned in future releases.

Potential additions may include:

- helpers for Discord interactions,
- webhook utilities,
- request/response formatting tools,
- moderation or bot-related helpers.

## Development

Repository: [github.com/lautiyuke/n8n-nodes-discord-utilities](https://github.com/lautiyuke/n8n-nodes-discord-utilities)

To publish a new version, the repository includes npm release scripts and a GitHub Actions workflow that publishes tagged releases to npm.

## License

[MIT](./LICENSE)
