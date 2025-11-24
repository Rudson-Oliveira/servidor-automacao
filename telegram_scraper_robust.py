#!/usr/bin/env python3
"""
Script de Raspagem Telegram → Obsidian (VERSÃO ROBUSTA)
Usa entidades nativas do Telethon para extração precisa de links

Desenvolvido para Comet executar localmente
Autor: Manus + Comet
Data: 24/11/2025
"""

from telethon import TelegramClient
from telethon.tl.types import (
    MessageEntityUrl, 
    MessageEntityTextUrl,
    MessageEntityEmail,
    MessageEntityMention,
    MessageEntityHashtag
)
import requests
import json
import re
from datetime import datetime
from typing import List, Dict, Optional, Tuple
import asyncio

# ========================================
# CONFIGURAÇÃO
# ========================================

# Credenciais Telegram API (obter em https://my.telegram.org)
API_ID = 'SEU_API_ID'  # Comet deve obter
API_HASH = 'SEU_API_HASH'  # Comet deve obter
PHONE = '+5535998352323'  # Seu telefone

# API de Catalogação
API_URL = "https://3000-irvlht34m10g6oxfkoitw-1b347671.manusvm.computer/api/obsidian/catalogar-links"

# Configurações de Raspagem
MAX_MESSAGES = 1000  # Máximo de mensagens por grupo
GRUPOS_ALVO = [
    # Comet deve preencher com nomes/IDs dos grupos
    "Automações Python",
    "IA e Machine Learning",
    "Desenvolvimento Web"
]

# Configurações de Filtro
INCLUIR_EMAILS = False  # Se True, inclui emails como links
INCLUIR_MENTIONS = False  # Se True, inclui @mentions
INCLUIR_HASHTAGS = False  # Se True, inclui #hashtags
FILTRAR_DOMINIOS = []  # Lista de domínios para filtrar (ex: ['spam.com'])

# ========================================
# FUNÇÕES DE EXTRAÇÃO ROBUSTA
# ========================================

def extrair_links_entidades(message) -> List[Dict[str, str]]:
    """
    Extrai URLs usando entidades nativas do Telethon (MÉTODO ROBUSTO)
    
    Retorna lista de dicionários com:
    - url: URL completa
    - texto: Texto do link (se houver)
    - tipo: Tipo da entidade (url, text_url, email, etc.)
    - offset: Posição no texto
    """
    links = []
    
    if not message.entities:
        return links
    
    for entity in message.entities:
        link_info = None
        
        # MessageEntityUrl: URLs diretas (http://example.com)
        if isinstance(entity, MessageEntityUrl):
            url_texto = message.text[entity.offset:entity.offset + entity.length]
            link_info = {
                'url': url_texto,
                'texto': url_texto,
                'tipo': 'url_direta',
                'offset': entity.offset
            }
        
        # MessageEntityTextUrl: Links com texto customizado [texto](url)
        elif isinstance(entity, MessageEntityTextUrl):
            texto_link = message.text[entity.offset:entity.offset + entity.length]
            link_info = {
                'url': entity.url,
                'texto': texto_link,
                'tipo': 'url_texto',
                'offset': entity.offset
            }
        
        # MessageEntityEmail: Emails (opcional)
        elif isinstance(entity, MessageEntityEmail) and INCLUIR_EMAILS:
            email = message.text[entity.offset:entity.offset + entity.length]
            link_info = {
                'url': f"mailto:{email}",
                'texto': email,
                'tipo': 'email',
                'offset': entity.offset
            }
        
        # MessageEntityMention: @username (opcional)
        elif isinstance(entity, MessageEntityMention) and INCLUIR_MENTIONS:
            mention = message.text[entity.offset:entity.offset + entity.length]
            link_info = {
                'url': f"https://t.me/{mention[1:]}",  # Remove @
                'texto': mention,
                'tipo': 'mention',
                'offset': entity.offset
            }
        
        # MessageEntityHashtag: #tag (opcional)
        elif isinstance(entity, MessageEntityHashtag) and INCLUIR_HASHTAGS:
            hashtag = message.text[entity.offset:entity.offset + entity.length]
            link_info = {
                'url': f"https://t.me/hashtag/{hashtag[1:]}",  # Remove #
                'texto': hashtag,
                'tipo': 'hashtag',
                'offset': entity.offset
            }
        
        if link_info:
            links.append(link_info)
    
    return links


