import { describe, expect, it, vi, beforeEach } from "vitest";
import { obsidianAIRouter } from "./obsidian-ai";
import type { TrpcContext } from "../_core/context";
import * as llm from "../_core/llm";

// Mock do invokeLLM
vi.mock("../_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

function createMockContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("obsidianAI.generateNote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve gerar nota completa com metadados", async () => {
    const mockContent = `---
title: "Técnicas de Estudo"
date: 2025-11-29
tags: [estudo, produtividade, pomodoro]
---

# Técnicas de Estudo

## Método Pomodoro

O método Pomodoro é uma técnica de gerenciamento de tempo...

## Links Relacionados

- [[Produtividade]]
- [[Gestão de Tempo]]

#estudo #produtividade #pomodoro`;

    vi.mocked(llm.invokeLLM).mockResolvedValue({
      choices: [
        {
          message: {
            content: mockContent,
          },
        },
      ],
    } as any);

    const ctx = createMockContext();
    const caller = obsidianAIRouter.createCaller(ctx);

    const result = await caller.generateNote({
      prompt: "Criar uma nota sobre técnicas de estudo com método Pomodoro",
      model: "gemini",
      includeMetadata: true,
      includeTags: true,
      includeLinks: true,
    });

    expect(result.content).toBe(mockContent);
    expect(result.metadata.title).toBe("Técnicas de Estudo");
    expect(result.metadata.tags).toContain("estudo");
    expect(result.metadata.tags).toContain("produtividade");
    expect(result.metadata.links).toContain("Produtividade");
    expect(result.metadata.links).toContain("Gestão de Tempo");
    expect(result.metadata.model).toBe("gemini");
    expect(llm.invokeLLM).toHaveBeenCalledTimes(1);
  });

  it("deve gerar nota sem metadados quando solicitado", async () => {
    const mockContent = `# Nota Simples

Conteúdo da nota sem frontmatter.`;

    vi.mocked(llm.invokeLLM).mockResolvedValue({
      choices: [
        {
          message: {
            content: mockContent,
          },
        },
      ],
    } as any);

    const ctx = createMockContext();
    const caller = obsidianAIRouter.createCaller(ctx);

    const result = await caller.generateNote({
      prompt: "Criar uma nota simples",
      model: "gpt",
      includeMetadata: false,
      includeTags: false,
      includeLinks: false,
    });

    expect(result.content).toBe(mockContent);
    expect(result.metadata.frontmatter).toBeNull();
    expect(llm.invokeLLM).toHaveBeenCalledTimes(1);
  });

  it("deve lançar erro quando prompt está vazio", async () => {
    const ctx = createMockContext();
    const caller = obsidianAIRouter.createCaller(ctx);

    await expect(
      caller.generateNote({
        prompt: "",
        model: "gemini",
      })
    ).rejects.toThrow();
  });

  it("deve suportar diferentes modelos de IA", async () => {
    const mockContent = "# Nota Teste";

    vi.mocked(llm.invokeLLM).mockResolvedValue({
      choices: [{ message: { content: mockContent } }],
    } as any);

    const ctx = createMockContext();
    const caller = obsidianAIRouter.createCaller(ctx);

    const models: Array<"gemini" | "gpt" | "claude" | "perplexity"> = [
      "gemini",
      "gpt",
      "claude",
      "perplexity",
    ];

    for (const model of models) {
      const result = await caller.generateNote({
        prompt: "Teste",
        model,
      });

      expect(result.metadata.model).toBe(model);
    }

    expect(llm.invokeLLM).toHaveBeenCalledTimes(4);
  });
});

describe("obsidianAI.generateTags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve gerar tags relevantes baseadas no conteúdo", async () => {
    vi.mocked(llm.invokeLLM).mockResolvedValue({
      choices: [
        {
          message: {
            content: "produtividade, estudo, técnicas, pomodoro, gestão-tempo",
          },
        },
      ],
    } as any);

    const ctx = createMockContext();
    const caller = obsidianAIRouter.createCaller(ctx);

    const result = await caller.generateTags({
      content: "Artigo sobre técnicas de estudo e método Pomodoro para aumentar produtividade",
      maxTags: 5,
    });

    expect(result.tags).toHaveLength(5);
    expect(result.tags).toContain("produtividade");
    expect(result.tags).toContain("estudo");
    expect(llm.invokeLLM).toHaveBeenCalledTimes(1);
  });

  it("deve remover # das tags se presente", async () => {
    vi.mocked(llm.invokeLLM).mockResolvedValue({
      choices: [
        {
          message: {
            content: "#tag1, #tag2, #tag3",
          },
        },
      ],
    } as any);

    const ctx = createMockContext();
    const caller = obsidianAIRouter.createCaller(ctx);

    const result = await caller.generateTags({
      content: "Conteúdo de teste",
      maxTags: 3,
    });

    expect(result.tags).toEqual(["tag1", "tag2", "tag3"]);
  });

  it("deve respeitar o limite máximo de tags", async () => {
    vi.mocked(llm.invokeLLM).mockResolvedValue({
      choices: [
        {
          message: {
            content: "tag1, tag2, tag3, tag4, tag5, tag6, tag7, tag8",
          },
        },
      ],
    } as any);

    const ctx = createMockContext();
    const caller = obsidianAIRouter.createCaller(ctx);

    const result = await caller.generateTags({
      content: "Conteúdo de teste",
      maxTags: 3,
    });

    expect(result.tags).toHaveLength(3);
  });
});

