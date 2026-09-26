import { join, resolve } from 'node:path';
import { runPipeline } from './pipeline.js';
import { collectFixture } from './collectors/fixture.js';
import { loadConfig } from './config.js';
import { writeJson } from './lib/files.js';
import { runPath } from './lib/paths.js';
import { generateDashboard } from './dashboard/generate.js';

async function main() {
  console.log('🚀 Lancement du pipeline d’analyse Design System (V2)...');

  try {
    const config = await loadConfig();

    // 1. Exécution du pipeline pour construire le snapshot
    const snapshot = await runPipeline(collectFixture, config);

    // 2. Sauvegarde du snapshot JSON dans data/runs
    const outputPath = join(runPath, `${snapshot.id}.json`);
    await writeJson(outputPath, snapshot);

    console.log(`✅ Snapshot V2 généré avec succès dans : ${outputPath}`);
    console.log(`📊 Total métriques calculées : ${Object.keys(snapshot.analytics.metrics).length}`);
    console.log(`⚠️  Réserves DQ détectées : ${snapshot.analytics.metrics['data_health.issues.total_count']?.value ?? 0}`);

    // 3. Génération du dashboard web HTML
    const outputDir = resolve(process.cwd(), process.argv[2] || 'dist');
    console.log(`🎨 Génération du dashboard dans : ${outputDir}/dashboard...`);
    
    await generateDashboard(snapshot, outputDir, config.githubUrl);

    console.log(`✨ Dashboard généré avec succès dans ${join(outputDir, 'dashboard', 'index.html')}`);
  } catch (error) {
    console.error('❌ Erreur lors de l’exécution du pipeline :', error);
    process.exit(1);
  }
}

main();