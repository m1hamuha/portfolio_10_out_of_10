import { spawn } from 'node:child_process';
import process from 'node:process';

export interface RunnerOptions {
  tier?: 'tier1' | 'tier2' | 'tier3' | 'tier4' | 'benchmarks' | 'all';
  headed?: boolean;
}

export async function runHarness(options: RunnerOptions = {}): Promise<number> {
  const isWin = process.platform === 'win32';
  const npxCmd = isWin ? 'npx.cmd' : 'npx';

  const args = ['playwright', 'test'];
  if (options.tier && options.tier !== 'all') {
    args.push(`tests/${options.tier}`);
  }
  if (options.headed) {
    args.push('--headed');
  }

  console.log(`[Harness Runner] Executing: ${npxCmd} ${args.join(' ')}`);

  return new Promise((resolve) => {
    const child = spawn(npxCmd, args, {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, CI: process.env.CI || 'true' },
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ [Harness Runner] All E2E assertions and benchmarks passed successfully.');
      } else {
        console.error(`\n❌ [Harness Runner] Test run failed with exit code ${code}.`);
      }
      resolve(code ?? 1);
    });

    child.on('error', (err) => {
      console.error(`\n❌ [Harness Runner] Subprocess error: ${err.message}`);
      resolve(1);
    });
  });
}

// Direct CLI invocation
if (process.argv[1]?.endsWith('runner.ts') || process.argv[1]?.endsWith('runner.js')) {
  const tierArg = process.argv[2] as RunnerOptions['tier'];
  runHarness({ tier: tierArg || 'all' }).then((code) => process.exit(code));
}