describe("obsidianAI.suggestLinks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve sugerir links relacionados", async () => {
    vi.mocked(llm.invokeLLM).mockResolvedValue({
      choices: [
        {
          message: {
            content: `Produtividade
Gestão de Tempo
Técnicas de Estudo
Método Pomodoro
Organização Pessoal`,
          },
        },
      ],
    } as any);

    const ctx = createMockContext();
    const caller = obsidianAIRouter.createCaller(ctx);

    const result = await caller.suggestLinks({
      content: "Artigo sobre técnicas de estudo",
      maxLinks: 5,
    });

    expect(result.links).toHaveLength(5);
    expect(result.links).toContain("Produtividade");
    expect(result.links).toContain("Gestão de Tempo");
    expect(llm.invokeLLM).toHaveBeenCalledTimes(1);
  });

  it("deve considerar notas existentes ao sugerir links", async () => {
    vi.mocked(llm.invokeLLM).mockResolvedValue({
      choices: [
        {
          message: {
            content: "Nota Existente 1\nNota Existente 2",
          },
        },
      ],
    } as any);

    const ctx = createMockContext();
    const caller = obsidianAIRouter.createCaller(ctx);

    const existingNotes = ["Nota Existente 1", "Nota Existente 2", "Nota Existente 3"];

    const result = await caller.suggestLinks({
      content: "Conteúdo de teste",
      existingNotes,
      maxLinks: 5,
    });

    expect(result.links.length).toBeGreaterThan(0);
    expect(llm.invokeLLM).toHaveBeenCalledTimes(1);
  });
});

describe("obsidianAI.generateFrontmatter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve gerar frontmatter YAML completo", async () => {
    const mockFrontmatter = `title: "Técnicas de Estudo"
date: 2025-11-29
tags: [estudo, produtividade]
aliases: []
category: Educação
status: Em progresso`;

    vi.mocked(llm.invokeLLM).mockResolvedValue({
      choices: [
        {
          message: {
            content: mockFrontmatter,
          },
        },
      ],
    } as any);

    const ctx = createMockContext();
    const caller = obsidianAIRouter.createCaller(ctx);

    const result = await caller.generateFrontmatter({
      title: "Técnicas de Estudo",
      content: "Conteúdo sobre técnicas de estudo...",
      tags: ["estudo", "produtividade"],
    });

    expect(result.frontmatter).toBe(mockFrontmatter);
    expect(llm.invokeLLM).toHaveBeenCalledTimes(1);
  });

  it("deve remover marcadores de código YAML se presente", async () => {
    vi.mocked(llm.invokeLLM).mockResolvedValue({
      choices: [
        {
          message: {
            content: "```yaml\ntitle: Teste\n```",
          },
        },
      ],
    } as any);

    const ctx = createMockContext();
    const caller = obsidianAIRouter.createCaller(ctx);

    const result = await caller.generateFrontmatter({
      title: "Teste",
      content: "Conteúdo de teste",
    });

    expect(result.frontmatter).toBe("title: Teste");
  });
});

describe("obsidianAI.generateDataviewQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve gerar query Dataview do tipo list", async () => {
    const mockQuery = `LIST
FROM #tarefa
WHERE !completed
SORT date ASC`;

    vi.mocked(llm.invokeLLM).mockResolvedValue({
      choices: [
        {
          message: {
            content: mockQuery,
          },
        },
      ],
    } as any);

    const ctx = createMockContext();
    const caller = obsidianAIRouter.createCaller(ctx);

    const result = await caller.generateDataviewQuery({
      description: "Listar todas as tarefas não completadas ordenadas por data",
      queryType: "list",
    });

    expect(result.query).toBe(mockQuery);
    expect(result.type).toBe("list");
    expect(llm.invokeLLM).toHaveBeenCalledTimes(1);
  });

  it("deve gerar query Dataview do tipo table", async () => {
    const mockQuery = `TABLE file.ctime as "Criado", tags as "Tags"
FROM #projeto
SORT file.ctime DESC`;

    vi.mocked(llm.invokeLLM).mockResolvedValue({
      choices: [
        {
          message: {
            content: mockQuery,
          },
        },
      ],
    } as any);

    const ctx = createMockContext();
    const caller = obsidianAIRouter.createCaller(ctx);

    const result = await caller.generateDataviewQuery({
      description: "Tabela de projetos com data de criação e tags",
      queryType: "table",
    });

    expect(result.query).toBe(mockQuery);
    expect(result.type).toBe("table");
  });

  it("deve remover marcadores de código dataview se presente", async () => {
    vi.mocked(llm.invokeLLM).mockResolvedValue({
      choices: [
        {
          message: {
            content: "```dataview\nLIST\nFROM #teste\n```",
          },
        },
      ],
    } as any);

    const ctx = createMockContext();
    const caller = obsidianAIRouter.createCaller(ctx);

    const result = await caller.generateDataviewQuery({
      description: "Query de teste",
      queryType: "list",
    });

    expect(result.query).toBe("LIST\nFROM #teste");
  });
});
