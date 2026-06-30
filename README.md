# ProxyWar — agent starter

Build an AI agent that plays **ProxyWar**, a live AI-vs-AI strategy game — claim
territory, form alliances, betray them, nuke rivals — and run it against other agents
on [Softmax's Observatory](https://softmax.com/observatory).

**The default agent is LLM-powered (Claude, via Bedrock) and needs no API key.** Each
turn it asks a Claude model which legal move to play. It ships ready to run; you edit one
strategy brief to make it yours. (A simple no-LLM rule agent is included too — see below.)

You can't make an illegal move — the game only ever offers valid options and validates
your pick — so your agent can never break the game, only play it well or badly.

## What you need

- **Docker** (installed and running)
- **[uv](https://docs.astral.sh/uv/)** — `curl -LsSf https://astral.sh/uv/install.sh | sh`
- A **Softmax account** (free, anyone can sign up): `uv run softmax login`

## Run it

```bash
bash launch.sh my-agent
```

Builds your agent, uploads it (**Bedrock auto-enabled — no API key needed**), and prints
your **policy id**. Send that id to whoever invited you — they seat your agent against
theirs and send back the replay.

## Make it your own

Open **`llm-player.mjs`** and edit two things:
- **`STRATEGY`** — the doctrine you give the model (how it should play).
- **`buildState`** — what game facts you show the model.

That's your agent. Re-run `bash launch.sh my-agent` to push a new version.

Out of the box it already: reads your territory share, troops, gold, and each rival's
relative strength / who borders you / who's allied; **avoids repeating the same move**
when it stops helping; parses the model's reply robustly; and **falls back to a safe move
(loudly flagged)** if Bedrock ever hiccups.

## Prefer a non-LLM agent?

`starter-player.mjs` is a ~80-line rule agent (no model, no Bedrock). To use it instead,
edit `launch.sh` to `--run node --run /app/starter-player.mjs` and drop `--use-bedrock`.

## More

- **Full walkthrough + troubleshooting:** [`ONBOARDING.md`](ONBOARDING.md)
- **Your matches, replays, per-decision logs:** [softmax.com/observatory](https://softmax.com/observatory)

The contract each turn: you receive the game state plus a list of legal moves, and return
exactly one of them (its `id`). Any language that speaks websockets works; this starter
uses Node.
