const fs = require('fs');
const path = require('path');

const overviewPath = '/Users/ricardo/.gemini/antigravity/brain/ed1c8635-a81a-452d-b815-dc43e7e156e9/.system_generated/logs/overview.txt';
const prestamosPath = path.resolve(__dirname, '..', '..', 'prestamos.json');

const content = fs.readFileSync(overviewPath, 'utf8');

// Find the block of data for the mortgage. 
// It starts around "1\tabril 2016\t1\tUSD 515.85" and ends somewhere.
const startStr = "1\tabril 2016\t1\tUSD";
const lines = content.split('\n');

let startIndex = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("1\tabril 2016\t1\tUSD")) {
    startIndex = i;
    // Walk backwards a bit to get the year 0 row if possible, but actually we can just start parsing from here.
    break;
  }
}

if (startIndex !== -1) {
  const records = [];
  let lastAno = 0;

  function parseCurrency(val) {
    if (!val || val.trim() === "") return 0;
    const cleaned = val.replace(/[^-0-9.]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") continue; // Skip empty lines
    
    // Stop if we hit a boundary of the chat
    if (line.includes("<user_request>") || line.includes("</user_request>") || line.includes("TOTAL B/.")) {
      break;
    }

    const cols = line.split("\t").map((c) => c.trim());
    if (cols.length < 15) continue; // Not a valid row

    const parsedAno = parseInt(cols[0]);
    if (!isNaN(parsedAno)) {
      lastAno = parsedAno;
    }
    
    const rawMes = cols[1] || "";
    const rawNum = cols[2] || "";
    const pagoNum = parseInt(rawNum);
    if (isNaN(pagoNum) || pagoNum <= 0) continue;

    records.push({
      ano: lastAno,
      mes: rawMes,
      pago_num: pagoNum,
      neto: parseCurrency(cols[3]),
      total: parseCurrency(cols[4]),
      capital: parseCurrency(cols[5]),
      extra: parseCurrency(cols[6]),
      interes: parseCurrency(cols[7]),
      mantenimiento: parseCurrency(cols[8]),
      feci: parseCurrency(cols[9]),
      gastos: parseCurrency(cols[10]),
      alquiler: parseCurrency(cols[11]),
      balance: parseCurrency(cols[12]),
      balance_teorico: parseCurrency(cols[13]),
      capital_acum: parseCurrency(cols[16] || cols[15]),
      interes_acum: parseCurrency(cols[17] || cols[16]),
      pagado_total: parseCurrency(cols[18] || cols[17]),
      porcentaje: parseCurrency(cols[19] || cols[18]),
      notas: cols[20] || cols[19] || "",
    });
  }

  if (records.length > 0) {
    const prestamosData = {
      prestamos: [
        {
          id: "hipoteca-4-islas",
          nombre: "Hipoteca 4 Islas",
          tipo: "hipoteca",
          amortizacion: records
        }
      ]
    };
    fs.writeFileSync(prestamosPath, JSON.stringify(prestamosData, null, 2) + "\n");
    console.log(`Saved ${records.length} records to ${prestamosPath}`);
  } else {
    console.log("No records parsed.");
  }
} else {
  console.log("Start string not found in overview.txt.");
}
