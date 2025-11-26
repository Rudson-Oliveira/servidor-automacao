import { describe, expect, it } from 'vitest';
import {
  generateURI,
  generateObsidianNewNote,
  generateVSCodeOpenFile,
  generateSlackChannel,
  generateSpotifyTrack,
  generateZoomJoin,
  isURISafe,
  getSupportedPrograms,
  getProgramTemplate,
} from './uri-schemes';

describe('URI Schemes', () => {
  describe('generateURI', () => {
    it('deve gerar URI básica sem parâmetros', () => {
      const uri = generateURI({
        scheme: 'obsidian',
      });

      expect(uri).toBe('obsidian://');
    });

    it('deve gerar URI com ação', () => {
      const uri = generateURI({
        scheme: 'obsidian',
        action: 'new',
      });

      expect(uri).toBe('obsidian://new');
    });

    it('deve gerar URI com parâmetros', () => {
      const uri = generateURI({
        scheme: 'obsidian',
        action: 'new',
        params: {
          vault: 'MeuVault',
          file: 'Nota.md',
        },
      });

      expect(uri).toBe('obsidian://new?vault=MeuVault&file=Nota.md');
    });

    it('deve fazer encoding de parâmetros especiais', () => {
      const uri = generateURI({
        scheme: 'obsidian',
        action: 'new',
        params: {
          content: 'Olá Mundo!',
        },
      });

      expect(uri).toContain('content=Ol%C3%A1%20Mundo!');
    });

    it('deve suportar parâmetros numéricos e booleanos', () => {
      const uri = generateURI({
        scheme: 'test',
        params: {
          count: 42,
          enabled: true,
        },
      });

      expect(uri).toContain('count=42');
      expect(uri).toContain('enabled=true');
    });
  });

  describe('generateObsidianNewNote', () => {
    it('deve gerar URI para criar nota', () => {
      const uri = generateObsidianNewNote(
        'MeuVault',
        'Notas/Teste.md',
        '# Título\n\nConteúdo'
      );

      expect(uri).toContain('obsidian://new');
      expect(uri).toContain('vault=MeuVault');
      expect(uri).toContain('file=Notas%2FTeste.md');
      expect(uri).toContain('content=');
    });

    it('deve incluir opções quando fornecidas', () => {
      const uri = generateObsidianNewNote(
        'Vault',
        'nota.md',
        'conteudo',
        {
          silent: true,
          append: true,
        }
      );

      expect(uri).toContain('silent=true');
      expect(uri).toContain('append=true');
    });
  });

  describe('generateVSCodeOpenFile', () => {
    it('deve gerar URI para abrir arquivo', () => {
      const uri = generateVSCodeOpenFile('/caminho/arquivo.ts');

      expect(uri).toBe('vscode://file/caminho/arquivo.ts');
    });

    it('deve incluir linha quando fornecida', () => {
      const uri = generateVSCodeOpenFile('/arquivo.ts', 42);

      expect(uri).toBe('vscode://file/arquivo.ts:42');
    });

    it('deve incluir linha e coluna quando fornecidas', () => {
      const uri = generateVSCodeOpenFile('/arquivo.ts', 42, 10);

      expect(uri).toBe('vscode://file/arquivo.ts:42:10');
    });
  });

  describe('generateSlackChannel', () => {
    it('deve gerar URI para abrir canal do Slack', () => {
      const uri = generateSlackChannel('T123456', 'C789012');

      expect(uri).toBe('slack://channel?team=T123456&id=C789012');
    });
  });

  describe('generateSpotifyTrack', () => {
    it('deve gerar URI para tocar música no Spotify', () => {
      const uri = generateSpotifyTrack('6rqhFgbbKwnb9MLmUQDhG6');

      expect(uri).toBe('spotify:track:6rqhFgbbKwnb9MLmUQDhG6');
    });
  });

  describe('generateZoomJoin', () => {
    it('deve gerar URI para entrar em reunião do Zoom', () => {
      const uri = generateZoomJoin('123456789');

      expect(uri).toBe('zoommtg://zoom.us/join?confno=123456789');
    });

    it('deve incluir senha quando fornecida', () => {
      const uri = generateZoomJoin('123456789', 'abc123');

      expect(uri).toBe('zoommtg://zoom.us/join?confno=123456789&pwd=abc123');
    });
  });

  describe('isURISafe', () => {
    it('deve aceitar URIs de schemes permitidos', () => {
      expect(isURISafe('obsidian://new?vault=Test')).toBe(true);
      expect(isURISafe('vscode://file/test.ts')).toBe(true);
      expect(isURISafe('slack://channel?id=123')).toBe(true);
    });

    it('deve rejeitar schemes não permitidos', () => {
      expect(isURISafe('javascript:alert(1)')).toBe(false);
      expect(isURISafe('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(isURISafe('file:///etc/passwd')).toBe(false);
    });

    it('deve rejeitar padrões perigosos', () => {
      expect(isURISafe('obsidian://<script>alert(1)</script>')).toBe(false);
      expect(isURISafe('vscode://onerror=alert(1)')).toBe(false);
    });

    it('deve ser case-insensitive', () => {
      expect(isURISafe('OBSIDIAN://new')).toBe(true);
      expect(isURISafe('JAVASCRIPT:alert(1)')).toBe(false);
    });
  });

  describe('getSupportedPrograms', () => {
    it('deve retornar lista de programas suportados', () => {
      const programs = getSupportedPrograms();

      expect(programs.length).toBeGreaterThan(0);
      expect(programs[0]).toHaveProperty('name');
      expect(programs[0]).toHaveProperty('scheme');
      expect(programs[0]).toHaveProperty('description');
      expect(programs[0]).toHaveProperty('actions');
    });

    it('deve incluir Obsidian, VSCode, Slack', () => {
      const programs = getSupportedPrograms();
      const names = programs.map(p => p.name);

      expect(names).toContain('Obsidian');
      expect(names).toContain('Visual Studio Code');
      expect(names).toContain('Slack');
    });
  });

  describe('getProgramTemplate', () => {
    it('deve retornar template de programa existente', () => {
      const template = getProgramTemplate('obsidian');

      expect(template).not.toBeNull();
      expect(template?.name).toBe('Obsidian');
      expect(template?.scheme).toBe('obsidian');
    });

    it('deve retornar null para programa inexistente', () => {
      const template = getProgramTemplate('programa-inexistente');

      expect(template).toBeNull();
    });

    it('deve ser case-insensitive', () => {
      const template = getProgramTemplate('OBSIDIAN');

      expect(template).not.toBeNull();
      expect(template?.name).toBe('Obsidian');
    });

    it('deve incluir ações do programa', () => {
      const template = getProgramTemplate('obsidian');

      expect(template?.actions).toHaveProperty('new');
      expect(template?.actions).toHaveProperty('open');
      expect(template?.actions).toHaveProperty('search');
    });
  });

  describe('Integração completa', () => {
    it('deve gerar URI válida e segura para Obsidian', () => {
      const uri = generateObsidianNewNote(
        'Trabalho',
        'Reuniões/2025-01-26.md',
        '# Reunião\n\n- Item 1\n- Item 2'
      );

      expect(isURISafe(uri)).toBe(true);
      expect(uri).toContain('obsidian://new');
      expect(uri).toContain('vault=Trabalho');
    });

    it('deve gerar URI válida e segura para VSCode', () => {
      const uri = generateVSCodeOpenFile('/projeto/src/index.ts', 10, 5);

      expect(isURISafe(uri)).toBe(true);
      expect(uri).toBe('vscode://file/projeto/src/index.ts:10:5');
    });

    it('deve validar templates de todos os programas', () => {
      const programs = getSupportedPrograms();

      programs.forEach(program => {
        expect(program.name).toBeTruthy();
        expect(program.scheme).toBeTruthy();
        expect(program.description).toBeTruthy();
        expect(Object.keys(program.actions).length).toBeGreaterThan(0);

        // Verificar estrutura de cada ação
        Object.values(program.actions).forEach(action => {
          expect(action.description).toBeTruthy();
          expect(Array.isArray(action.params)).toBe(true);
          expect(action.example).toBeTruthy();
        });
      });
    });
  });
});
