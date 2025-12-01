# 📄 API de Paginação do Histórico

## Endpoint

```
GET /api/historico
```

## Descrição

Retorna o histórico de conversas com suporte a paginação para melhorar a performance em consultas grandes.

## Parâmetros de Query

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `page` | number | 1 | Número da página (mínimo: 1) |
| `limit` | number | 50 | Registros por página (mínimo: 1, máximo: 100) |

## Resposta de Sucesso

**Status:** 200 OK

```json
{
  "sucesso": true,
  "historico": [
    {
      "timestamp": "2025-12-01T18:30:00.000Z",
      "tipo": "usuario",
      "mensagem": "Olá, como você está?"
    },
    {
      "timestamp": "2025-12-01T18:29:45.000Z",
      "tipo": "sistema",
      "mensagem": "Bem-vindo ao sistema!"
    }
  ],
  "paginacao": {
    "pagina": 1,
    "limite": 50,
    "total": 150,
    "totalPaginas": 3,
    "temProxima": true,
    "temAnterior": false
  }
}
```

## Campos da Resposta

### `historico`
Array de objetos de conversa:
- `timestamp` (string): Data/hora da conversa em formato ISO 8601
- `tipo` (string): Tipo da mensagem (`usuario`, `sistema`, `comet`)
- `mensagem` (string): Conteúdo da mensagem

### `paginacao`
Metadados de paginação:
- `pagina` (number): Página atual
- `limite` (number): Registros por página
- `total` (number): Total de registros no banco
- `totalPaginas` (number): Total de páginas disponíveis
- `temProxima` (boolean): Se existe próxima página
- `temAnterior` (boolean): Se existe página anterior

## Exemplos de Uso

### Primeira página (padrão)
```bash
curl http://localhost:3000/api/historico
```

### Segunda página com 25 registros
```bash
curl "http://localhost:3000/api/historico?page=2&limit=25"
```

### Última página
```bash
# Primeiro, buscar total de páginas
curl http://localhost:3000/api/historico

# Depois, buscar última página
curl "http://localhost:3000/api/historico?page=3"
```

## Validações

### Limite de `page`
- **Mínimo:** 1
- **Comportamento:** Valores menores que 1 são ajustados para 1

```bash
# page=0 será tratado como page=1
curl "http://localhost:3000/api/historico?page=0"
```

### Limite de `limit`
- **Mínimo:** 1
- **Máximo:** 100
- **Comportamento:** Valores fora do intervalo são ajustados

```bash
# limit=200 será tratado como limit=100
curl "http://localhost:3000/api/historico?limit=200"

# limit=0 será tratado como limit=1
curl "http://localhost:3000/api/historico?limit=0"
```

## Cálculo de Offset

O offset é calculado automaticamente:

```
offset = (page - 1) * limit
```

**Exemplos:**
- page=1, limit=50 → offset=0
- page=2, limit=50 → offset=50
- page=3, limit=25 → offset=50

## Ordenação

Os registros são retornados em **ordem decrescente** por data de criação (mais recentes primeiro).

## Resposta de Erro

**Status:** 500 Internal Server Error

```json
{
  "sucesso": false,
  "erro": "Erro ao buscar histórico"
}
```

## Performance

### Antes da Paginação
- ❌ Retornava sempre 50 registros fixos
- ❌ Sem controle de quantidade
- ❌ Performance degradada com muitos registros

### Depois da Paginação
- ✅ Controle fino de quantidade de registros
- ✅ Suporte a até 100 registros por página
- ✅ Metadados completos para navegação
- ✅ Offset otimizado para queries grandes

## Casos de Uso

### Interface Web
```javascript
// Carregar primeira página
const response = await fetch('/api/historico?page=1&limit=20');
const data = await response.json();

// Renderizar histórico
renderHistorico(data.historico);

// Mostrar paginação
if (data.paginacao.temProxima) {
  showNextButton();
}
```

### Scroll Infinito
```javascript
let currentPage = 1;

async function loadMore() {
  const response = await fetch(`/api/historico?page=${currentPage}&limit=30`);
  const data = await response.json();
  
  appendHistorico(data.historico);
  
  if (data.paginacao.temProxima) {
    currentPage++;
  } else {
    hideLoadMoreButton();
  }
}
```

### Exportação em Lote
```javascript
async function exportarTudo() {
  const firstPage = await fetch('/api/historico?page=1&limit=100');
  const { paginacao } = await firstPage.json();
  
  const allData = [];
  
  for (let page = 1; page <= paginacao.totalPaginas; page++) {
    const response = await fetch(`/api/historico?page=${page}&limit=100`);
    const data = await response.json();
    allData.push(...data.historico);
  }
  
  return allData;
}
```

## Migração

### Código Antigo (sem paginação)
```javascript
fetch('/api/historico')
  .then(res => res.json())
  .then(data => {
    // data.historico sempre tinha 50 registros
    renderHistorico(data.historico);
  });
```

### Código Novo (com paginação)
```javascript
fetch('/api/historico?page=1&limit=50')
  .then(res => res.json())
  .then(data => {
    // Compatível com código antigo
    renderHistorico(data.historico);
    
    // Novo: usar metadados de paginação
    updatePaginationUI(data.paginacao);
  });
```

**✅ Retrocompatível:** Chamadas sem parâmetros continuam funcionando com valores padrão.

## Testes

### Teste Manual
```bash
# 1. Verificar primeira página
curl -s "http://localhost:3000/api/historico?page=1&limit=10" | jq

# 2. Verificar metadados
curl -s "http://localhost:3000/api/historico" | jq '.paginacao'

# 3. Verificar limite máximo
curl -s "http://localhost:3000/api/historico?limit=200" | jq '.paginacao.limite'
# Deve retornar 100

# 4. Verificar página inválida
curl -s "http://localhost:3000/api/historico?page=0" | jq '.paginacao.pagina'
# Deve retornar 1
```

### Teste de Performance
```bash
# Comparar tempo de resposta
time curl -s "http://localhost:3000/api/historico?limit=10" > /dev/null
time curl -s "http://localhost:3000/api/historico?limit=100" > /dev/null
```

## Notas Técnicas

- **Banco de Dados:** Usa `LIMIT` e `OFFSET` do Drizzle ORM
- **Contagem:** Query separada para contar total de registros
- **Ordenação:** `ORDER BY createdAt DESC`
- **Validação:** Parâmetros validados e sanitizados antes da query

## Referências

- [Drizzle ORM - Pagination](https://orm.drizzle.team/docs/select#limit--offset)
- [REST API Best Practices - Pagination](https://restfulapi.net/pagination/)
