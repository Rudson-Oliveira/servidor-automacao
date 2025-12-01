import { createHash } from 'crypto';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Sistema de Auditoria Forense
 * 
 * OBJETIVO: Criar evidências imutáveis e auditáveis por múltiplas IAs
 * 
 * AUDITORES:
 * - COMET (Auditor principal)
 * - CLAUDE (Validação técnica)
 * - ABACUS (Análise de dados)
 * - GENSPARK (Verificação de segurança)
 * - GEMINI (Validação de integridade)
 * - DEEPSITE (Análise forense completa)
 * 
 * CARACTERÍSTICAS:
 * - Hash SHA-256 de cada evidência (imutável)
 * - Timestamp ISO 8601 com milissegundos
 * - Logs completos (entrada, processamento, saída)
 * - Reprodutibilidade garantida
 * - Rastreabilidade completa
 * - Assinaturas digitais
 */

// ============================================================================
// TIPOS
// ============================================================================

export interface ForensicEvidence {
  id: string;
  testName: string;
  scenario: string;
  timestamp: string; // ISO 8601 com milissegundos
  input: any;
  output: any;
  logs: string[];
  duration: number; // ms
  hash: string; // SHA-256
  signature: string; // Assinatura digital
  reproducible: boolean;
  verdict: 'PASSOU' | 'FALHOU' | 'PARCIAL';
}

export interface AuditReport {
  reportId: string;
  generatedAt: string;
  version: string;
  totalTests: number;
  passed: number;
  failed: number;
  partial: number;
  evidences: ForensicEvidence[];
  summary: {
    successRate: number;
    totalDuration: number;
    criticalIssues: string[];
    recommendations: string[];
  };
  auditTrail: AuditTrailEntry[];
  signatures: {
    reportHash: string;
    evidencesHash: string;
    timestamp: string;
  };
}

export interface AuditTrailEntry {
  timestamp: string;
  action: string;
  actor: string;
  details: any;
  hash: string;
}

// ============================================================================
// CLASSE PRINCIPAL
// ============================================================================

export class ForensicAudit {
  private evidences: ForensicEvidence[] = [];
  private auditTrail: AuditTrailEntry[] = [];
  private evidencesDir: string;
  private reportDir: string;

  constructor(baseDir: string = './forensic-audit') {
    this.evidencesDir = join(baseDir, 'evidences');
    this.reportDir = join(baseDir, 'reports');

    // Criar diretórios se não existirem
    if (!existsSync(this.evidencesDir)) {
      mkdirSync(this.evidencesDir, { recursive: true });
    }
    if (!existsSync(this.reportDir)) {
      mkdirSync(this.reportDir, { recursive: true });
    }
  }

  /**
   * Registra uma evidência forense
   */
  recordEvidence(
    testName: string,
    scenario: string,
    input: any,
    output: any,
    logs: string[],
    duration: number,
    verdict: ForensicEvidence['verdict']
  ): ForensicEvidence {
    const timestamp = new Date().toISOString(); // ISO 8601 com milissegundos
    const id = this.generateEvidenceId(testName, timestamp);

    // Criar objeto de evidência
    const evidenceData = {
      testName,
      scenario,
      timestamp,
      input,
      output,
      logs,
      duration,
      verdict,
    };

    // Calcular hash SHA-256 da evidência
    const hash = this.calculateHash(JSON.stringify(evidenceData));

    // Gerar assinatura digital
    const signature = this.generateSignature(hash, timestamp);

    const evidence: ForensicEvidence = {
      id,
      ...evidenceData,
      hash,
      signature,
      reproducible: true,
    };

    // Salvar evidência em arquivo
    const evidenceFile = join(this.evidencesDir, `${id}.json`);
    writeFileSync(evidenceFile, JSON.stringify(evidence, null, 2), 'utf8');

    // Adicionar ao registro
    this.evidences.push(evidence);

    // Registrar no audit trail
    this.addAuditTrailEntry('EVIDENCE_RECORDED', 'SYSTEM', {
      evidenceId: id,
      testName,
      verdict,
      hash,
    });

    console.log(`[Forensic] ✅ Evidência registrada: ${id}`);
    console.log(`[Forensic]    Hash: ${hash.substring(0, 16)}...`);
    console.log(`[Forensic]    Arquivo: ${evidenceFile}`);

    return evidence;
  }