def extrair_links_regex_fallback(texto: str) -> List[Dict[str, str]]:
    """
    Fallback usando regex para mensagens sem entidades
    (Menos confiável, mas captura links que o Telegram não marcou)
    """
    if not texto:
        return []
    
    # Regex para URLs
    url_pattern = r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
    urls = re.findall(url_pattern, texto)
    
    return [
        {
            'url': url,
            'texto': url,
            'tipo': 'regex_fallback',
            'offset': texto.index(url)
        }
        for url in urls
    ]


def extrair_contexto_link(message, offset: int, tamanho_contexto: int = 100) -> str:
    """
    Extrai contexto ao redor do link para melhor categorização
    
    Args:
        message: Mensagem do Telegram
        offset: Posição do link no texto
        tamanho_contexto: Caracteres antes/depois do link
    
    Returns:
        String com contexto ao redor do link
    """
    if not message.text:
        return ""
    
    inicio = max(0, offset - tamanho_contexto)
    fim = min(len(message.text), offset + tamanho_contexto)
    
    return message.text[inicio:fim]


def extrair_nome_link_inteligente(link_info: Dict, message) -> str:
    """
    Extrai nome do link de forma inteligente
    
    Prioridade:
    1. Texto customizado do link [texto](url)
    2. Linha anterior ao link
    3. Título da página (se disponível)
    4. Domínio da URL
    """
    # 1. Se tem texto customizado, usar
    if link_info['tipo'] == 'url_texto' and link_info['texto'] != link_info['url']:
        return link_info['texto']
    
    # 2. Tentar extrair da linha anterior
    if message.text:
        linhas = message.text.split('\n')
        for i, linha in enumerate(linhas):
            if link_info['url'] in linha and i > 0:
                linha_anterior = linhas[i-1].strip()
                if linha_anterior and len(linha_anterior) < 200:
                    return linha_anterior
    
    # 3. Usar domínio como fallback
    try:
        dominio = link_info['url'].split('//')[1].split('/')[0]
        # Remover www. se houver
        if dominio.startswith('www.'):
            dominio = dominio[4:]
        return dominio
    except:
        return link_info['url'][:50]


def filtrar_link_valido(link_info: Dict) -> bool:
    """
    Valida se o link deve ser incluído
    
    Filtros:
    - Domínios bloqueados
    - URLs muito curtas (possível spam)
    - URLs inválidas
    """
    url = link_info['url']
    
    # Filtrar domínios bloqueados
    for dominio_bloqueado in FILTRAR_DOMINIOS:
        if dominio_bloqueado in url.lower():
            return False
    
    # Filtrar URLs muito curtas (menos de 10 chars)
    if len(url) < 10:
        return False
    
    # Validar formato básico
    if not url.startswith(('http://', 'https://', 'mailto:')):
        return False
    
    return True


