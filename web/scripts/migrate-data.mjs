#!/usr/bin/env node
/**
 * migrate-data.mjs
 * Lee los CSV/JSON locales del directorio padre y los sube a Cloudflare D1 y KV.
 *
 * Uso:
 *   node scripts/migrate-data.mjs              # ejecuta la migración
 *   node scripts/migrate-data.mjs --dry-run    # solo muestra lo que haría
 *
 * Requiere: CLOUDFLARE_API_TOKEN en el entorno o token via `wrangler login`
 */

import { readFileSync, existsSync } from "fs";
import { resolve, join } from "path";
import { execSync } from "child_process";

const DRY_RUN = process.argv.includes("--dry-run");
const DATA_DIR = resolve(process.cwd(), "..");
const DB_NAME = "dashboard-financiero-db";
const KV_NAMESPACE_ID = "b828f627653b40f2bf3482635cd13557";

const log = (msg) => console.log(`  ${msg}`);
const ok  = (msg) => console.log(`  ✅ ${msg}`);
const warn = (msg) => console.log(`  ⚠️  ${msg}`);

// ─── Helpers ────────────────────────────────────────────────────────────────

function readFile(filename, fallback = null) {
  const p = join(DATA_DIR, filename);
  if (!existsSync(p)) {
    warn(`No encontrado: ${filename} — se omite`);
    return fallback;
  }
  return readFileSync(p, "utf-8");
}

function parseCSV(content) {
  if (!content) return [];
  const lines = content.trim().split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row = {};
    headers.forEach((h, i) => (row[h] = (values[i] ?? "").trim()));
    return row;
  });
}

function runWrangler(cmd) {
  if (DRY_RUN) {
    console.log(`  [DRY-RUN] wrangler ${cmd}`);
    return;
  }
  try {
    execSync(`wrangler ${cmd}`, { stdio: "inherit" });
  } catch (e) {
    console.error(`  ❌ Error ejecutando: wrangler ${cmd}`);
    throw e;
  }
}