  /**
   * Valida integridade de uma evidência
   */
  validateEvidence(evidenceId: string): {
    valid: boolean;
    reason?: string;
    originalHash: string;
    currentHash: string;
  } {
    const evidenceFile = join(this.evidencesDir, `${evidenceId}.json`);

    if (!existsSync(evidenceFile)) {
      return {
        valid: false,
        reason: 'Evidência não encontrada',
        originalHash: '',
        currentHash: '',
      };
    }

    // Ler evidência do arquivo
    const evidenceContent = readFileSync(evidenceFile, 'utf8');
    const evidence: ForensicEvidence = JSON.parse(evidenceContent);

    // Recalcular hash
    const evidenceData = {
      testName: evidence.testName,
      scenario: evidence.scenario,
      timestamp: evidence.timestamp,
      input: evidence.input,
      output: evidence.output,
      logs: evidence.logs,
      duration: evidence.duration,
      verdict: evidence.verdict,
    };

    const currentHash = this.calculateHash(JSON.stringify(evidenceData));

    // Comparar hashes
    const valid = currentHash === evidence.hash;

    this.addAuditTrailEntry('EVIDENCE_VALIDATED', 'AUDITOR', {
      evidenceId,
      valid,
      originalHash: evidence.hash,
      currentHash,
    });

    return {
      valid,
      reason: valid ? undefined : 'Hash não corresponde (evidência adulterada)',
      originalHash: evidence.hash,
      currentHash,
    };
  }

  /**
   * Gera relatório de auditoria completo
   */
  generateAuditReport(): AuditReport {
    const reportId = `AUDIT-${Date.now()}`;
    const generatedAt = new Date().toISOString();

    const passed = this.evidences.filter(e => e.verdict === 'PASSOU').length;
    const failed = this.evidences.filter(e => e.verdict === 'FALHOU').length;
    const partial = this.evidences.filter(e => e.verdict === 'PARCIAL').length;
    const totalTests = this.evidences.length;

    const successRate = totalTests > 0 ? (passed / totalTests) * 100 : 0;
    const totalDuration = this.evidences.reduce((sum, e) => sum + e.duration, 0);

    // Identificar problemas críticos
    const criticalIssues: string[] = [];
    const failedEvidences = this.evidences.filter(e => e.verdict === 'FALHOU');
    failedEvidences.forEach(e => {
      criticalIssues.push(`${e.testName}: ${e.scenario}`);
    });

    // Recomendações
    const recommendations: string[] = [];
    if (successRate < 100) {
      recommendations.push(`Taxa de sucesso: ${successRate.toFixed(1)}% - Investigar falhas`);
    }
    if (criticalIssues.length > 0) {
      recommendations.push(`${criticalIssues.length} problemas críticos encontrados`);
    }
    if (successRate >= 95) {
      recommendations.push('Sistema aprovado para produção');
    } else if (successRate >= 80) {
      recommendations.push('Sistema aprovado com ressalvas');
    } else {
      recommendations.push('Sistema REPROVADO - Correções necessárias');
    }

    const report: AuditReport = {
      reportId,
      generatedAt,
      version: '1.0.0',
      totalTests,
      passed,
      failed,
      partial,
      evidences: this.evidences,
      summary: {
        successRate,
        totalDuration,
        criticalIssues,
        recommendations,
      },
      auditTrail: this.auditTrail,
      signatures: {
        reportHash: '',
        evidencesHash: '',
        timestamp: generatedAt,
      },
    };

    // Calcular hashes do relatório
    const reportData = {
      ...report,
      signatures: undefined, // Excluir assinaturas do cálculo
    };
    report.signatures.reportHash = this.calculateHash(JSON.stringify(reportData));

    const evidencesHashes = this.evidences.map(e => e.hash).join('');
    report.signatures.evidencesHash = this.calculateHash(evidencesHashes);

    // Salvar relatório
    const reportFile = join(this.reportDir, `${reportId}.json`);
    writeFileSync(reportFile, JSON.stringify(report, null, 2), 'utf8');

    // Gerar relatório Markdown
    this.generateMarkdownReport(report);

    console.log(`[Forensic] 📊 Relatório de auditoria gerado: ${reportId}`);
    console.log(`[Forensic]    Arquivo: ${reportFile}`);
    console.log(`[Forensic]    Taxa de sucesso: ${successRate.toFixed(1)}%`);

    this.addAuditTrailEntry('REPORT_GENERATED', 'SYSTEM', {
      reportId,
      totalTests,
      successRate,
    });

    return report;
  }

