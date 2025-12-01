# ⚡ INÍCIO RÁPIDO - DESKTOP AGENT v2.1.0

**Para CEO Rudson - Windows 11**

---

## 🎯 INSTALAÇÃO EM 3 PASSOS

### **1. BAIXAR E EXTRAIR**

✅ Baixe: `DesktopAgent-v2.1.0-Windows.zip`  
✅ Extraia para: `C:\Users\rudpa\DesktopAgent\`

---

### **2. OBTER TOKEN**

✅ Acesse: https://automacao-api-alejofy2.manus.space/desktop/agents  
✅ Copie seu token (64 caracteres)

**Token atual do PC-Rudson:**
```
16dfd7560653928eb44366efcfcd66ab623b87849773d127349d2950f8f67a1f
```

---

### **3. EXECUTAR INSTALADOR**

```powershell
# Abrir PowerShell no diretório
cd C:\Users\rudpa\DesktopAgent

# Executar instalador automático
python instalar.py
```

**O instalador vai:**
- ✅ Verificar Python e dependências
- ✅ Instalar o que estiver faltando
- ✅ Criar config.json correto (SEM BOM)
- ✅ **TESTAR CONEXÃO REAL**
- ✅ Confirmar que está funcionando

---

## ✅ PRONTO!

Se tudo funcionar, você verá:

```
======================================================================
  ✓ INSTALAÇÃO CONCLUÍDA COM SUCESSO!
======================================================================

Desktop Agent está pronto para uso!
Execute: python agent.py
```

---

## 🔧 SE DER ERRO

### **Opção A: Teste Diagnóstico**

```powershell
python testar_instalacao.py
```

Vai mostrar exatamente o que está errado.

---

### **Opção B: Criar config.json Manualmente**

```powershell
# Usar gerador Python
python gerar_config.py

# OU usar gerador PowerShell
.\gerar_config.ps1
```

---

### **Opção C: Suporte Completo**

Leia: `INSTALACAO.md` (guia completo com todas as soluções)

---

## 📞 CONTATO

**Dashboard:** https://automacao-api-alejofy2.manus.space/desktop/agents

---

## 🚀 EXECUTAR AGENT

Após instalação:

```powershell
python agent.py
```

**Deve mostrar:**
```
============================================================
Desktop Agent Iniciado
Dispositivo: PC-Rudson
Plataforma: Windows 11
Versão: 2.1.0
============================================================
[INFO] Conectando ao servidor...
[INFO] Conectado ao servidor
[INFO] Autenticado com sucesso!
[INFO] Agent online e pronto para receber comandos
```

---

## 🎯 RESUMO

1. ✅ Extrair ZIP
2. ✅ Obter token
3. ✅ `python instalar.py`
4. ✅ `python agent.py`

**FEITO! 🚀**
