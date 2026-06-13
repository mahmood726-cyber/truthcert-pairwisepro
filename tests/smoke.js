#!/usr/bin/env node
/*
 * Minimal dependency-free smoke test for the shipped TruthCert-PairwisePro
 * single-file app. It does NOT validate statistics (that is the job of
 * tests/validate_pairwisepro.R against R metafor); it guards the integrity
 * of the shipped HTML/JS artifact so a bad edit cannot pass silently:
 *
 *   1. app.js parses as valid JavaScript.
 *   2. Every inline <script> block in the HTML parses as valid JavaScript.
 *   3. The HTML loads no external CSS/JS over the network (offline claim),
 *      i.e. no <link href="http..."> / <script src="http..."> tags.
 *   4. Every local vendor/ script referenced by the HTML exists on disk.
 *
 * Run:  node tests/smoke.js   (exit 0 = pass, 1 = fail)
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const HTML = path.join(ROOT, "TruthCert-PairwisePro-v1.0.html");
const APPJS = path.join(ROOT, "app.js");

let failures = 0;
function check(name, fn) {
  try {
    fn();
    console.log("  ok   " + name);
  } catch (e) {
    failures++;
    console.log("  FAIL " + name + "\n       " + (e && e.message ? e.message : e));
  }
}

// parse without executing: vm.Script throws on syntax errors only.
function assertParses(label, code) {
  new vm.Script(code, { filename: label });
}

const html = fs.readFileSync(HTML, "utf8");

check("app.js parses as valid JavaScript", () => {
  assertParses("app.js", fs.readFileSync(APPJS, "utf8"));
});

check("all inline <script> blocks parse", () => {
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
  let m;
  let n = 0;
  while ((m = re.exec(html)) !== null) {
    const body = m[1];
    if (!body.trim()) continue;
    n++;
    assertParses("inline-script-" + n, body);
  }
  if (n === 0) throw new Error("no inline script blocks found");
});

check("HTML has no external (http) CSS/JS resource tags", () => {
  const ext = [];
  const linkRe = /<link\b[^>]*\bhref=["']https?:\/\/[^"']+["'][^>]*>/gi;
  const scriptRe = /<script\b[^>]*\bsrc=["']https?:\/\/[^"']+["'][^>]*>/gi;
  let m;
  while ((m = linkRe.exec(html)) !== null) ext.push(m[0]);
  while ((m = scriptRe.exec(html)) !== null) ext.push(m[0]);
  if (ext.length) throw new Error("external resource tag(s): " + ext.join(" | "));
});

check("all local vendor/ scripts referenced by HTML exist", () => {
  const re = /<script\b[^>]*\bsrc=["'](\.\/)?(vendor\/[^"']+)["']/gi;
  let m;
  const missing = [];
  let n = 0;
  while ((m = re.exec(html)) !== null) {
    n++;
    const p = path.join(ROOT, m[2]);
    if (!fs.existsSync(p)) missing.push(m[2]);
  }
  if (n === 0) throw new Error("expected at least one vendor/ script reference");
  if (missing.length) throw new Error("missing vendor file(s): " + missing.join(", "));
});

console.log(
  failures === 0
    ? "\nsmoke: all checks passed"
    : "\nsmoke: " + failures + " check(s) failed"
);
process.exit(failures === 0 ? 0 : 1);