def categorizar_link_avancado(link_info: Dict, contexto: str, grupo_nome: str) -> str:
    """
    Categoriza link de forma avançada usando múltiplas heurísticas
    
    Args:
        link_info: Informações do link
        contexto: Contexto ao redor do link
        grupo_nome: Nome do grupo de origem
    
    Returns:
        String com categoria
    """
    url = link_info['url'].lower()
    contexto_lower = contexto.lower()
    
    # Categorias por domínio (mais específicas)
    categorias_dominio = {
        'github.com': 'GitHub - Repositórios',
        'gitlab.com': 'GitLab - Repositórios',
        'bitbucket.org': 'Bitbucket - Repositórios',
        'youtube.com': 'YouTube - Vídeos',
        'youtu.be': 'YouTube - Vídeos',
        'vimeo.com': 'Vimeo - Vídeos',
        'medium.com': 'Medium - Artigos',
        'dev.to': 'Dev.to - Artigos',
        'stackoverflow.com': 'Stack Overflow',
        'reddit.com': 'Reddit - Discussões',
        'twitter.com': 'Twitter - Posts',
        'x.com': 'Twitter - Posts',
        'linkedin.com': 'LinkedIn',
        'notion.so': 'Notion - Documentos',
        'docs.google.com': 'Google Docs',
        'drive.google.com': 'Google Drive',
        'dropbox.com': 'Dropbox',
        'figma.com': 'Figma - Design',
        'canva.com': 'Canva - Design',
        'trello.com': 'Trello - Gestão',
        'asana.com': 'Asana - Gestão',
        'slack.com': 'Slack',
        'discord.com': 'Discord',
        'telegram.org': 'Telegram',
        'whatsapp.com': 'WhatsApp',
    }
    
    for dominio, categoria in categorias_dominio.items():
        if dominio in url:
            return f"{grupo_nome} - {categoria}"
    
    # Categorias por padrões na URL
    if '/docs' in url or 'documentation' in url:
        return f"{grupo_nome} - Documentação"
    elif '/api' in url or 'api.' in url:
        return f"{grupo_nome} - APIs"
    elif '/tutorial' in url or '/guide' in url:
        return f"{grupo_nome} - Tutoriais"
    elif '/blog' in url:
        return f"{grupo_nome} - Blogs"
    elif '/course' in url or '/learn' in url:
        return f"{grupo_nome} - Cursos"
    
    # Categorias por palavras-chave no contexto
    palavras_chave_categorias = {
        'Automação': ['automação', 'automation', 'bot', 'script', 'workflow'],
        'IA': ['ia', 'ai', 'machine learning', 'ml', 'deep learning', 'neural', 'gpt', 'llm'],
        'Programação': ['python', 'javascript', 'java', 'código', 'code', 'programming'],
        'Web Development': ['web', 'frontend', 'backend', 'react', 'vue', 'angular', 'node'],
        'DevOps': ['devops', 'docker', 'kubernetes', 'ci/cd', 'deploy', 'cloud'],
        'Data Science': ['data', 'dados', 'analytics', 'visualization', 'pandas', 'numpy'],
        'Mobile': ['mobile', 'android', 'ios', 'flutter', 'react native'],
        'Design': ['design', 'ui', 'ux', 'interface', 'figma', 'sketch'],
        'Segurança': ['security', 'segurança', 'hack', 'pentest', 'vulnerability'],
        'Blockchain': ['blockchain', 'crypto', 'bitcoin', 'ethereum', 'web3'],
    }
    
    for categoria, palavras in palavras_chave_categorias.items():
        if any(palavra in contexto_lower for palavra in palavras):
            return f"{grupo_nome} - {categoria}"
    
    # Fallback: usar nome do grupo
    return f"{grupo_nome} - Geral"


# ========================================
# FUNÇÃO PRINCIPAL DE RASPAGEM
# ========================================

