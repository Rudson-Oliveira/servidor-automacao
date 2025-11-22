import { drizzle } from 'drizzle-orm/mysql2';
import { skills } from './drizzle/schema';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Conectar ao banco
const db = drizzle(process.env.DATABASE_URL!);

// Carregar skills do arquivo JSON
const skillsPath = path.join(__dirname, '..', 'skills_preconfiguradas.json');
const skillsData = JSON.parse(fs.readFileSync(skillsPath, 'utf-8'));

console.log(`📚 Carregando ${skillsData.length} skills pré-configuradas...\n`);

async function seedSkills() {
  let sucessos = 0;
  let falhas = 0;

  for (const skill of skillsData) {
    try {
      await db.insert(skills).values({
        nome: skill.nome,
        descricao: skill.descricao,
        categoria: skill.categoria,
        instrucoes: skill.instrucoes,
        exemplo: skill.exemplo,
        tags: skill.tags,
        autonomiaNivel: skill.autonomiaNivel,
        usoCount: 0,
        sucessoCount: 0,
        falhaCount: 0,
      });

      console.log(`✅ ${skill.nome}`);
      sucessos++;
    } catch (erro: any) {
      // Skill pode já existir (unique constraint)
      if (erro.code === 'ER_DUP_ENTRY') {
        console.log(`⚠️  ${skill.nome} (já existe)`);
      } else {
        console.error(`❌ ${skill.nome}: ${erro.message}`);
        falhas++;
      }
    }
  }

  console.log(`\n📊 Resultado:`);
  console.log(`   ✅ Sucessos: ${sucessos}`);
  console.log(`   ⚠️  Já existentes: ${skillsData.length - sucessos - falhas}`);
  console.log(`   ❌ Falhas: ${falhas}`);
  console.log(`\n🎉 Seed concluído!`);
}

seedSkills()
  .then(() => process.exit(0))
  .catch((erro) => {
    console.error('❌ Erro fatal:', erro);
    process.exit(1);
  });
