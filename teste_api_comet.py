#!/usr/bin/env python3
"""
Script de Teste da API de Catalogação de Links no Obsidian
Desenvolvido para o Comet testar a funcionalidade

Autor: Manus
Data: 24/11/2025
"""

import requests
import json
import webbrowser
from datetime import datetime
from typing import Dict, List, Optional

# ========================================
# CONFIGURAÇÃO
# ========================================

API_URL = "https://3000-irvlht34m10g6oxfkoitw-1b347671.manusvm.computer/api/obsidian/catalogar-links"

# ========================================
# DADOS DE TESTE
# ========================================

# Teste 1: Simples (1 link)
TESTE_SIMPLES = {
    "titulo": "Teste Comet - Simples",
    "links": [
        {
            "nome": "OpenAI",
            "url": "https://openai.com",
            "categoria": "IA"
        }
    ]
}

# Teste 2: Múltiplos Links (5 links)
TESTE_MULTIPLOS = {
    "titulo": "Teste Comet - Múltiplos Links",
    "links": [
        {
            "nome": "OpenAI GPT-4",
            "url": "https://openai.com/gpt-4",
            "categoria": "IA Generativa"
        },
        {
            "nome": "Anthropic Claude",
            "url": "https://anthropic.com",
            "categoria": "IA Generativa"
        },
        {
            "nome": "Google Gemini",
            "url": "https://gemini.google.com",
            "categoria": "IA Generativa"
        },
        {
            "nome": "GitHub Copilot",
            "url": "https://github.com/features/copilot",
            "categoria": "Desenvolvimento"
        },
        {
            "nome": "Cursor AI",
            "url": "https://cursor.sh",
            "categoria": "Desenvolvimento"
        }
    ]
}

# Teste 3: Categorias Múltiplas (10 links)
TESTE_CATEGORIAS = {
    "titulo": "Teste Comet - Categorias Múltiplas",
    "links": [
        # IA Generativa
        {
            "nome": "OpenAI",
            "url": "https://openai.com",
            "categoria": "IA Generativa"
        },
        {
            "nome": "Anthropic",
            "url": "https://anthropic.com",
            "categoria": "IA Generativa"
        },
        {
            "nome": "Google AI",
            "url": "https://ai.google",
            "categoria": "IA Generativa"
        },
        # Desenvolvimento
        {
            "nome": "GitHub",
            "url": "https://github.com",
            "categoria": "Desenvolvimento"
        },
        {
            "nome": "Stack Overflow",
            "url": "https://stackoverflow.com",
            "categoria": "Desenvolvimento"
        },
        {
            "nome": "MDN Web Docs",
            "url": "https://developer.mozilla.org",
            "categoria": "Desenvolvimento"
        },
        # Produtividade
        {
            "nome": "Notion",
            "url": "https://notion.so",
            "categoria": "Produtividade"
        },
        {
            "nome": "Obsidian",
            "url": "https://obsidian.md",
            "categoria": "Produtividade"
        },
        {
            "nome": "Manus",
            "url": "https://manus.im",
            "categoria": "Produtividade"
        },
        # Pesquisa
        {
            "nome": "Google Scholar",
            "url": "https://scholar.google.com",
            "categoria": "Pesquisa"
        }
    ]
}

# ========================================
# FUNÇÕES
# ========================================

