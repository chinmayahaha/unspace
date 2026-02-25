#!/usr/bin/env node
// Save this as: functions/diagnose.js
// Run from functions folder: node diagnose.js

console.log("=== DIAGNOSING FUNCTION LOAD ERRORS ===\n");

const handlers = [
  ["admin", "./handlers/admin"],
  ["marketplace", "./handlers/marketplace"],
  ["bookExchange", "./handlers/bookExchange"],
  ["community", "./handlers/community"],
  ["businessX", "./handlers/businessX"],
  ["adsX", "./handlers/adsX"],
  ["lostAndFound", "./handlers/lostAndFound"],
  ["messaging", "./handlers/messaging"],
  ["payments", "./services/payments"],
];

let allGood = true;
for (const [name, path] of handlers) {
  try {
    const mod = require(path);
    const keys = Object.keys(mod);
    console.log(`✅ ${name}: OK (exports: ${keys.join(", ")})`);
  } catch (err) {
    console.log(`❌ ${name}: CRASHED`);
    console.log(`   Error: ${err.message}`);
    console.log(`   This file is causing ALL CORS errors!`);
    allGood = false;
  }
}

if (allGood) {
  console.log("\n✅ All handlers load correctly.");
  console.log("The issue is that you haven\'t redeployed yet.");
  console.log("Run: firebase deploy --only functions");
} else {
  console.log("\n❌ Fix the crashed files above, then redeploy.");
}