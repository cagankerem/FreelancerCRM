import {
  chmodSync,
  copyFileSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const expectedVersion = '8.30.1';
const repository = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const binary = process.env.GITLEAKS_BIN || 'gitleaks';
const temporary = mkdtempSync(join(tmpdir(), 'freelancercrm-gitleaks-'));
chmodSync(temporary, 0o700);

function execute(command, args, cwd = repository) {
  return spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    windowsHide: true,
  });
}

function fail(message) {
  throw new Error(message);
}

function readFindings(report) {
  let findings;
  try {
    findings = JSON.parse(readFileSync(report, 'utf8'));
  } catch {
    fail('Gitleaks raporu okunamadı; tarama güvenli biçimde başarısız sayıldı.');
  }
  if (!Array.isArray(findings)) {
    fail('Gitleaks rapor biçimi beklenenden farklı; tarama başarısız sayıldı.');
  }
  return findings;
}

function scan(kind, target, report, extraArgs = []) {
  const result = execute(binary, [
    kind,
    '--no-banner',
    '--log-level=error',
    '--redact=100',
    '--report-format=json',
    `--report-path=${report}`,
    ...extraArgs,
    ...(target ? [target] : []),
  ]);
  if (result.error || ![0, 1].includes(result.status)) {
    fail(`${kind} taraması çalıştırılamadı (çıkış: ${result.status ?? 'yok'}). Ham çıktı güvenlik nedeniyle gösterilmiyor.`);
  }
  if (result.status === 0) return [];
  const findings = readFindings(report);
  if (findings.length === 0) fail('Gitleaks bulgu bildirdi ancak rapor boş; tarama başarısız sayıldı.');
  return findings;
}

function printable(value) {
  return JSON.stringify(String(value ?? '').replaceAll('\u001b', '?'));
}

function reportFindings(label, findings, snapshot) {
  for (const finding of findings) {
    const file = String(finding.File ?? 'bilinmiyor');
    const path = snapshot && isAbsolute(file) ? relative(snapshot, file) : file;
    const line = Number.isInteger(finding.StartLine) ? finding.StartLine : '?';
    const rule = finding.RuleID || 'bilinmiyor';
    const commit = finding.Commit ? `, commit ${String(finding.Commit).slice(0, 12)}` : '';
    // Never print Match, Secret, or scanner stderr/stdout: they can contain credentials.
    console.error(`${label}: ${printable(path)}:${line}, kural ${printable(rule)}${commit}`);
  }
}

try {
  const version = execute(binary, ['version']);
  if (version.error || version.status !== 0 || version.stdout.trim() !== expectedVersion) {
    fail(`Gitleaks ${expectedVersion} gerekli; kurulu sürüm doğrulanamadı.`);
  }

  const listed = execute('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z']);
  if (listed.error || listed.status !== 0) fail('Git dosya listesi alınamadı.');
  const files = listed.stdout.split('\0').filter(Boolean);
  const snapshot = join(temporary, 'snapshot');
  mkdirSync(snapshot);
  for (const file of files) {
    const source = resolve(repository, file);
    if (!source.startsWith(`${repository}${sep}`)) fail('Depo dışına çıkan dosya yolu bulundu.');
    const destination = resolve(snapshot, file);
    if (!destination.startsWith(`${snapshot}${sep}`)) fail('Geçersiz tarama dosyası yolu bulundu.');
    mkdirSync(dirname(destination), { recursive: true });
    const stat = lstatSync(source);
    if (stat.isFile()) copyFileSync(source, destination);
    else if (stat.isSymbolicLink()) writeFileSync(destination, readlinkSync(source));
    else fail('Desteklenmeyen dosya türü bulundu; tarama eksik bırakılmadı.');
  }

  const working = scan('dir', snapshot, join(temporary, 'working.json'));
  const history = scan('git', undefined, join(temporary, 'history.json'), ['--log-opts=--all']);
  reportFindings('Çalışma ağacı', working, snapshot);
  reportFindings('Git geçmişi', history);
  if (working.length || history.length) {
    console.error(`Secret taraması başarısız: çalışma ağacında ${working.length}, Git geçmişinde ${history.length} bulgu.`);
    process.exitCode = 1;
  } else {
    console.log(`Secret taraması temiz: ${files.length} depo dosyası ve Git geçmişi tarandı.`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Secret taraması başarısız.');
  process.exitCode = 1;
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
