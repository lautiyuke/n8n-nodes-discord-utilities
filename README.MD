# n8n-nodes-discord-utilities

Community nodes for [n8n](https://n8n.io/) focused on Discord-related utilities.

This package currently includes one node and is designed to grow over time with more utilities for Discord integrations, automations, and webhook handling inside n8n.

## Current Nodes

### Discord Signature Validator

Validates Discord request signatures using the ED25519 public key of your Discord application.

This is useful when you receive Discord interaction requests through a webhook and need to verify that the request really comes from Discord before continuing your workflow.

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
- This package currently does not include credentials.

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
