/**
 * Sistema Genérico de URI Schemes
 * Gera URIs para abrir/controlar programas locais do usuário
 * Suporta: Obsidian, VSCode, Notion, Slack, Discord, e mais
 */

export interface URISchemeConfig {
  scheme: string; // Ex: "obsidian", "vscode", "notion"
  action?: string; // Ex: "new", "open", "search"
  params?: Record<string, string | number | boolean>;
}

export interface ProgramURITemplate {
  name: string;
  scheme: string;
  description: string;
  actions: {
    [action: string]: {
      description: string;
      params: string[];
      example: string;
    };
  };
}

/**
 * Templates de URI para programas populares
 */
export const URI_TEMPLATES: Record<string, ProgramURITemplate> = {
  obsidian: {
    name: 'Obsidian',
    scheme: 'obsidian',
    description: 'Aplicativo de notas e conhecimento',
    actions: {
      new: {
        description: 'Criar nova nota',
        params: ['vault', 'file', 'content'],
        example: 'obsidian://new?vault=MeuVault&file=Nota.md&content=Conteúdo',
      },
      open: {
        description: 'Abrir nota existente',
        params: ['vault', 'file'],
        example: 'obsidian://open?vault=MeuVault&file=Nota.md',
      },
      search: {
        description: 'Buscar notas',
        params: ['vault', 'query'],
        example: 'obsidian://search?vault=MeuVault&query=tag:#importante',
      },
      advanced: {
        description: 'URI avançada com comandos',
        params: ['vault', 'file', 'content', 'silent', 'append', 'overwrite'],
        example: 'obsidian://advanced-uri?vault=MeuVault&file=Nota.md&content=Texto&append=true',
      },
    },
  },
  vscode: {
    name: 'Visual Studio Code',
    scheme: 'vscode',
    description: 'Editor de código',
    actions: {
      open: {
        description: 'Abrir arquivo ou pasta',
        params: ['file', 'line', 'column'],
        example: 'vscode://file/caminho/arquivo.ts:10:5',
      },
      'open-folder': {
        description: 'Abrir pasta',
        params: ['path'],
        example: 'vscode://file/caminho/pasta',
      },
    },
  },
  notion: {
    name: 'Notion',
    scheme: 'notion',
    description: 'Workspace colaborativo',
    actions: {
      open: {
        description: 'Abrir página',
        params: ['pageId'],
        example: 'notion://notion.so/page-id',
      },
    },
  },
  slack: {
    name: 'Slack',
    scheme: 'slack',
    description: 'Comunicação em equipe',
    actions: {
      channel: {
        description: 'Abrir canal',
        params: ['team', 'id'],
        example: 'slack://channel?team=T123&id=C456',
      },
      user: {
        description: 'Abrir DM com usuário',
        params: ['team', 'id'],
        example: 'slack://user?team=T123&id=U789',
      },
    },
  },
  discord: {
    name: 'Discord',
    scheme: 'discord',
    description: 'Chat e comunidades',
    actions: {
      channel: {
        description: 'Abrir canal',
        params: ['channelId'],
        example: 'discord://discord.com/channels/123456789/987654321',
      },
    },
  },
  spotify: {
    name: 'Spotify',
    scheme: 'spotify',
    description: 'Streaming de música',
    actions: {
      track: {
        description: 'Tocar música',
        params: ['trackId'],
        example: 'spotify:track:6rqhFgbbKwnb9MLmUQDhG6',
      },
      playlist: {
        description: 'Abrir playlist',
        params: ['playlistId'],
        example: 'spotify:playlist:37i9dQZF1DXcBWIGoYBM5M',
      },
    },
  },
  zoom: {
    name: 'Zoom',
    scheme: 'zoommtg',
    description: 'Videoconferência',
    actions: {
      join: {
        description: 'Entrar em reunião',
        params: ['confno', 'pwd'],
        example: 'zoommtg://zoom.us/join?confno=123456789&pwd=abc123',
      },
    },
  },
  telegram: {
    name: 'Telegram',
    scheme: 'tg',
    description: 'Mensageiro',
    actions: {
      msg: {
        description: 'Enviar mensagem',
        params: ['to', 'text'],
        example: 'tg://msg?to=username&text=Olá',
      },
      resolve: {
        description: 'Abrir chat/canal',
        params: ['domain'],
        example: 'tg://resolve?domain=username',
      },
    },
  },
};