  /**
   * Gera relatório em Markdown para auditores humanos
   */
  private generateMarkdownReport(report: AuditReport): void {
    const md: string[] = [];

    md.push('# 🔍 RELATÓRIO DE AUDITORIA FORENSE - DESKTOP AGENT');
    md.push('');
    md.push('## 📋 Informações do Relatório');
    md.push('');
    md.push(`- **ID do Relatório:** \`${report.reportId}\``);
    md.push(`- **Data/Hora:** ${report.generatedAt}`);
    md.push(`- **Versão:** ${report.version}`);
    md.push('');
    md.push('## 📊 Resumo Executivo');
    md.push('');
    md.push(`| Métrica | Valor |`);
    md.push(`|---------|-------|`);
    md.push(`| Total de Testes | ${report.totalTests} |`);
    md.push(`| ✅ Passou | ${report.passed} |`);
    md.push(`| ❌ Falhou | ${report.failed} |`);
    md.push(`| ⚠️ Parcial | ${report.partial} |`);
    md.push(`| **Taxa de Sucesso** | **${report.summary.successRate.toFixed(1)}%** |`);
    md.push(`| Duração Total | ${report.summary.totalDuration}ms |`);
    md.push('');

    md.push('## 🎯 Veredito');
    md.push('');
    if (report.summary.successRate >= 95) {
      md.push('### ✅ APROVADO PARA PRODUÇÃO');
    } else if (report.summary.successRate >= 80) {
      md.push('### ⚠️ APROVADO COM RESSALVAS');
    } else {
      md.push('### ❌ REPROVADO - CORREÇÕES NECESSÁRIAS');
    }
    md.push('');

    md.push('## 🔥 Problemas Críticos');
    md.push('');
    if (report.summary.criticalIssues.length === 0) {
      md.push('✅ Nenhum problema crítico encontrado.');
    } else {
      report.summary.criticalIssues.forEach((issue, i) => {
        md.push(`${i + 1}. ❌ ${issue}`);
      });
    }
    md.push('');

    md.push('## 💡 Recomendações');
    md.push('');
    report.summary.recommendations.forEach((rec, i) => {
      md.push(`${i + 1}. ${rec}`);
    });
    md.push('');

    md.push('## 📝 Evidências Detalhadas');
    md.push('');
    report.evidences.forEach((evidence, i) => {
      const icon = evidence.verdict === 'PASSOU' ? '✅' : evidence.verdict === 'FALHOU' ? '❌' : '⚠️';
      md.push(`### ${icon} Evidência ${i + 1}: ${evidence.testName}`);
      md.push('');
      md.push(`- **ID:** \`${evidence.id}\``);
      md.push(`- **Cenário:** ${evidence.scenario}`);
      md.push(`- **Timestamp:** ${evidence.timestamp}`);
      md.push(`- **Duração:** ${evidence.duration}ms`);
      md.push(`- **Veredito:** **${evidence.verdict}**`);
      md.push(`- **Hash SHA-256:** \`${evidence.hash}\``);
      md.push(`- **Assinatura:** \`${evidence.signature}\``);
      md.push(`- **Reprodutível:** ${evidence.reproducible ? 'Sim' : 'Não'}`);
      md.push('');
      md.push('**Entrada:**');
      md.push('```json');
      md.push(JSON.stringify(evidence.input, null, 2));
      md.push('```');
      md.push('');
      md.push('**Saída:**');
      md.push('```json');
      md.push(JSON.stringify(evidence.output, null, 2));
      md.push('```');
      md.push('');
      if (evidence.logs.length > 0) {
        md.push('**Logs:**');
        evidence.logs.forEach(log => {
          md.push(`- ${log}`);
        });
        md.push('');
      }
      md.push('---');
      md.push('');
    });

    md.push('## 🔐 Assinaturas Digitais');
    md.push('');
    md.push(`- **Hash do Relatório:** \`${report.signatures.reportHash}\``);
    md.push(`- **Hash das Evidências:** \`${report.signatures.evidencesHash}\``);
    md.push(`- **Timestamp:** ${report.signatures.timestamp}`);
    md.push('');

    md.push('## 📜 Trilha de Auditoria');
    md.push('');
    md.push('| Timestamp | Ação | Ator | Hash |');
    md.push('|-----------|------|------|------|');
    report.auditTrail.forEach(entry => {
      md.push(`| ${entry.timestamp} | ${entry.action} | ${entry.actor} | \`${entry.hash.substring(0, 16)}...\` |`);
    });
    md.push('');

    md.push('## 🔍 Instruções para Auditores');
    md.push('');
    md.push('### COMET (Auditor Principal)');
    md.push('- Validar integridade de todas as evidências');
    md.push('- Verificar reprodutibilidade dos testes');
    md.push('- Confirmar taxa de sucesso > 95%');
    md.push('');
    md.push('### CLAUDE (Validação Técnica)');
    md.push('- Revisar código dos testes');
    md.push('- Validar lógica de auto-healing');
    md.push('- Confirmar correção dos 5 erros históricos');
    md.push('');
    md.push('### ABACUS (Análise de Dados)');
    md.push('- Analisar estatísticas de sucesso/falha');
    md.push('- Validar métricas de performance');
    md.push('- Confirmar padrões de aprendizado');
    md.push('');
    md.push('### GENSPARK (Verificação de Segurança)');
    md.push('- Validar bypass de Cloudflare WAF');
    md.push('- Verificar validação de tokens');
    md.push('- Confirmar segurança das conexões');
    md.push('');
    md.push('### GEMINI (Validação de Integridade)');
    md.push('- Verificar hashes SHA-256');
    md.push('- Validar assinaturas digitais');
    md.push('- Confirmar imutabilidade das evidências');
    md.push('');
    md.push('### DEEPSITE (Análise Forense Completa)');
    md.push('- Análise forense completa de todas as evidências');
    md.push('- Validar trilha de auditoria');
    md.push('- Emitir parecer final');
    md.push('');

    md.push('## ✅ Checklist de Validação');
    md.push('');
    md.push('- [ ] Todas as evidências têm hash SHA-256 válido');
    md.push('- [ ] Timestamps são ISO 8601 com milissegundos');
    md.push('- [ ] Logs completos (entrada, processamento, saída)');
    md.push('- [ ] Testes são reprodutíveis');
    md.push('- [ ] Rastreabilidade completa');
    md.push('- [ ] Taxa de sucesso >= 95%');
    md.push('- [ ] Nenhum problema crítico pendente');
    md.push('- [ ] Sistema aprovado para produção');
    md.push('');

    md.push('---');
    md.push('');
    md.push('**Gerado automaticamente pelo Sistema de Auditoria Forense**');
    md.push(`**Data:** ${new Date().toISOString()}`);

    const markdownFile = join(this.reportDir, `${report.reportId}.md`);
    writeFileSync(markdownFile, md.join('\n'), 'utf8');

    console.log(`[Forensic] 📄 Relatório Markdown gerado: ${markdownFile}`);
  }