async def raspar_grupo_robusto(client: TelegramClient, grupo_nome: str) -> List[Dict]:
    """
    Raspa mensagens de um grupo usando extração robusta de links
    
    Returns:
        Lista de dicionários com links processados
    """
    print(f"\n📥 Raspando grupo: {grupo_nome}")
    print(f"   Método: Entidades nativas do Telethon (ROBUSTO)")
    
    links_processados = []
    urls_vistas = set()  # Para evitar duplicatas
    
    try:
        # Buscar entidade do grupo
        entity = await client.get_entity(grupo_nome)
        
        # Iterar mensagens
        contador = 0
        links_encontrados = 0
        
        async for message in client.iter_messages(entity, limit=MAX_MESSAGES):
            contador += 1
            
            if not message.text:
                continue
            
            # Extrair links usando entidades (MÉTODO PRINCIPAL)
            links_entidades = extrair_links_entidades(message)
            
            # Fallback: regex se não houver entidades
            if not links_entidades:
                links_entidades = extrair_links_regex_fallback(message.text)
            
            # Processar cada link encontrado
            for link_info in links_entidades:
                # Filtrar links inválidos
                if not filtrar_link_valido(link_info):
                    continue
                
                # Evitar duplicatas
                if link_info['url'] in urls_vistas:
                    continue
                urls_vistas.add(link_info['url'])
                
                # Extrair contexto
                contexto = extrair_contexto_link(message, link_info['offset'])
                
                # Extrair nome inteligente
                nome = extrair_nome_link_inteligente(link_info, message)
                
                # Categorizar
                categoria = categorizar_link_avancado(link_info, contexto, grupo_nome)
                
                # Adicionar à lista
                links_processados.append({
                    'nome': nome[:200],  # Limitar tamanho
                    'url': link_info['url'],
                    'categoria': categoria,
                    'tipo_extracao': link_info['tipo'],
                    'data': message.date.strftime('%Y-%m-%d %H:%M:%S'),
                    'grupo': grupo_nome,
                    'contexto': contexto[:200],  # Para debug
                    'message_id': message.id
                })
                
                links_encontrados += 1
            
            # Feedback de progresso
            if contador % 100 == 0:
                print(f"   Processadas {contador} mensagens | Links: {links_encontrados}")
        
        print(f"✅ Grupo '{grupo_nome}':")
        print(f"   Mensagens processadas: {contador}")
        print(f"   Links únicos encontrados: {len(links_processados)}")
        
        # Estatísticas por tipo de extração
        tipos = {}
        for link in links_processados:
            tipo = link['tipo_extracao']
            tipos[tipo] = tipos.get(tipo, 0) + 1
        
        print(f"   Métodos de extração:")
        for tipo, qtd in tipos.items():
            print(f"      {tipo}: {qtd}")
        
    except Exception as e:
        print(f"❌ Erro ao raspar grupo '{grupo_nome}': {e}")
        import traceback
        traceback.print_exc()
    
    return links_processados


def catalogar_no_obsidian(links: List[Dict], titulo: str) -> Optional[Dict]:
    """Envia links para API de catalogação"""
    print(f"\n📤 Catalogando {len(links)} links no Obsidian...")
    
    # Preparar payload
    payload = {
        "titulo": titulo,
        "links": [
            {
                "nome": link['nome'],
                "url": link['url'],
                "categoria": link['categoria']
            }
            for link in links
        ]
    }
    
    try:
        response = requests.post(API_URL, json=payload, timeout=60)
        
        if response.status_code == 200:
            resultado = response.json()
            print(f"✅ Catalogação concluída!")
            print(f"   Total de links: {resultado.get('totalLinks', 0)}")
            print(f"   Categorias: {resultado.get('categorias', 0)}")
            print(f"   Arquivo: {resultado.get('nomeArquivo', 'N/A')}")
            return resultado
        else:
            print(f"❌ Erro na catalogação: {response.status_code}")
            print(f"   Resposta: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Erro ao chamar API: {e}")
        return None


def salvar_backup_local(links: List[Dict], nome_arquivo: str):
    """Salva backup local dos links raspados com metadados"""
    backup_data = {
        'timestamp': datetime.now().isoformat(),
        'total_links': len(links),
        'grupos': list(set(link['grupo'] for link in links)),
        'links': links
    }
    
    with open(nome_arquivo, 'w', encoding='utf-8') as f:
        json.dump(backup_data, f, ensure_ascii=False, indent=2)
    
    print(f"💾 Backup completo salvo em: {nome_arquivo}")


