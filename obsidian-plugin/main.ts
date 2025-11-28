import { App, Plugin, PluginSettingTab, Setting, Notice, requestUrl } from 'obsidian';

interface AutomacaoSettings {
	serverUrl: string;
	apiToken: string;
	autoSync: boolean;
	syncInterval: number;
}

const DEFAULT_SETTINGS: AutomacaoSettings = {
	serverUrl: 'http://localhost:3000',
	apiToken: '',
	autoSync: false,
	syncInterval: 60,
}

export default class AutomacaoPlugin extends Plugin {
	settings: AutomacaoSettings;
	syncIntervalId: number | null = null;

	async onload() {
		await this.loadSettings();

		// Adicionar ícone na ribbon
		this.addRibbonIcon('sync', 'Sincronizar com Servidor', async () => {
			await this.sincronizarComServidor();
		});

		// Adicionar comandos
		this.addCommand({
			id: 'sincronizar-servidor',
			name: 'Sincronizar com Servidor',
			callback: async () => {
				await this.sincronizarComServidor();
			}
		});

		this.addCommand({
			id: 'enviar-nota-atual',
			name: 'Enviar Nota Atual para Servidor',
			callback: async () => {
				await this.enviarNotaAtual();
			}
		});

		this.addCommand({
			id: 'buscar-tarefas',
			name: 'Buscar Tarefas do Servidor',
			callback: async () => {
				await this.buscarTarefas();
			}
		});

		// Adicionar configurações
		this.addSettingTab(new AutomacaoSettingTab(this.app, this));

		// Iniciar sincronização automática se habilitada
		if (this.settings.autoSync) {
			this.iniciarSincronizacaoAutomatica();
		}

		console.log('Plugin de Automação carregado');
	}

	onunload() {
		if (this.syncIntervalId) {
			window.clearInterval(this.syncIntervalId);
		}
		console.log('Plugin de Automação descarregado');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// ==================== SINCRONIZAÇÃO ====================

	async sincronizarComServidor() {
		new Notice('Sincronizando com servidor...');

		try {
			const response = await this.fazerRequisicao('/api/obsidian/sync', {
				vault: this.app.vault.getName(),
				timestamp: Date.now(),
			});

			if (response.success) {
				new Notice(`✅ Sincronização concluída: ${response.message}`);
			} else {
				new Notice(`❌ Erro na sincronização: ${response.error}`);
			}
		} catch (error) {
			new Notice(`❌ Erro ao conectar com servidor: ${error.message}`);
			console.error('Erro na sincronização:', error);
		}
	}

	async enviarNotaAtual() {
		const activeFile = this.app.workspace.getActiveFile();

		if (!activeFile) {
			new Notice('❌ Nenhuma nota aberta');
			return;
		}

		try {
			const conteudo = await this.app.vault.read(activeFile);

			const response = await this.fazerRequisicao('/api/obsidian/enviar-nota', {
				vault: this.app.vault.getName(),
				arquivo: activeFile.path,
				conteudo: conteudo,
				metadata: {
					criado: activeFile.stat.ctime,
					modificado: activeFile.stat.mtime,
					tamanho: activeFile.stat.size,
				},
			});

			if (response.success) {
				new Notice(`✅ Nota enviada: ${activeFile.name}`);
			} else {
				new Notice(`❌ Erro ao enviar nota: ${response.error}`);
			}
		} catch (error) {
			new Notice(`❌ Erro ao enviar nota: ${error.message}`);
			console.error('Erro ao enviar nota:', error);
		}
	}

	async buscarTarefas() {
		new Notice('Buscando tarefas...');

		try {
			const response = await this.fazerRequisicao('/api/obsidian/tarefas', {
				vault: this.app.vault.getName(),
			});

			if (response.success && response.tarefas) {
				const tarefas = response.tarefas;

				if (tarefas.length === 0) {
					new Notice('✅ Nenhuma tarefa pendente');
					return;
				}

				new Notice(`📋 ${tarefas.length} tarefa(s) encontrada(s)`);

				// Processar cada tarefa
				for (const tarefa of tarefas) {
					await this.processarTarefa(tarefa);
				}

				new Notice(`✅ ${tarefas.length} tarefa(s) processada(s)`);
			} else {
				new Notice(`❌ Erro ao buscar tarefas: ${response.error}`);
			}
		} catch (error) {
			new Notice(`❌ Erro ao buscar tarefas: ${error.message}`);
			console.error('Erro ao buscar tarefas:', error);
		}
	}

	async processarTarefa(tarefa: any) {
		const tipo = tarefa.tipo;

		try {
			if (tipo === 'criar_nota') {
				await this.criarNota(tarefa.params.arquivo, tarefa.params.conteudo);
			} else if (tipo === 'atualizar_nota') {
				await this.atualizarNota(tarefa.params.arquivo, tarefa.params.conteudo);
			} else if (tipo === 'deletar_nota') {
				await this.deletarNota(tarefa.params.arquivo);
			} else if (tipo === 'listar_notas') {
				await this.listarNotas(tarefa.params.pasta);
			} else {
				console.warn(`Tipo de tarefa desconhecido: ${tipo}`);
			}

			// Notificar servidor sobre conclusão
			await this.fazerRequisicao('/api/obsidian/tarefa-concluida', {
				tarefaId: tarefa.id,
				sucesso: true,
			});
		} catch (error) {
			console.error(`Erro ao processar tarefa ${tipo}:`, error);

			// Notificar servidor sobre erro
			await this.fazerRequisicao('/api/obsidian/tarefa-concluida', {
				tarefaId: tarefa.id,
				sucesso: false,
				erro: error.message,
			});
		}
	}

	// ==================== OPERAÇÕES DE NOTAS ====================

	async criarNota(caminho: string, conteudo: string) {
		try {
			await this.app.vault.create(caminho, conteudo);
			new Notice(`✅ Nota criada: ${caminho}`);
		} catch (error) {
			if (error.message.includes('already exists')) {
				new Notice(`⚠️ Nota já existe: ${caminho}`);
			} else {
				throw error;
			}
		}
	}

	async atualizarNota(caminho: string, conteudo: string) {
		const arquivo = this.app.vault.getAbstractFileByPath(caminho);

		if (!arquivo) {
			throw new Error(`Arquivo não encontrado: ${caminho}`);
		}

		await this.app.vault.modify(arquivo as any, conteudo);
		new Notice(`✅ Nota atualizada: ${caminho}`);
	}

	async deletarNota(caminho: string) {
		const arquivo = this.app.vault.getAbstractFileByPath(caminho);

		if (!arquivo) {
			throw new Error(`Arquivo não encontrado: ${caminho}`);
		}

		await this.app.vault.delete(arquivo);
		new Notice(`✅ Nota deletada: ${caminho}`);
	}

	async listarNotas(pasta: string = '') {
		const arquivos = this.app.vault.getMarkdownFiles();

		const notas = arquivos
			.filter(f => !pasta || f.path.startsWith(pasta))
			.map(f => ({
				caminho: f.path,
				nome: f.name,
				criado: f.stat.ctime,
				modificado: f.stat.mtime,
				tamanho: f.stat.size,
			}));

		// Enviar lista para servidor
		await this.fazerRequisicao('/api/obsidian/lista-notas', {
			vault: this.app.vault.getName(),
			pasta: pasta,
			notas: notas,
		});

		new Notice(`📋 ${notas.length} nota(s) listada(s)`);
	}

	// ==================== SINCRONIZAÇÃO AUTOMÁTICA ====================

	iniciarSincronizacaoAutomatica() {
		if (this.syncIntervalId) {
			window.clearInterval(this.syncIntervalId);
		}

		const intervaloMs = this.settings.syncInterval * 1000;

		this.syncIntervalId = window.setInterval(async () => {
			await this.buscarTarefas();
		}, intervaloMs);

		console.log(`Sincronização automática iniciada (intervalo: ${this.settings.syncInterval}s)`);
	}

	pararSincronizacaoAutomatica() {
		if (this.syncIntervalId) {
			window.clearInterval(this.syncIntervalId);
			this.syncIntervalId = null;
			console.log('Sincronização automática parada');
		}
	}

	// ==================== COMUNICAÇÃO COM SERVIDOR ====================

	async fazerRequisicao(endpoint: string, dados: any): Promise<any> {
		const url = `${this.settings.serverUrl}${endpoint}`;

		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
		};

		if (this.settings.apiToken) {
			headers['Authorization'] = `Bearer ${this.settings.apiToken}`;
		}

		const response = await requestUrl({
			url: url,
			method: 'POST',
			headers: headers,
			body: JSON.stringify(dados),
		});

		return response.json;
	}
}

