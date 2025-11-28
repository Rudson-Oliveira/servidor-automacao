/**
 * CORREÇÃO: APIs Personalizadas - Criptografia
 * 
 * PROBLEMA IDENTIFICADO:
 * - Endpoint `criar` não criptografa chaveApi antes de salvar no banco
 * - Endpoint `listar` tenta descriptografar chave que está em texto plano
 * - Resultado: erro "Formato de dados criptografados inválido"
 * 
 * SOLUÇÃO:
 * - Criptografar chaveApi no endpoint `criar` ANTES de inserir no banco
 * - Garantir que todas as chaves sejam criptografadas com AES-256-GCM
 */

// TRECHO CORRETO DO ENDPOINT CRIAR:

criar: protectedProcedure
  .input(ApiPersonalizadaSchema)
  .mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new Error("Banco de dados não disponível");
    }

    // ✅ CORREÇÃO: Criptografar chave API antes de salvar
    let chaveApiCriptografada = null;
    if (input.chaveApi) {
      chaveApiCriptografada = encrypt(input.chaveApi);
    }

    const [result] = await db.insert(apisPersonalizadas).values({
      userId: ctx.user.id,
      nome: input.nome,
      descricao: input.descricao || null,
      url: input.url,
      metodo: input.metodo,
      headers: input.headers || null,
      chaveApi: chaveApiCriptografada, // ✅ Salvar criptografada
      tipoAutenticacao: input.tipoAutenticacao,
      parametros: input.parametros || null,
      ativa: input.ativa,
    });

    return {
      sucesso: true,
      id: result.insertId,
      mensagem: "API personalizada criada com sucesso",
    };
  }),

// ENDPOINT LISTAR JÁ ESTÁ CORRETO (tenta descriptografar):
// - Agora vai funcionar porque a chave foi salva criptografada