def gerar_relatorio(links: List[Dict]) -> str:
    """Gera relatório estatístico da raspagem"""
    if not links:
        return "Nenhum link encontrado."
    
    # Estatísticas gerais
    total = len(links)
    grupos = set(link['grupo'] for link in links)
    categorias = set(link['categoria'] for link in links)
    
    # Links por grupo
    por_grupo = {}
    for link in links:
        grupo = link['grupo']
        por_grupo[grupo] = por_grupo.get(grupo, 0) + 1
    
    # Links por categoria
    por_categoria = {}
    for link in links:
        cat = link['categoria']
        por_categoria[cat] = por_categoria.get(cat, 0) + 1
    
    # Métodos de extração
    por_metodo = {}
    for link in links:
        metodo = link['tipo_extracao']
        por_metodo[metodo] = por_metodo.get(metodo, 0) + 1
    
    # Montar relatório
    relatorio = []
    relatorio.append("\n" + "=" * 70)
    relatorio.append("📊 RELATÓRIO ESTATÍSTICO DA RASPAGEM")
    relatorio.append("=" * 70)
    relatorio.append(f"Total de links únicos: {total}")
    relatorio.append(f"Grupos processados: {len(grupos)}")
    relatorio.append(f"Categorias identificadas: {len(categorias)}")
    relatorio.append("")
    
    relatorio.append("📁 Links por Grupo:")
    for grupo, qtd in sorted(por_grupo.items(), key=lambda x: x[1], reverse=True):
        relatorio.append(f"   {grupo}: {qtd}")
    relatorio.append("")
    
    relatorio.append("🏷️  Top 10 Categorias:")
    top_categorias = sorted(por_categoria.items(), key=lambda x: x[1], reverse=True)[:10]
    for cat, qtd in top_categorias:
        relatorio.append(f"   {cat}: {qtd}")
    relatorio.append("")
    
    relatorio.append("🔍 Métodos de Extração:")
    for metodo, qtd in sorted(por_metodo.items(), key=lambda x: x[1], reverse=True):
        percentual = (qtd / total) * 100
        relatorio.append(f"   {metodo}: {qtd} ({percentual:.1f}%)")
    relatorio.append("=" * 70)
    
    return "\n".join(relatorio)


# ========================================
# FUNÇÃO PRINCIPAL
# ========================================

async def main():
    """Função principal de raspagem robusta"""
    print("=" * 70)
    print("🤖 RASPAGEM TELEGRAM → OBSIDIAN (VERSÃO ROBUSTA)")
    print("=" * 70)
    print(f"📅 Data/Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print(f"📱 Telefone: {PHONE}")
    print(f"📊 Grupos alvo: {len(GRUPOS_ALVO)}")
    print(f"🔍 Método: Entidades nativas do Telethon")
    print("=" * 70)
    
    # Criar cliente Telegram
    client = TelegramClient('session_comet_robust', API_ID, API_HASH)
    
    try:
        # Conectar
        await client.start(phone=PHONE)
        print("\n✅ Conectado ao Telegram!")
        
        # Raspar todos os grupos
        todos_links = []
        
        for grupo in GRUPOS_ALVO:
            links_grupo = await raspar_grupo_robusto(client, grupo)
            todos_links.extend(links_grupo)
        
        # Gerar relatório
        print(gerar_relatorio(todos_links))
        
        if len(todos_links) == 0:
            print("\n⚠️  Nenhum link encontrado!")
            return
        
        # Salvar backup local
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = f"telegram_links_backup_{timestamp}.json"
        salvar_backup_local(todos_links, backup_file)
        
        # Catalogar no Obsidian
        titulo = f"Links Telegram - {datetime.now().strftime('%d/%m/%Y')}"
        resultado = catalogar_no_obsidian(todos_links, titulo)
        
        if resultado and resultado.get('sucesso'):
            print("\n" + "=" * 70)
            print("🎉 SUCESSO TOTAL!")
            print("=" * 70)
            print(f"📄 Arquivo: {resultado.get('nomeArquivo', 'N/A')}")
            print(f"🔗 Total de links: {resultado.get('totalLinks', 0)}")
            print(f"📁 Categorias: {resultado.get('categorias', 0)}")
            print("")
            print("🔗 URI Gerada:")
            print(resultado['uri'][:150] + "...")
            print("")
            print("💡 Próximos passos:")
            print("1. Copiar URI acima")
            print("2. Colar no navegador")
            print("3. Obsidian abrirá automaticamente")
            print("4. Verificar arquivo criado")
            print("=" * 70)
        
    except Exception as e:
        print(f"\n❌ ERRO GERAL: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        await client.disconnect()
        print("\n👋 Desconectado do Telegram")


# ========================================
# EXECUÇÃO
# ========================================

if __name__ == "__main__":
    print("\n🚀 Iniciando raspagem robusta...")
    print("⚡ Usando entidades nativas do Telethon para máxima precisão\n")
    asyncio.run(main())