function d1Exec(sql) {
  // Escape single quotes in SQL
  const escaped = sql.replace(/'/g, "''");
  runWrangler(`d1 execute ${DB_NAME} --remote --command '${sql}'`);
}

function d1ExecFile(file) {
  runWrangler(`d1 execute ${DB_NAME} --remote --file=${file}`);
}

function kvPut(key, value) {
  // Write value to temp file to avoid shell escaping issues
  const tmp = `/tmp/kv-${key}.json`;
  if (!DRY_RUN) {
    const { writeFileSync } = await import("fs").catch(() => require("fs"));
    writeFileSync(tmp, JSON.stringify(value));
  }
  runWrangler(`kv key put --namespace-id=${KV_NAMESPACE_ID} "${key}" --path=${tmp}`);
}

// ─── Migración D1 ───────────────────────────────────────────────────────────

async function migrarCuentas() {
  console.log("\n📦 Migrando cuentas...");
  const rows = parseCSV(readFile("cuentas.csv"));
  if (!rows.length) return;
  for (const r of rows) {
    const incluir = (r.Incluir === "True" || r.Incluir === "true" || r.Incluir === "1") ? 1 : 0;
    const sql = `INSERT OR REPLACE INTO cuentas (categoria, nombre_cuenta, monto_objetivo, incluir, ultimo_valor) VALUES ('${r.Categoria}', '${r.Nombre_Cuenta}', ${parseFloat(r.Monto_Objetivo) || 0}, ${incluir}, ${parseFloat(r.Ultimo_Valor) || 0})`;
    log(`  → ${r.Nombre_Cuenta}`);
    runWrangler(`d1 execute ${DB_NAME} --remote --command "${sql.replace(/"/g, '\\"')}"`);
  }
  ok(`${rows.length} cuentas migradas`);
}

async function migrarNetworth() {
  console.log("\n📦 Migrando networth...");
  const rows = parseCSV(readFile("networth_db.csv"));
  if (!rows.length) return;
  for (const r of rows) {
    const sql = `INSERT OR REPLACE INTO networth (fecha, ahorro, inversion, jubilacion, deuda, prestamo) VALUES ('${r.Fecha}', ${parseFloat(r.Ahorro)||0}, ${parseFloat(r.Inversion)||0}, ${parseFloat(r.Jubilacion)||0}, ${parseFloat(r.Deuda)||0}, ${parseFloat(r.Prestamo)||0})`;
    log(`  → ${r.Fecha}`);
    runWrangler(`d1 execute ${DB_NAME} --remote --command "${sql.replace(/"/g, '\\"')}"`);
  }
  ok(`${rows.length} registros de networth migrados`);
}

async function migrarFlows() {
  console.log("\n📦 Migrando flujos...");
  const rows = parseCSV(readFile("flow_data.csv"));
  if (!rows.length) return;
  rows.forEach((r, i) => { r._id = `flow-${i}`; });
  for (const r of rows) {
    const endDate = (r.end_date && r.end_date !== "NaT") ? `'${r.end_date}'` : "NULL";
    const dayOfMonth = r.day_of_month ? parseFloat(r.day_of_month) : "NULL";
    const notes = r.notes ? `'${r.notes.replace(/'/g, "''")}'` : "NULL";
    const sql = `INSERT OR REPLACE INTO flows (id, kind, name, amount, frequency, start_date, end_date, day_of_month, notes) VALUES ('${r._id}', '${r.kind}', '${r.name.replace(/'/g, "''")}', ${parseFloat(r.amount)||0}, '${r.frequency}', '${r.start_date}', ${endDate}, ${dayOfMonth}, ${notes})`;
    log(`  → ${r.name}`);
    runWrangler(`d1 execute ${DB_NAME} --remote --command "${sql.replace(/"/g, '\\"')}"`);
  }
  ok(`${rows.length} flujos migrados`);
}

async function migrarPuntos() {
  console.log("\n📦 Migrando puntos...");
  const content = readFile("puntos_db.csv");
  if (!content) return;
  const lines = content.trim().split("\n").filter((l) => l.trim());
  if (lines.length < 2) return;
  const headers = lines[0].split(",").map((h) => h.trim());
  const categorias = headers.slice(1);
  let count = 0;
  for (const line of lines.slice(1)) {
    const values = line.split(",");
    const fecha = values[0].trim();
    for (let i = 0; i < categorias.length; i++) {
      const cat = categorias[i];
      const val = parseFloat(values[i + 1]) || 0;
      const sql = `INSERT OR REPLACE INTO puntos (fecha, categoria, valor) VALUES ('${fecha}', '${cat}', ${val})`;
      runWrangler(`d1 execute ${DB_NAME} --remote --command "${sql.replace(/"/g, '\\"')}"`);
      count++;
    }
    log(`  → ${fecha}`);
  }
  ok(`${count} registros de puntos migrados`);
}

async function migrarPropiedades() {
  console.log("\n📦 Migrando propiedades...");
  const rows = parseCSV(readFile("propiedades.csv"));
  if (!rows.length) { warn("No hay propiedades — se omite"); return; }
  for (const r of rows) {
    const sql = `INSERT OR REPLACE INTO propiedades (propiedad, valor_avaluo, fecha_avaluo) VALUES ('${r.Propiedad.replace(/'/g, "''")}', ${parseFloat(r.Valor_Avaluo)||0}, '${r.Fecha_Avaluo}')`;
    log(`  → ${r.Propiedad}`);
    runWrangler(`d1 execute ${DB_NAME} --remote --command "${sql.replace(/"/g, '\\"')}"`);
  }
  ok(`${rows.length} propiedades migradas`);
}

// ─── Migración KV ───────────────────────────────────────────────────────────

async function migrarKV() {
  const { writeFileSync } = await import("fs");
  const tmpDir = "/tmp";

  const kvItems = [
    { key: "presupuesto", file: "presupuesto.json", fallback: "{}" },
    { key: "perfil",      file: "perfil.json",      fallback: null },
    { key: "tarjetas",    file: "tarjetas.json",     fallback: '{"tarjetas":[]}' },
    { key: "vehiculos",   file: "vehiculos.json",    fallback: "[]" },
    { key: "prestamos",   file: "prestamos.json",    fallback: '{"prestamos":[]}' },
    { key: "puntos_config", file: "puntos.json",     fallback: null },
  ];

  console.log("\n📦 Migrando KV...");
  for (const item of kvItems) {
    const content = readFile(item.file, item.fallback);
    if (!content) { warn(`${item.file} no encontrado, se omite`); continue; }

    const tmp = join(tmpDir, `kv-${item.key}.json`);
    if (!DRY_RUN) writeFileSync(tmp, content);

    log(`  → KV["${item.key}"] (${item.file})`);
    runWrangler(`kv key put --namespace-id=${KV_NAMESPACE_ID} "${item.key}" --path=${tmp}`);
    ok(`KV["${item.key}"] listo`);
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Migración Dashboard → Cloudflare");
  if (DRY_RUN) console.log("   ⚠️  MODO DRY-RUN — no se ejecuta nada\n");

  console.log("\n📐 Aplicando schema SQL...");
  d1ExecFile("db/schema.sql");
  ok("Schema aplicado");

  await migrarCuentas();
  await migrarNetworth();
  await migrarFlows();
  await migrarPuntos();
  await migrarPropiedades();
  await migrarKV();

  console.log("\n✅ Migración completa!\n");
  console.log("Verifica en: https://dash.cloudflare.com → D1 → dashboard-financiero-db → Tables\n");
}

main().catch((e) => {
  console.error("\n❌ Error en la migración:", e.message);
  process.exit(1);
});
