import { getDb } from '../server/db';
import { skills } from '../drizzle/schema';

async function createTeste2Skill() {
  const db = await getDb();
  if (!db) {
    console.log('❌ Erro: Banco de dados não disponível');
    return;
  }
  
  const skillData = {
    nome: 'Buscar Pasta TESTE2 manus comet',
    descricao: 'Busca e reporta informações sobre a pasta TESTE2 manus comet localizada em C:\\Recovery\\',
    instrucoes: `1. Executar busca avançada de arquivos com query "TESTE2 manus comet"
2. Procurar especificamente em C:\\Recovery\\
3. Quando encontrar a pasta:
   - Reportar localização completa
   - Listar todos os arquivos dentro da pasta
   - Para cada arquivo, mostrar: nome, tamanho, tipo, data de modificação
4. Se houver arquivos de texto (.txt, .md, .log):
   - Ler conteúdo de cada arquivo
   - Reportar conteúdo completo
5. Reportar resultados para o Manus:
   - "Encontrei a pasta em: [caminho completo]"
   - "Dentro há X arquivos: [lista com detalhes]"
   - "Conteúdo dos arquivos: [transcrição completa]"
6. Usar POST /api/comet/buscar-arquivos para executar busca
7. Marcar skill como sucesso após reportar tudo`,
    exemplo: `Entrada: "Encontre a pasta TESTE2 manus comet e me diga o que tem dentro"

Saída:
"✅ Encontrei a pasta em: C:\\Recovery\\TESTE2 manus comet\\

📁 Conteúdo da pasta (3 arquivos):
1. arquivo1.txt (1.2 KB, modificado em 22/11/2025)
2. documento.pdf (500 KB, modificado em 21/11/2025)
3. imagem.png (2.1 MB, modificado em 20/11/2025)

📄 Conteúdo de arquivo1.txt:
[transcrição completa do arquivo]

Reportando para Manus..."`,
    tags: 'busca,pasta,teste,integracao,manus,comet,teste2',
    categoria: 'busca',
    autonomiaNivel: 'alta',
  };
  
  try {
    await db.insert(skills).values(skillData);
    console.log('✅ Skill "Buscar Pasta TESTE2 manus comet" criada com sucesso!');
    console.log('📋 Detalhes:');
    console.log('  - Nome:', skillData.nome);
    console.log('  - Categoria:', skillData.categoria);
    console.log('  - Autonomia:', skillData.autonomiaNivel);
    console.log('  - Tags:', skillData.tags);
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('⚠️  Skill já existe no banco de dados');
    } else {
      console.error('❌ Erro ao criar skill:', error);
    }
  }
  
  // Listar todas as skills de busca
  const skillsDeBusca = await db.select().from(skills).where((s: any) => s.categoria === 'busca');
  console.log(`\n📊 Total de skills de busca no banco: ${skillsDeBusca.length}`);
}

createTeste2Skill().catch(console.error);