/**
 * Gera URI para abrir programa local
 */
export function generateURI(config: URISchemeConfig): string {
  const { scheme, action, params = {} } = config;

  // Construir base da URI
  let uri = `${scheme}://`;

  // Adicionar ação se fornecida
  if (action) {
    uri += action;
  }

  // Adicionar parâmetros
  const paramEntries = Object.entries(params);
  if (paramEntries.length > 0) {
    const queryString = paramEntries
      .map(([key, value]) => {
        const encodedValue = encodeURIComponent(String(value));
        return `${key}=${encodedValue}`;
      })
      .join('&');

    uri += (action ? '?' : '') + queryString;
  }

  return uri;
}

/**
 * Gera URI do Obsidian para criar nota
 */
export function generateObsidianNewNote(
  vault: string,
  fileName: string,
  content: string,
  options: {
    silent?: boolean;
    append?: boolean;
    overwrite?: boolean;
  } = {}
): string {
  const params: Record<string, string | boolean> = {
    vault,
    file: fileName,
    content,
  };

  if (options.silent) params.silent = true;
  if (options.append) params.append = true;
  if (options.overwrite) params.overwrite = true;

  return generateURI({
    scheme: 'obsidian',
    action: 'new',
    params,
  });
}

/**
 * Gera URI do VSCode para abrir arquivo
 */
export function generateVSCodeOpenFile(
  filePath: string,
  line?: number,
  column?: number
): string {
  let uri = `vscode://file${filePath}`;
  
  if (line !== undefined) {
    uri += `:${line}`;
    if (column !== undefined) {
      uri += `:${column}`;
    }
  }

  return uri;
}

/**
 * Gera URI do Slack para abrir canal
 */
export function generateSlackChannel(teamId: string, channelId: string): string {
  return generateURI({
    scheme: 'slack',
    action: 'channel',
    params: {
      team: teamId,
      id: channelId,
    },
  });
}

/**
 * Gera URI do Spotify para tocar música
 */
export function generateSpotifyTrack(trackId: string): string {
  return `spotify:track:${trackId}`;
}

/**
 * Gera URI do Zoom para entrar em reunião
 */
export function generateZoomJoin(meetingId: string, password?: string): string {
  const params: Record<string, string> = {
    confno: meetingId,
  };

  if (password) {
    params.pwd = password;
  }

  return generateURI({
    scheme: 'zoommtg',
    action: 'zoom.us/join',
    params,
  });
}

/**
 * Valida se URI é segura (não executa código malicioso)
 */
export function isURISafe(uri: string): boolean {
  // Lista de schemes permitidos
  const allowedSchemes = Object.keys(URI_TEMPLATES);
  
  // Verificar se URI começa com scheme permitido
  const hasAllowedScheme = allowedSchemes.some(scheme => 
    uri.toLowerCase().startsWith(`${scheme}://`)
  );

  if (!hasAllowedScheme) {
    return false;
  }

  // Verificar se não contém caracteres perigosos
  const dangerousPatterns = [
    'javascript:',
    'data:',
    'file://',
    '<script',
    'onerror=',
    'onclick=',
  ];

  const hasDangerousPattern = dangerousPatterns.some(pattern =>
    uri.toLowerCase().includes(pattern)
  );

  return !hasDangerousPattern;
}

/**
 * Lista todos os programas suportados
 */
export function getSupportedPrograms(): ProgramURITemplate[] {
  return Object.values(URI_TEMPLATES);
}

/**
 * Obtém template de um programa específico
 */
export function getProgramTemplate(programName: string): ProgramURITemplate | null {
  return URI_TEMPLATES[programName.toLowerCase()] || null;
}
