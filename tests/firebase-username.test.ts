import assert from "node:assert/strict";
import test from "node:test";
import {
  InvalidUsernameError,
  normalizeUsername,
  usernameFromInternalEmail,
  usernameToInternalEmail,
} from "../src/firebase/username";

test("member usernames normalize without exposing a real email address", () => {
  assert.equal(normalizeUsername("  Mossy.Otter  "), "mossy.otter");
  assert.equal(
    usernameToInternalEmail("Mossy.Otter"),
    "mossy.otter@members.chapter-house.invalid",
  );
  assert.equal(
    usernameFromInternalEmail(
      "mossy.otter@members.chapter-house.invalid",
    ),
    "mossy.otter",
  );
});

test("member username parsing rejects other domains and malformed handles", () => {
  assert.equal(usernameFromInternalEmail("member@example.com"), null);
  for (const username of [
    "x",
    "ab",
    "-mossy",
    "mossy-",
    "mossy otter",
    "mossy@otter",
    "a".repeat(25),
  ]) {
    assert.throws(() => normalizeUsername(username), InvalidUsernameError);
  }
});
