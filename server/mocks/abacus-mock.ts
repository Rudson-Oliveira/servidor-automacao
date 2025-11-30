/**
 * Mock Abacus AI
 * Simula funcionalidades de conhecimento e organização
 */

export interface AbacusKnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface AbacusResponse {
  success: boolean;
  data?: any;
  error?: string;
  mock: boolean;
}

class AbacusMock {
  private knowledgeBase: Map<string, AbacusKnowledgeItem> = new Map();
  private idCounter = 1;

  constructor() {
    // Inicializar com alguns itens de exemplo
    this.seedKnowledgeBase();
  }

  /**
   * Adicionar item à base de conhecimento
   */
  async addKnowledge(
    title: string,
    content: string,
    category: string,
    tags: string[] = []
  ): Promise<AbacusResponse> {
    await this.delay(100 + Math.random() * 200);

    const id = `ABACUS_${this.idCounter++}_${Date.now()}`;
    const now = Date.now();

    const item: AbacusKnowledgeItem = {
      id,
      title,
      content,
      category,
      tags,
      createdAt: now,
      updatedAt: now,
    };

    this.knowledgeBase.set(id, item);

    console.log(`[Abacus Mock] Conhecimento adicionado: ${title} (${category})`);

    return {
      success: true,
      data: { id, item },
      mock: true,
    };
  }

  /**
   * Buscar conhecimento por query
   */
  async searchKnowledge(query: string, category?: string): Promise<AbacusResponse> {
    await this.delay(150 + Math.random() * 300);

    const results: AbacusKnowledgeItem[] = [];
    const queryLower = query.toLowerCase();

    for (const item of this.knowledgeBase.values()) {
      // Filtrar por categoria se especificado
      if (category && item.category !== category) {
        continue;
      }

      // Buscar em título, conteúdo e tags
      const searchText = `${item.title} ${item.content} ${item.tags.join(' ')}`.toLowerCase();
      if (searchText.includes(queryLower)) {
        results.push(item);
      }
    }

    // Ordenar por relevância (simulado - por data de atualização)
    results.sort((a, b) => b.updatedAt - a.updatedAt);

    console.log(`[Abacus Mock] Busca por "${query}": ${results.length} resultados`);

    return {
      success: true,
      data: { results, count: results.length, query },
      mock: true,
    };
  }

  /**
   * Organizar informações por categoria
   */
  async organizeByCategory(): Promise<AbacusResponse> {
    await this.delay(200 + Math.random() * 400);

    const organized: Record<string, AbacusKnowledgeItem[]> = {};

    for (const item of this.knowledgeBase.values()) {
      if (!organized[item.category]) {
        organized[item.category] = [];
      }
      organized[item.category].push(item);
    }

    // Ordenar cada categoria por data
    for (const category in organized) {
      organized[category].sort((a, b) => b.updatedAt - a.updatedAt);
    }

    const summary = Object.entries(organized).map(([category, items]) => ({
      category,
      count: items.length,
      latestUpdate: Math.max(...items.map(i => i.updatedAt)),
    }));

    console.log(`[Abacus Mock] Organização: ${Object.keys(organized).length} categorias`);

    return {
      success: true,
      data: { organized, summary },
      mock: true,
    };
  }

  /**
   * Obter item específico
   */
  async getKnowledgeItem(id: string): Promise<AbacusResponse> {
    await this.delay(50 + Math.random() * 100);

    const item = this.knowledgeBase.get(id);

    if (!item) {
      return {
        success: false,
        error: `Item não encontrado: ${id}`,
        mock: true,
      };
    }

    return {
      success: true,
      data: item,
      mock: true,
    };
  }

  /**
   * Atualizar item
   */
  async updateKnowledge(
    id: string,
    updates: Partial<Omit<AbacusKnowledgeItem, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<AbacusResponse> {
    await this.delay(100 + Math.random() * 200);

    const item = this.knowledgeBase.get(id);

    if (!item) {
      return {
        success: false,
        error: `Item não encontrado: ${id}`,
        mock: true,
      };
    }

    const updatedItem: AbacusKnowledgeItem = {
      ...item,
      ...updates,
      updatedAt: Date.now(),
    };

    this.knowledgeBase.set(id, updatedItem);

    console.log(`[Abacus Mock] Conhecimento atualizado: ${id}`);

    return {
      success: true,
      data: updatedItem,
      mock: true,
    };
  }

  /**
   * Deletar item
   */
  async deleteKnowledge(id: string): Promise<AbacusResponse> {
    await this.delay(80 + Math.random() * 150);

    const existed = this.knowledgeBase.delete(id);

    if (!existed) {
      return {
        success: false,
        error: `Item não encontrado: ${id}`,
        mock: true,
      };
    }

    console.log(`[Abacus Mock] Conhecimento deletado: ${id}`);

    return {
      success: true,
      data: { deleted: true, id },
      mock: true,
    };
  }

  /**
   * Obter estatísticas
   */
  async getStats(): Promise<AbacusResponse> {
    await this.delay(100);

    const categories = new Set<string>();
    const allTags = new Set<string>();

    for (const item of this.knowledgeBase.values()) {
      categories.add(item.category);
      item.tags.forEach(tag => allTags.add(tag));
    }

    return {
      success: true,
      data: {
        totalItems: this.knowledgeBase.size,
        categories: Array.from(categories),
        categoryCount: categories.size,
        uniqueTags: Array.from(allTags),
        tagCount: allTags.size,
      },
      mock: true,
    };
  }

  /**
   * Limpar base de conhecimento
   */
  clear(): void {
    this.knowledgeBase.clear();
    this.idCounter = 1;
  }

  /**
   * Popular base com dados de exemplo
   */
  private seedKnowledgeBase(): void {
    const sampleData: Array<Omit<AbacusKnowledgeItem, 'id' | 'createdAt' | 'updatedAt'>> = [
      {
        title: 'Configuração Docker',
        content: 'Passos para configurar ambiente Docker com multi-containers',
        category: 'DevOps',
        tags: ['docker', 'containers', 'desenvolvimento'],
      },
      {
        title: 'Integração WhatsApp',
        content: 'Como integrar API do WhatsApp Business',
        category: 'Integrações',
        tags: ['whatsapp', 'api', 'mensagens'],
      },
      {
        title: 'Obsidian Workflows',
        content: 'Melhores práticas para organização de notas no Obsidian',
        category: 'Produtividade',
        tags: ['obsidian', 'notas', 'organização'],
      },
      {
        title: 'Automação Python',
        content: 'Scripts Python para automação de tarefas repetitivas',
        category: 'Automação',
        tags: ['python', 'scripts', 'automação'],
      },
      {
        title: 'Monitoramento com Grafana',
        content: 'Setup de dashboards Grafana para monitoramento de aplicações',
        category: 'Monitoramento',
        tags: ['grafana', 'prometheus', 'métricas'],
      },
    ];

    const now = Date.now();
    sampleData.forEach((data, index) => {
      const id = `ABACUS_SEED_${index + 1}`;
      this.knowledgeBase.set(id, {
        id,
        ...data,
        createdAt: now - (sampleData.length - index) * 3600000, // Espaçar 1h
        updatedAt: now - (sampleData.length - index) * 3600000,
      });
    });

    this.idCounter = sampleData.length + 1;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const abacusMock = new AbacusMock();
