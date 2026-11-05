import assert from "node:assert/strict";
import test from "node:test";
import { getRaceDetailPath, getRaceRouteFromPath } from "../src/utils/raceRoutes.js";

test("race detail URLs round-trip stable race identifiers", () => {
  for (const id of ["TakarazukaKinen", "สนาม ทดสอบ", "race/one"]) {
    const path = getRaceDetailPath(id);
    assert.deepEqual(getRaceRouteFromPath(path), { id });
    assert.deepEqual(getRaceRouteFromPath(`${path}/`), { id });
  }
});

test("directory, other pages and invalid escapes are handled safely", () => {
  assert.equal(getRaceRouteFromPath("/dashboard/races"), null);
  assert.equal(getRaceRouteFromPath("/dashboard/race-replay"), null);
  assert.equal(getRaceRouteFromPath("/dashboard/races/a/extra"), null);
  assert.deepEqual(getRaceRouteFromPath("/dashboard/races/%bad"), { id: "%bad" });
});