// ==================== CONFIGURAÇÕES ====================

class AutomacaoSettingTab extends PluginSettingTab {
	plugin: AutomacaoPlugin;

	constructor(app: App, plugin: AutomacaoPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Configurações de Automação' });

		new Setting(containerEl)
			.setName('URL do Servidor')
			.setDesc('URL do servidor de automação')
			.addText(text => text
				.setPlaceholder('http://localhost:3000')
				.setValue(this.plugin.settings.serverUrl)
				.onChange(async (value) => {
					this.plugin.settings.serverUrl = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Token de API')
			.setDesc('Token de autenticação (opcional)')
			.addText(text => text
				.setPlaceholder('seu-token-aqui')
				.setValue(this.plugin.settings.apiToken)
				.onChange(async (value) => {
					this.plugin.settings.apiToken = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Sincronização Automática')
			.setDesc('Buscar tarefas automaticamente do servidor')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoSync)
				.onChange(async (value) => {
					this.plugin.settings.autoSync = value;
					await this.plugin.saveSettings();

					if (value) {
						this.plugin.iniciarSincronizacaoAutomatica();
					} else {
						this.plugin.pararSincronizacaoAutomatica();
					}
				}));

		new Setting(containerEl)
			.setName('Intervalo de Sincronização')
			.setDesc('Intervalo em segundos entre sincronizações')
			.addText(text => text
				.setPlaceholder('60')
				.setValue(String(this.plugin.settings.syncInterval))
				.onChange(async (value) => {
					const num = parseInt(value);
					if (!isNaN(num) && num > 0) {
						this.plugin.settings.syncInterval = num;
						await this.plugin.saveSettings();

						if (this.plugin.settings.autoSync) {
							this.plugin.iniciarSincronizacaoAutomatica();
						}
					}
				}));

		// Botão de teste de conexão
		new Setting(containerEl)
			.setName('Testar Conexão')
			.setDesc('Verificar se o servidor está acessível')
			.addButton(button => button
				.setButtonText('Testar')
				.onClick(async () => {
					try {
						await this.plugin.sincronizarComServidor();
					} catch (error) {
						new Notice(`❌ Erro: ${error.message}`);
					}
				}));
	}
}
