#!/usr/bin/env node
/**
 * migrate-to-supabase.mjs
 * Lee los CSV/JSON locales y los sube a Supabase.
 *
 * Uso:
 *   node scripts/migrate-to-supabase.mjs
 *
 * Requiere: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_KEY en .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, join } from "path";

// Cargar .env.local
const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const [key, value] = line.split("=");
    if (key && value && !key.startsWith("#")) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const DATA_DIR = resolve(process.cwd(), "..");

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_KEY requeridos");
  console.error("   Obtén SUPABASE_SERVICE_KEY de: https://app.supabase.com → Settings → API");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

const log = (msg) => console.log(`  ${msg}`);
const ok = (msg) => console.log(`  ✅ ${msg}`);
const warn = (msg) => console.log(`  ⚠️  ${msg}`);

// ─── Helpers ────────────────────────────────────────────────────────────────

function readFile(filename, fallback = null) {
  const p = join(DATA_DIR, filename);
  if (!existsSync(p)) {
    warn(`No encontrado: ${filename}`);
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

// ─── Migración Cuentas ───────────────────────────────────────────────────────

async function migrarCuentas() {
  console.log("\n📦 Migrando cuentas...");
  const rows = parseCSV(readFile("cuentas.csv"));
  if (!rows.length) return warn("No hay cuentas");

  const data = rows.map((r) => ({
    categoria: r.Categoria,
    nombre_cuenta: r.Nombre_Cuenta,
    monto_objetivo: parseFloat(r.Monto_Objetivo) || 0,
    incluir: r.Incluir === "True" || r.Incluir === "true" || r.Incluir === "1",
    ultimo_valor: parseFloat(r.Ultimo_Valor) || 0,
  }));

  const { error } = await supabase.from("cuentas").upsert(data, {
    onConflict: "nombre_cuenta",
  });

  if (error) throw error;
  ok(`${rows.length} cuentas migradas`);
}

// ─── Migración Net Worth ─────────────────────────────────────────────────────

async function migrarNetworth() {
  console.log("\n📦 Migrando net worth...");
  const rows = parseCSV(readFile("networth_db.csv"));
  if (!rows.length) return warn("No hay networth");

  const data = rows.map((r) => ({
    fecha: r.Fecha,
    ahorro: parseFloat(r.Ahorro) || 0,
    inversion: parseFloat(r.Inversion) || 0,
    jubilacion: parseFloat(r.Jubilacion) || 0,
    deuda: parseFloat(r.Deuda) || 0,
    prestamo: parseFloat(r.Prestamo) || 0,
  }));

  const { error } = await supabase.from("networth").upsert(data, {
    onConflict: "fecha",
  });

  if (error) throw error;
  ok(`${rows.length} registros de networth migrados`);
}

// ─── Migración Flows ────────────────────────────────────────────────────────

async function migrarFlows() {
  console.log("\n📦 Migrando flujos...");
  const rows = parseCSV(readFile("flow_data.csv"));
  if (!rows.length) return warn("No hay flujos");

  const data = rows.map((r, i) => ({
    id: r.id || `flow-${i}`,
    kind: r.kind,
    name: r.name,
    amount: parseFloat(r.amount) || 0,
    frequency: r.frequency,
    start_date: r.start_date,
    end_date: r.end_date && r.end_date !== "NaT" ? r.end_date : null,
    day_of_month: r.day_of_month ? parseInt(r.day_of_month) : null,
    notes: r.notes || null,
  }));

  const { error } = await supabase.from("flows").upsert(data, {
    onConflict: "id",
  });

  if (error) throw error;
  ok(`${rows.length} flujos migrados`);
}

// ─── Migración Puntos ───────────────────────────────────────────────────────

async function migrarPuntos() {
  console.log("\n📦 Migrando puntos...");
  const content = readFile("puntos_db.csv");
  if (!content) return warn("No hay puntos");

  const lines = content.trim().split("\n").filter((l) => l.trim());
  if (lines.length < 2) return;

  const headers = lines[0].split(",").map((h) => h.trim());
  const categorias = headers.slice(1);
  const data = [];

  for (const line of lines.slice(1)) {
    const values = line.split(",");
    const fecha = values[0].trim();
    for (let i = 0; i < categorias.length; i++) {
      const cat = categorias[i];
      const val = parseFloat(values[i + 1]) || 0;
      data.push({ fecha, categoria: cat, valor: val });
    }
  }

  if (data.length > 0) {
    const { error } = await supabase.from("puntos").upsert(data, {
      onConflict: "fecha,categoria",
    });
    if (error) throw error;
  }

  ok(`${data.length} registros de puntos migrados`);
}

// ─── Migración Propiedades ──────────────────────────────────────────────────

async function migrarPropiedades() {
  console.log("\n📦 Migrando propiedades...");
  const rows = parseCSV(readFile("propiedades.csv"));
  if (!rows.length) return warn("No hay propiedades");

  const data = rows.map((r) => ({
    propiedad: r.Propiedad,
    valor_avaluo: parseFloat(r.Valor_Avaluo) || 0,
    fecha_avaluo: r.Fecha_Avaluo,
  }));

  const { error } = await supabase.from("propiedades").upsert(data, {
    onConflict: "propiedad",
  });

  if (error) throw error;
  ok(`${rows.length} propiedades migradas`);
}

// ─── Migración KV (como JSON en config) ──────────────────────────────────────

async function migrarKV() {
  console.log("\n📦 Migrando configuración...");

  const kvItems = [
    { key: "presupuesto", file: "presupuesto.json" },
    { key: "perfil", file: "perfil.json" },
    { key: "tarjetas", file: "tarjetas.json" },
    { key: "vehiculos", file: "vehiculos.json" },
    { key: "prestamos", file: "prestamos.json" },
    { key: "puntos_config", file: "puntos.json" },
  ];

  for (const item of kvItems) {
    const content = readFile(item.file);
    if (!content) {
      warn(`${item.file} no encontrado`);
      continue;
    }

    try {
      const value = JSON.parse(content);
      const { error } = await supabase.from("config").upsert(
        { key: item.key, value },
        { onConflict: "key" }
      );

      if (error) throw error;
      log(`  → ${item.key} (${item.file})`);
      ok(`${item.key} listo`);
    } catch (e) {
      warn(`Error en ${item.file}: ${e.message}`);
    }
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Migración a Supabase");
  console.log(`📍 URL: ${supabaseUrl}\n`);

  try {
    await migrarCuentas();
    await migrarNetworth();
    await migrarFlows();
    await migrarPuntos();
    await migrarPropiedades();
    await migrarKV();

    console.log("\n✅ Migración completada!\n");
    console.log("Verifica en: https://app.supabase.com → Tables\n");
  } catch (e) {
    console.error("\n❌ Error en la migración:", e.message);
    process.exit(1);
  }
}

main();