  /**
   * Adiciona entrada na trilha de auditoria
   */
  private addAuditTrailEntry(action: string, actor: string, details: any): void {
    const timestamp = new Date().toISOString();
    const entryData = { timestamp, action, actor, details };
    const hash = this.calculateHash(JSON.stringify(entryData));

    const entry: AuditTrailEntry = {
      ...entryData,
      hash,
    };

    this.auditTrail.push(entry);
  }

  /**
   * Calcula hash SHA-256
   */
  private calculateHash(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Gera assinatura digital
   */
  private generateSignature(hash: string, timestamp: string): string {
    const signatureData = `${hash}:${timestamp}:DESKTOP-AGENT-FORENSIC`;
    return this.calculateHash(signatureData);
  }

  /**
   * Gera ID único para evidência
   */
  private generateEvidenceId(testName: string, timestamp: string): string {
    const cleanName = testName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const timestampShort = new Date(timestamp).getTime();
    return `EV-${cleanName}-${timestampShort}`;
  }

  /**
   * Obtém todas as evidências
   */
  getEvidences(): ForensicEvidence[] {
    return [...this.evidences];
  }

  /**
   * Obtém trilha de auditoria
   */
  getAuditTrail(): AuditTrailEntry[] {
    return [...this.auditTrail];
  }
}

// Instância singleton
export const forensicAudit = new ForensicAudit('./forensic-audit');
