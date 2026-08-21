import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const source = await fs.readFile(path.join(root, "starter-player.mjs"), "utf8");

function extractFunction(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `function ${name} is missing`);
  const end = source.indexOf("\n}", start);
  assert.ok(end > start, `function ${name} has no closing brace`);
  return source.slice(start, end + 2);
}

const dealKinds = source.match(
  /const DEAL_ACTION_KINDS = \[[\s\S]*?\];/,
)?.[0];
assert.ok(dealKinds, "DEAL_ACTION_KINDS is missing");

const api = new Function(
  [
    dealKinds,
    extractFunction("isDealActionKind"),
    extractFunction("activePromiseConstraints"),
    extractFunction("wouldBreakPromise"),
    extractFunction("preferReciprocalAlliance"),
    extractFunction("pendingRenewalAction"),
    extractFunction("chooseAction"),
    "return { chooseAction, pendingRenewalAction, preferReciprocalAlliance };",
  ].join("\n"),
)();

const ATTACK = {
  id: "attack:P_FOE",
  kind: "attack",
  label: "Attack Foe",
  risk: { level: "low" },
  metadata: { targetID: "P_FOE" },
};
const HOLD = {
  id: "hold",
  kind: "hold",
  label: "Hold",
  risk: { level: "none" },
  metadata: {},
};
const EXTEND = {
  id: "alliance_extend:P_ALLY",
  kind: "alliance_extend",
  label: "Extend alliance with Ally",
  risk: { level: "none" },
  metadata: { targetID: "P_ALLY" },
};
const ASKED = {
  id: "alliance_request:P_ASKED",
  kind: "alliance_request",
  label: "Ask Asked",
  risk: { level: "low" },
  metadata: { targetID: "P_ASKED" },
};
const STRANGER = {
  id: "alliance_request:P_STRANGER",
  kind: "alliance_request",
  label: "Ask Stranger",
  risk: { level: "low" },
  metadata: { targetID: "P_STRANGER" },
};

function observation({ renewalRequested = false, incomingFrom = null } = {}) {
  return {
    ownState: { playerID: "P_ME" },
    visiblePlayers: [
      {
        playerID: "P_ALLY",
        isAlive: true,
        isAllied: true,
        allianceOtherAgreedToExtend: renewalRequested,
      },
      {
        playerID: "P_ASKED",
        isAlive: true,
        isAllied: false,
        hasIncomingAllianceRequest: incomingFrom === "P_ASKED",
      },
      {
        playerID: "P_STRANGER",
        isAlive: true,
        isAllied: false,
        hasIncomingAllianceRequest: incomingFrom === "P_STRANGER",
      },
      { playerID: "P_FOE", isAlive: true, isAllied: false },
    ],
  };
}

test("renews an alliance when the ally is already waiting", () => {
  const picked = api.pendingRenewalAction(
    [ATTACK, EXTEND],
    observation({ renewalRequested: true }),
  );
  assert.equal(picked?.id, EXTEND.id);
});

test("does not invent or prematurely send a renewal", () => {
  assert.equal(
    api.pendingRenewalAction(
      [ATTACK, EXTEND],
      observation({ renewalRequested: false }),
    ),
    null,
  );
  assert.equal(
    api.pendingRenewalAction(
      [ATTACK],
      observation({ renewalRequested: true }),
    ),
    null,
  );
  assert.equal(api.pendingRenewalAction(undefined, undefined), null);
});

test("waiting renewal pre-empts the ordinary attack priority", () => {
  assert.equal(
    api.chooseAction(
      [ATTACK, EXTEND, HOLD],
      observation({ renewalRequested: true }),
    ).id,
    EXTEND.id,
  );
  assert.equal(
    api.chooseAction(
      [ATTACK, EXTEND, HOLD],
      observation({ renewalRequested: false }),
    ).id,
    ATTACK.id,
  );
});

test("alliance_extend is reachable and ranked ahead of a new request", () => {
  const listStart = source.indexOf("const preferredKinds = [");
  const listEnd = source.indexOf("];", listStart);
  const list = source.slice(listStart, listEnd);
  assert.ok(list.includes('"alliance_extend"'));
  assert.ok(
    list.indexOf('"alliance_extend"') < list.indexOf('"alliance_request"'),
  );
});

test("aims an alliance request at the rival that already asked", () => {
  const picked = api.preferReciprocalAlliance(
    [STRANGER, ASKED],
    observation({ incomingFrom: "P_ASKED" }),
    "alliance_request",
  );
  assert.equal(picked?.id, ASKED.id);
  assert.equal(
    api.preferReciprocalAlliance(
      [STRANGER, ASKED],
      observation(),
      "alliance_request",
    ),
    null,
  );
});

test("entry point completes the mutual alliance handshake", () => {
  assert.equal(
    api.chooseAction(
      [STRANGER, ASKED, HOLD],
      observation({ incomingFrom: "P_ASKED" }),
    ).id,
    ASKED.id,
  );
  assert.equal(
    api.chooseAction([STRANGER, ASKED, HOLD], observation()).id,
    STRANGER.id,
  );
});
