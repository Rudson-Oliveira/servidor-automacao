/**
 * Mock Obsidian URI Schemes
 * Simula operações do Obsidian sem necessidade do app instalado
 */

export interface ObsidianNote {
  vault: string;
  path: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface ObsidianResponse {
  success: boolean;
  data?: any;
  error?: string;
  mock: boolean;
}

class ObsidianMock {
  private notes: Map<string, ObsidianNote> = new Map();
  private vaults: Set<string> = new Set(['main-vault', 'work-vault']);

  /**
   * Simula criação/atualização de nota
   */
  async createOrUpdateNote(
    vault: string,
    path: string,
    content: string
  ): Promise<ObsidianResponse> {
    await this.delay(50 + Math.random() * 150);

    if (!this.vaults.has(vault)) {
      return {
        success: false,
        error: `Vault "${vault}" não encontrado`,
        mock: true,
      };
    }

    const noteKey = `${vault}/${path}`;
    const existingNote = this.notes.get(noteKey);
    const now = Date.now();

    const note: ObsidianNote = {
      vault,
      path,
      content,
      createdAt: existingNote?.createdAt || now,
      updatedAt: now,
    };

    this.notes.set(noteKey, note);

    console.log(`[Obsidian Mock] Nota ${existingNote ? 'atualizada' : 'criada'}: ${vault}/${path}`);

    return {
      success: true,
      data: { noteKey, action: existingNote ? 'updated' : 'created' },
      mock: true,
    };
  }

  /**
   * Simula leitura de nota
   */
  async readNote(vault: string, path: string): Promise<ObsidianResponse> {
    await this.delay(30 + Math.random() * 100);

    const noteKey = `${vault}/${path}`;
    const note = this.notes.get(noteKey);

    if (!note) {
      return {
        success: false,
        error: `Nota não encontrada: ${vault}/${path}`,
        mock: true,
      };
    }

    return {
      success: true,
      data: note,
      mock: true,
    };
  }

  /**
   * Simula busca de notas
   */
  async searchNotes(vault: string, query: string): Promise<ObsidianResponse> {
    await this.delay(100 + Math.random() * 300);

    const results: ObsidianNote[] = [];

    for (const [key, note] of this.notes.entries()) {
      if (note.vault === vault) {
        const searchText = `${note.path} ${note.content}`.toLowerCase();
        if (searchText.includes(query.toLowerCase())) {
          results.push(note);
        }
      }
    }

    console.log(`[Obsidian Mock] Busca em ${vault} por "${query}": ${results.length} resultados`);

    return {
      success: true,
      data: { results, count: results.length },
      mock: true,
    };
  }

  /**
   * Simula abertura de nota (apenas registra ação)
   */
  async openNote(vault: string, path: string): Promise<ObsidianResponse> {
    await this.delay(50);

    const noteKey = `${vault}/${path}`;
    const note = this.notes.get(noteKey);

    if (!note) {
      return {
        success: false,
        error: `Nota não encontrada: ${vault}/${path}`,
        mock: true,
      };
    }

    console.log(`[Obsidian Mock] Nota aberta: ${vault}/${path}`);

    return {
      success: true,
      data: { opened: true, noteKey },
      mock: true,
    };
  }

  /**
   * Listar todas as notas de um vault
   */
  async listNotes(vault: string): Promise<ObsidianResponse> {
    await this.delay(80 + Math.random() * 200);

    const notes: ObsidianNote[] = [];

    for (const note of this.notes.values()) {
      if (note.vault === vault) {
        notes.push(note);
      }
    }

    return {
      success: true,
      data: { notes, count: notes.length },
      mock: true,
    };
  }

  /**
   * Obter vaults disponíveis
   */
  getVaults(): string[] {
    return Array.from(this.vaults);
  }

  /**
   * Adicionar vault (apenas para testes)
   */
  addVault(name: string): void {
    this.vaults.add(name);
  }

  /**
   * Limpar dados
   */
  clear(): void {
    this.notes.clear();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const obsidianMock = new ObsidianMock();
