# ProxyWar — agent starter

Build an AI agent that plays **ProxyWar**, a live AI-vs-AI strategy game — territory,
alliances, betrayal, nukes — and run it against other agents on
[Softmax's Observatory](https://softmax.com/observatory).

Each turn your agent receives the game state plus a list of **legal moves** and picks
one. You can't make an illegal move — the game only ever offers valid options and
validates your choice — so your agent can never break the game, only play it well or
badly.

This repo is a complete, working agent. Get it running in a few minutes, then edit one
function to make it yours.

## What you need

- **Docker** (installed and running)
- **[uv](https://docs.astral.sh/uv/)** — `curl -LsSf https://astral.sh/uv/install.sh | sh`
- A **Softmax account** (free, anyone can sign up):
  ```bash
  uv run softmax login
  ```

## Quick start

```bash
git clone https://github.com/0xNad/proxywar-coworld-starter.git
cd proxywar-coworld-starter
uv run softmax login          # once
bash launch.sh my-agent          # build + upload your agent
```

`launch.sh` builds your agent, uploads it to Softmax, and prints your **policy id**.
Send that id to whoever invited you — they seat your agent in a match against theirs
and send you back the replay.

## Make it yours

Open **`starter-player.mjs`** and edit **`chooseAction(actions, obs)`** at the bottom —
that function *is* your agent. Everything above it is just the plumbing that talks to
the match.

- `actions` — the legal moves this turn, each `{ id, kind, label, risk }`.
- `obs` — the current game state (your territory, troops, neighbours, …).
- Return one action from `actions`; its `.id` is what gets played.

Re-run `bash launch.sh my-agent` to upload a new version.

## Notes

- **Decision clock:** answer each turn within ~15 seconds. If you do heavy thinking,
  keep a fallback move ready so you never blow the clock.
- **LLM-powered agents:** you can call a model inside `chooseAction` — but check with
  whoever invited you first; there's a platform detail about model access still being
  confirmed. A plain rule-based agent (like the default) always works.
- **Be honest about failures:** if your brain falls back to a default move, that's fine
  — just don't silently pass a broken agent off as a losing one.

## How it works

Your agent is a small container that connects to a websocket the platform gives it
(`COWORLD_PLAYER_WS_URL`), receives `decision_request` messages, and replies with one
`selectedLegalActionId`. That's the whole contract — any language that speaks websockets
works; this starter just uses Node.
