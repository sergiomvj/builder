#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');

async function main() {
  try {
    const dir = path.join(__dirname, 'biografias_output');
    const files = await fs.readdir(dir);
    const report = {};

    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const content = await fs.readFile(path.join(dir, file), 'utf8');
      let json;
      try { json = JSON.parse(content); } catch (e) { console.warn('Erro parseando', file); continue; }

      const personas = json.personas || {};
      for (const key of Object.keys(personas)) {
        const p = personas[key];
        const nat = (p.parametros_pessoais && p.parametros_pessoais.nacionalidade) || (p.parametros && p.parametros.nacionalidade) || 'UNKNOWN';
        report[nat] = (report[nat] || 0) + 1;
      }
    }

    const sorted = Object.entries(report).sort((a,b)=>b[1]-a[1]);
    console.log('Relatório de nacionalidades encontradas nos arquivos de biografias:');
    for (const [nat, count] of sorted) {
      console.log(`${count.toString().padStart(3)} × ${nat}`);
    }

    const outFile = path.join(dir, `nacionalidade_report_${Date.now()}.json`);
    await fs.writeFile(outFile, JSON.stringify(report, null, 2), 'utf8');
    console.log('\nArquivo de relatório salvo em:', outFile);
  } catch (error) {
    console.error('Erro ao gerar relatório:', error.message);
    process.exit(1);
  }
}

if (require.main === module) main();
