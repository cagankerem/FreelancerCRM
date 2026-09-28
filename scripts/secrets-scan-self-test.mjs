import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const expectedVersion = '8.30.1';
const binary = process.env.GITLEAKS_BIN || 'gitleaks';
const temporary = mkdtempSync(join(tmpdir(), 'freelancercrm-gitleaks-test-'));
chmodSync(temporary, 0o700);

function execute(args) {
  return spawnSync(binary, args, {
    encoding: 'utf8',
    maxBuffer: 5 * 1024 * 1024,
    windowsHide: true,
  });
}

try {
  const version = execute(['version']);
  if (version.error || version.status !== 0 || version.stdout.trim() !== expectedVersion) {
    throw new Error(`Gitleaks ${expectedVersion} gerekli; kurulu sürüm doğrulanamadı.`);
  }
  const fixture = join(temporary, 'fixture');
  mkdirSync(fixture);
  // Random, unused, syntactically plausible token. It never enters the repository.
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const synthetic = `AKIA${Array.from(randomBytes(16), (byte) => alphabet[byte % alphabet.length]).join('')}`;
  writeFileSync(join(fixture, 'synthetic.txt'), `TEST_ONLY=${synthetic}\n`, { mode: 0o600 });
  const report = join(temporary, 'result.json');
  const result = execute([
    'dir',
    '--no-banner',
    '--log-level=error',
    '--redact=100',
    '--report-format=json',
    `--report-path=${report}`,
    fixture,
  ]);
  if (result.error || result.status !== 1) {
    throw new Error(`Sentetik anahtar beklenen şekilde yakalanmadı (tarayıcı çıkışı: ${result.status ?? 'yok'}).`);
  }
  const findings = JSON.parse(readFileSync(report, 'utf8'));
  if (!Array.isArray(findings) || !findings.some((item) => item.File?.endsWith('synthetic.txt'))) {
    throw new Error('Tarayıcı başarısız oldu ancak sentetik anahtar bulgusu doğrulanamadı.');
  }
  console.log('Gitleaks self-test geçti: geçici sentetik anahtar yakalandı.');
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Gitleaks self-test başarısız.');
  process.exitCode = 1;
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