def exibir_banner():
    """Exibe banner inicial do script"""
    print("=" * 70)
    print("🧪 TESTE DA API DE CATALOGAÇÃO DE LINKS NO OBSIDIAN")
    print("=" * 70)
    print(f"📅 Data/Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print(f"🔗 API URL: {API_URL}")
    print("=" * 70)
    print()


def chamar_api(dados: Dict) -> Optional[Dict]:
    """
    Chama a API de catalogação de links
    
    Args:
        dados: Dicionário com título e lista de links
        
    Returns:
        Resposta da API ou None em caso de erro
    """
    print(f"📤 Enviando requisição para API...")
    print(f"   Título: {dados['titulo']}")
    print(f"   Total de links: {len(dados['links'])}")
    
    try:
        response = requests.post(
            API_URL,
            json=dados,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("   ✅ Sucesso!")
            return response.json()
        else:
            print(f"   ❌ Erro: {response.status_code}")
            print(f"   Resposta: {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Erro de conexão: {e}")
        return None


def exibir_resultado(resultado: Dict):
    """
    Exibe o resultado da API de forma formatada
    
    Args:
        resultado: Dicionário com resposta da API
    """
    print("\n" + "=" * 70)
    print("📊 RESULTADO DA API")
    print("=" * 70)
    
    if resultado.get("sucesso"):
        print(f"✅ Status: SUCESSO")
        print(f"📄 Arquivo: {resultado.get('nomeArquivo', 'N/A')}")
        print(f"🔗 Total de Links: {resultado.get('totalLinks', 0)}")
        print(f"📁 Categorias: {resultado.get('categorias', 0)}")
        print()
        print("🔗 URI Gerada:")
        print("-" * 70)
        uri = resultado.get('uri', '')
        # Exibe URI truncada se muito longa
        if len(uri) > 200:
            print(uri[:200] + "...")
            print(f"(URI completa tem {len(uri)} caracteres)")
        else:
            print(uri)
        print("-" * 70)
        return uri
    else:
        print(f"❌ Status: FALHA")
        print(f"Resposta completa: {json.dumps(resultado, indent=2, ensure_ascii=False)}")
        return None


def abrir_no_navegador(uri: str, auto_abrir: bool = False):
    """
    Abre a URI no navegador
    
    Args:
        uri: URI do Obsidian
        auto_abrir: Se True, abre automaticamente. Se False, pergunta ao usuário.
    """
    print("\n" + "=" * 70)
    print("🌐 ABRIR NO OBSIDIAN")
    print("=" * 70)
    
    if not auto_abrir:
        resposta = input("\n🤔 Deseja abrir a URI no navegador agora? (s/n): ").strip().lower()
        if resposta != 's':
            print("⏭️  Pulando abertura no navegador.")
            print(f"\n💡 Você pode copiar a URI acima e colar manualmente no navegador.")
            return
    
    print("🚀 Abrindo URI no navegador...")
    try:
        webbrowser.open(uri)
        print("✅ Navegador aberto! O Obsidian deve abrir automaticamente.")
        print("\n📋 CHECKLIST DE VALIDAÇÃO:")
        print("   [ ] Obsidian abriu automaticamente?")
        print("   [ ] Arquivo foi criado no local correto?")
        print("   [ ] Título está correto (H1)?")
        print("   [ ] Data de geração está presente?")
        print("   [ ] Estatísticas estão corretas?")
        print("   [ ] Links estão clicáveis?")
        print("   [ ] CRÍTICO: Quebras de linha funcionando (sem \\n literal)?")
    except Exception as e:
        print(f"❌ Erro ao abrir navegador: {e}")
        print(f"\n💡 Copie a URI acima e cole manualmente no navegador.")


def executar_teste(nome: str, dados: Dict, auto_abrir: bool = False):
    """
    Executa um teste completo
    
    Args:
        nome: Nome do teste
        dados: Dados para enviar à API
        auto_abrir: Se True, abre automaticamente no navegador
    """
    print("\n" + "=" * 70)
    print(f"🧪 EXECUTANDO: {nome}")
    print("=" * 70)
    
    resultado = chamar_api(dados)
    
    if resultado:
        uri = exibir_resultado(resultado)
        if uri:
            abrir_no_navegador(uri, auto_abrir)
    
    print("\n" + "=" * 70)
    print(f"✅ TESTE CONCLUÍDO: {nome}")
    print("=" * 70)


def menu_interativo():
    """Menu interativo para escolher qual teste executar"""
    while True:
        print("\n" + "=" * 70)
        print("📋 MENU DE TESTES")
        print("=" * 70)
        print("1. Teste Simples (1 link)")
        print("2. Teste Múltiplos Links (5 links)")
        print("3. Teste Categorias Múltiplas (10 links)")
        print("4. Executar TODOS os testes")
        print("5. Teste Personalizado (você define os dados)")
        print("0. Sair")
        print("=" * 70)
        
        escolha = input("\n🤔 Escolha uma opção (0-5): ").strip()
        
        if escolha == "0":
            print("\n👋 Encerrando script. Até logo!")
            break
        elif escolha == "1":
            executar_teste("Teste Simples", TESTE_SIMPLES)
        elif escolha == "2":
            executar_teste("Teste Múltiplos Links", TESTE_MULTIPLOS)
        elif escolha == "3":
            executar_teste("Teste Categorias Múltiplas", TESTE_CATEGORIAS)
        elif escolha == "4":
            print("\n🚀 Executando TODOS os testes...")
            executar_teste("Teste 1: Simples", TESTE_SIMPLES)
            input("\n⏸️  Pressione ENTER para continuar para o próximo teste...")
            executar_teste("Teste 2: Múltiplos Links", TESTE_MULTIPLOS)
            input("\n⏸️  Pressione ENTER para continuar para o próximo teste...")
            executar_teste("Teste 3: Categorias Múltiplas", TESTE_CATEGORIAS)
            print("\n🎉 TODOS OS TESTES CONCLUÍDOS!")
        elif escolha == "5":
            executar_teste_personalizado()
        else:
            print("❌ Opção inválida! Tente novamente.")


def executar_teste_personalizado():
    """Permite ao usuário criar um teste personalizado"""
    print("\n" + "=" * 70)
    print("✏️  TESTE PERSONALIZADO")
    print("=" * 70)
    
    titulo = input("\n📝 Título do catálogo: ").strip()
    if not titulo:
        titulo = "Teste Personalizado Comet"
    
    links = []
    print("\n🔗 Adicione links (deixe o nome vazio para finalizar):")
    
    while True:
        print(f"\n--- Link {len(links) + 1} ---")
        nome = input("Nome: ").strip()
        if not nome:
            break
        
        url = input("URL: ").strip()
        if not url:
            print("❌ URL é obrigatória!")
            continue
        
        categoria = input("Categoria (opcional): ").strip()
        
        link = {
            "nome": nome,
            "url": url
        }
        
        if categoria:
            link["categoria"] = categoria
        
        links.append(link)
        print(f"✅ Link adicionado! Total: {len(links)}")
    
    if not links:
        print("❌ Nenhum link adicionado. Cancelando teste.")
        return
    
    dados = {
        "titulo": titulo,
        "links": links
    }
    
    executar_teste("Teste Personalizado", dados)


# ========================================
# MAIN
# ========================================

def main():
    """Função principal"""
    exibir_banner()
    
    print("🎯 MODOS DE EXECUÇÃO:")
    print("1. Modo Interativo (Menu)")
    print("2. Modo Automático (Executa todos os testes)")
    print()
    
    modo = input("🤔 Escolha o modo (1 ou 2): ").strip()
    
    if modo == "2":
        print("\n🚀 Modo Automático Ativado!")
        print("⚠️  Os testes serão executados sequencialmente.")
        print("⚠️  As URIs NÃO serão abertas automaticamente.")
        input("\n⏸️  Pressione ENTER para começar...")
        
        executar_teste("Teste 1: Simples", TESTE_SIMPLES, auto_abrir=False)
        print("\n" + "⏸️ " * 35)
        input("Pressione ENTER para continuar...")
        
        executar_teste("Teste 2: Múltiplos Links", TESTE_MULTIPLOS, auto_abrir=False)
        print("\n" + "⏸️ " * 35)
        input("Pressione ENTER para continuar...")
        
        executar_teste("Teste 3: Categorias Múltiplas", TESTE_CATEGORIAS, auto_abrir=False)
        
        print("\n" + "🎉" * 35)
        print("✅ TODOS OS TESTES CONCLUÍDOS COM SUCESSO!")
        print("🎉" * 35)
    else:
        menu_interativo()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Script interrompido pelo usuário (Ctrl+C)")
        print("👋 Até logo!")
    except Exception as e:
        print(f"\n\n❌ ERRO INESPERADO: {e}")
        import traceback
        traceback.print_exc()
