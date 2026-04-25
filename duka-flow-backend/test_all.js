'use strict';
/**
 * test_all.js — DukaFlow Master Test Runner
 *
 * Usage:
 *   node test_all.js              — run all phases
 *   node test_all.js --phase 5    — run only phase 5 (no server needed)
 *
 * Requires: server running on port 3000 for integration tests
 *   Start with: node server.js
 */

const { execSync } = require('child_process');
const path = require('path');

const TESTS = [
  { phase: 3, file: 'tests/test_phase3_auth.js',        label: 'Auth System',         needsServer: true  },
  { phase: 4, file: 'tests/test_phase4_onboarding.js',  label: 'Onboarding + Shop',   needsServer: true  },
  { phase: 5, file: 'tests/test_phase5_permissions.js', label: 'Permission Matrix',    needsServer: false },
  { phase: 6, file: 'tests/test_phase6_employees.js',   label: 'Employee Management', needsServer: true  },
  { phase: 7, file: 'tests/test_phase7_products.js',    label: 'Products + Stock',     needsServer: true  },
];

const args = process.argv.slice(2);
const phaseFilter = args.includes('--phase')
  ? parseInt(args[args.indexOf('--phase') + 1])
  : null;
const selected = phaseFilter ? TESTS.filter(t => t.phase === phaseFilter) : TESTS;

if (selected.length === 0) {
  console.error(`No test found for phase ${phaseFilter}`);
  process.exit(1);
}

let totalPassed = 0;
let totalFailed = 0;

console.log('╔══════════════════════════════════════════╗');
console.log('║      DUKAFLOW — MASTER TEST RUNNER       ║');
console.log(`║      Running ${selected.length} phase test(s)               ║`);
console.log('╚══════════════════════════════════════════╝\n');

for (const test of selected) {
  const filePath = path.join(__dirname, test.file);

  console.log(`▶  PHASE ${test.phase}: ${test.label}`);
  if (test.needsServer) console.log('   ⚠  Requires server on port 3000');
  console.log('─'.repeat(44));

  try {
    execSync(`node "${filePath}"`, { stdio: 'inherit', cwd: __dirname });
    console.log(`✅ Phase ${test.phase} — PASSED\n`);
    totalPassed++;
  } catch {
    console.error(`❌ Phase ${test.phase} — FAILED\n`);
    totalFailed++;
  }
}

console.log('╔══════════════════════════════════════════╗');
if (totalFailed === 0) {
  console.log(`║  ✅ ALL ${totalPassed} PHASE(S) PASSED                  ║`);
} else {
  console.log(`║  ❌ ${totalFailed} FAILED / ${totalPassed} PASSED                    ║`);
}
console.log('╚══════════════════════════════════════════╝');
process.exit(totalFailed > 0 ? 1 : 0);
