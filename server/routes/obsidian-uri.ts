import express from 'express';

const router = express.Router();

/**
 * Endpoint para gerar URI do Obsidian que cria arquivo automaticamente
 * 
 * POST /api/obsidian/gerar-uri
 * Body: {
 *   nomeArquivo: string,
 *   conteudo: string,
 *   pasta?: string
 * }
 * 
 * Retorna: {
 *   uri: string,
 *   instrucoes: string
 * }
 */
router.post('/gerar-uri', async (req, res) => {
  try {
    const { nomeArquivo, conteudo, pasta } = req.body;

    if (!nomeArquivo || !conteudo) {
      return res.status(400).json({
        sucesso: false,
        erro: 'nomeArquivo e conteudo são obrigatórios'
      });
    }

    // Construir caminho completo do arquivo
    const caminhoCompleto = pasta 
      ? `${pasta}/${nomeArquivo}`
      : nomeArquivo;

    // Codificar conteúdo para URL
    const conteudoCodificado = encodeURIComponent(conteudo);
    const caminhoCodificado = encodeURIComponent(caminhoCompleto);

    // Gerar URI do Obsidian
    // Formato: obsidian://new?vault=NOME_VAULT&file=CAMINHO&content=CONTEUDO
    const uri = `obsidian://new?file=${caminhoCodificado}&content=${conteudoCodificado}`;

    return res.json({
      sucesso: true,
      uri,
      instrucoes: `
## Como Usar:

1. **Abrir URI no navegador:**
   - Cole a URI no navegador
   - O Obsidian abrirá automaticamente
   - O arquivo será criado

2. **Via PowerShell (Windows):**
   \`\`\`powershell
   Start-Process "${uri}"
   \`\`\`

3. **Via Python:**
   \`\`\`python
   import webbrowser
   webbrowser.open("${uri}")
   \`\`\`

4. **Via cURL:**
   \`\`\`bash
   curl -X GET "${uri}"
   \`\`\`

O arquivo será criado em: ${caminhoCompleto}
      `.trim()
    });

  } catch (erro: any) {
    console.error('[Obsidian URI] Erro:', erro);
    return res.status(500).json({
      sucesso: false,
      erro: 'Erro ao gerar URI do Obsidian',
      detalhes: erro.message
    });
  }
});

/**
 * Endpoint para catalogar links diretamente via URI
 * 
 * POST /api/obsidian/catalogar-links
 * Body: {
 *   titulo: string,
 *   links: Array<{ nome: string, url: string, categoria?: string }>
 * }
 */
router.post('/catalogar-links', async (req, res) => {
  try {
    const { titulo, links } = req.body;

    if (!titulo || !Array.isArray(links) || links.length === 0) {
      return res.status(400).json({
        sucesso: false,
        erro: 'titulo e links (array) são obrigatórios'
      });
    }

    // Agrupar links por categoria
    const linksPorCategoria: Record<string, typeof links> = {};
    links.forEach(link => {
      const categoria = link.categoria || 'Sem Categoria';
      if (!linksPorCategoria[categoria]) {
        linksPorCategoria[categoria] = [];
      }
      linksPorCategoria[categoria].push(link);
    });

    // Gerar conteúdo markdown
    let conteudo = `# ${titulo}\\n\\n`;
    conteudo += `> Catálogo gerado automaticamente em ${new Date().toLocaleString('pt-BR')}\\n\\n`;
    conteudo += `## 📊 Estatísticas\\n\\n`;
    conteudo += `- **Total de Links:** ${links.length}\\n`;
    conteudo += `- **Categorias:** ${Object.keys(linksPorCategoria).length}\\n\\n`;
    conteudo += `---\\n\\n`;

    // Adicionar links por categoria
    Object.entries(linksPorCategoria).forEach(([categoria, linksCategoria]) => {
      conteudo += `## ${categoria}\\n\\n`;
      linksCategoria.forEach(link => {
        conteudo += `- [${link.nome}](${link.url})\\n`;
      });
      conteudo += `\\n`;
    });

    // Nome do arquivo
    const nomeArquivo = `${titulo.replace(/[^a-zA-Z0-9 ]/g, '')}.md`;

    // Gerar URI
    const conteudoCodificado = encodeURIComponent(conteudo);
    const caminhoCodificado = encodeURIComponent(`GERAL RUDSON/${nomeArquivo}`);
    const uri = `obsidian://new?file=${caminhoCodificado}&content=${conteudoCodificado}`;

    return res.json({
      sucesso: true,
      uri,
      nomeArquivo,
      totalLinks: links.length,
      categorias: Object.keys(linksPorCategoria).length,
      instrucoes: `
## ✅ URI Gerada com Sucesso!

**Arquivo:** ${nomeArquivo}
**Local:** GERAL RUDSON/
**Total de Links:** ${links.length}
**Categorias:** ${Object.keys(linksPorCategoria).join(', ')}

### Como Abrir:

**Opção 1 - Navegador:**
Cole a URI abaixo no navegador:
\`\`\`
${uri}
\`\`\`

**Opção 2 - PowerShell:**
\`\`\`powershell
Start-Process "${uri}"
\`\`\`

**Opção 3 - Python:**
\`\`\`python
import webbrowser
webbrowser.open("${uri}")
\`\`\`

O Obsidian abrirá automaticamente e o arquivo será criado!
      `.trim()
    });

  } catch (erro: any) {
    console.error('[Obsidian Catalogar] Erro:', erro);
    return res.status(500).json({
      sucesso: false,
      erro: 'Erro ao catalogar links',
      detalhes: erro.message
    });
  }
});

export default router;
