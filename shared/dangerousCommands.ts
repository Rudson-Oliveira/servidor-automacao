/**
 * Utilitário para detectar comandos shell perigosos
 * 
 * Analisa comandos antes da execução e identifica operações de alto risco
 * que podem causar perda de dados, corrupção de sistema ou comprometimento de segurança.
 */

export interface DangerousCommandResult {
  isDangerous: boolean;
  severity: "low" | "medium" | "high" | "critical";
  risks: string[];
  matchedPatterns: string[];
}

/**
 * Padrões de comandos perigosos organizados por severidade
 */
const DANGEROUS_PATTERNS = {
  critical: [
    // Exclusão recursiva forçada
    { pattern: /rm\s+(-[rf]+|--recursive|--force)\s+[\/~*]/, risk: "Exclusão recursiva de arquivos do sistema" },
    { pattern: /del\s+\/[sfq]+\s+[c-z]:\\/, risk: "Exclusão forçada de arquivos do Windows" },
    { pattern: /format\s+[c-z]:/, risk: "Formatação de disco" },
    
    // Modificação de boot/sistema
    { pattern: /dd\s+if=.*of=\/dev\/(sd|hd|nvme)/, risk: "Sobrescrita direta de disco" },
    { pattern: /mkfs\.(ext[234]|xfs|btrfs|ntfs)/, risk: "Criação de sistema de arquivos (apaga dados)" },
    { pattern: /fdisk|parted|gparted/, risk: "Modificação de partições de disco" },
    
    // Desligamento/reinicialização forçada
    { pattern: /shutdown\s+(-[hr]|\/[sr])|reboot|halt/, risk: "Desligamento/reinicialização do sistema" },
    { pattern: /systemctl\s+(poweroff|reboot|halt)/, risk: "Desligamento do sistema via systemd" },
    
    // Fork bombs e DoS
    { pattern: /:\(\)\{.*:\|:.*\}/, risk: "Fork bomb (travamento do sistema)" },
    { pattern: /while\s+true.*do.*done/, risk: "Loop infinito (pode travar o sistema)" },
  ],
  
  high: [
    // Exclusão de diretórios importantes
    { pattern: /rm\s+-rf?\s+\/(bin|boot|dev|etc|lib|proc|root|sbin|sys|usr|var)/, risk: "Exclusão de diretório crítico do sistema" },
    { pattern: /rm\s+-rf?\s+~/, risk: "Exclusão do diretório home do usuário" },
    { pattern: /rd\s+\/s\s+.*\\(Windows|Program Files|System32)/, risk: "Exclusão de diretório crítico do Windows" },
    
    // Modificação de permissões perigosas
    { pattern: /chmod\s+777\s+\//, risk: "Permissões inseguras em diretório raiz" },
    { pattern: /chown\s+.*:\s+\//, risk: "Mudança de proprietário em diretório raiz" },
    
    // Execução de scripts remotos
    { pattern: /curl.*\|\s*(bash|sh|python|ruby|perl)/, risk: "Execução de script remoto não verificado" },
    { pattern: /wget.*-O\s*-\s*\|/, risk: "Download e execução de código remoto" },
    
    // Modificação de configurações de rede/firewall
    { pattern: /iptables\s+-F/, risk: "Limpeza de regras de firewall" },
    { pattern: /ufw\s+(disable|reset)/, risk: "Desativação do firewall" },
    
    // Comandos git destrutivos
    { pattern: /git\s+reset\s+--hard\s+HEAD~[0-9]+/, risk: "Reset git destrutivo (perde commits)" },
    { pattern: /git\s+clean\s+-[dfx]+/, risk: "Limpeza forçada de arquivos git" },
  ],
  
  medium: [
    // Exclusão de arquivos sem confirmação
    { pattern: /rm\s+-[rf]/, risk: "Exclusão de arquivos sem confirmação" },
    { pattern: /del\s+\/[fq]/, risk: "Exclusão forçada de arquivos" },
    
    // Modificação de processos
    { pattern: /kill\s+-9/, risk: "Encerramento forçado de processo" },
    { pattern: /killall/, risk: "Encerramento de múltiplos processos" },
    
    // Modificação de usuários/grupos
    { pattern: /userdel|groupdel/, risk: "Exclusão de usuário ou grupo" },
    { pattern: /passwd\s+root/, risk: "Mudança de senha do root" },
    
    // Operações de banco de dados
    { pattern: /DROP\s+(DATABASE|TABLE|SCHEMA)/i, risk: "Exclusão de banco de dados ou tabela" },
    { pattern: /TRUNCATE\s+TABLE/i, risk: "Limpeza completa de tabela" },
    
    // Modificação de arquivos de sistema
    { pattern: />\s*\/etc\/(passwd|shadow|sudoers|hosts)/, risk: "Sobrescrita de arquivo de configuração crítico" },
  ],
  
  low: [
    // Operações de rede suspeitas
    { pattern: /nc\s+-l/, risk: "Abertura de porta de rede (netcat)" },
    { pattern: /nmap/, risk: "Varredura de rede" },
    
    // Compilação/instalação de software
    { pattern: /make\s+install/, risk: "Instalação de software compilado" },
    { pattern: /(apt|yum|dnf|pacman)\s+install/, risk: "Instalação de pacotes do sistema" },
    
    // Operações de backup/restauração
    { pattern: /tar\s+(-[xz]|--extract)/, risk: "Extração de arquivo (pode sobrescrever arquivos)" },
    { pattern: /unzip\s+-o/, risk: "Descompactação com sobrescrita" },
  ],
};

/**
 * Analisa um comando shell e identifica riscos potenciais
 */
export function analyzeDangerousCommand(command: string): DangerousCommandResult {
  const normalizedCommand = command.trim().toLowerCase();
  const risks: string[] = [];
  const matchedPatterns: string[] = [];
  let highestSeverity: "low" | "medium" | "high" | "critical" = "low";
  
  // Verificar cada categoria de severidade
  for (const [severity, patterns] of Object.entries(DANGEROUS_PATTERNS)) {
    for (const { pattern, risk } of patterns) {
      if (pattern.test(normalizedCommand)) {
        risks.push(risk);
        matchedPatterns.push(pattern.source);
        
        // Atualizar severidade mais alta encontrada
        const severityLevel = { low: 1, medium: 2, high: 3, critical: 4 };
        const currentLevel = severityLevel[severity as keyof typeof severityLevel];
        const highestLevel = severityLevel[highestSeverity];
        
        if (currentLevel > highestLevel) {
          highestSeverity = severity as "low" | "medium" | "high" | "critical";
        }
      }
    }
  }
  
  return {
    isDangerous: risks.length > 0,
    severity: highestSeverity,
    risks,
    matchedPatterns,
  };
}

/**
 * Retorna cor baseada na severidade
 */
export function getSeverityColor(severity: "low" | "medium" | "high" | "critical"): string {
  const colors = {
    low: "text-yellow-600",
    medium: "text-orange-600",
    high: "text-red-600",
    critical: "text-red-700",
  };
  return colors[severity];
}

/**
 * Retorna ícone baseado na severidade
 */
export function getSeverityIcon(severity: "low" | "medium" | "high" | "critical"): string {
  const icons = {
    low: "⚠️",
    medium: "⚠️",
    high: "🚨",
    critical: "🔴",
  };
  return icons[severity];
}

/**
 * Retorna label traduzido da severidade
 */
export function getSeverityLabel(severity: "low" | "medium" | "high" | "critical"): string {
  const labels = {
    low: "Baixo Risco",
    medium: "Risco Médio",
    high: "Alto Risco",
    critical: "RISCO CRÍTICO",
  };
  return labels[severity];
}
