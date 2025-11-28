import { useState, useMemo, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, FolderOpen, Search, FileText, Tag, Calendar, Trash2, Edit, RefreshCw, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";


/**
 * 🔗 Página de Gerenciamento de Vaults Obsidian
 * 
 * Funcionalidades:
 * - Listar vaults do usuário
 * - Criar novo vault
 * - Visualizar estatísticas
 * - Navegar para notas do vault
 */

export default function ObsidianVaults() {
  const [, setLocation] = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [syncingVaultId, setSyncingVaultId] = useState<number | null>(null);

  // Form state
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [cor, setCor] = useState("#8b5cf6");
  const [icone, setIcone] = useState("📚");

  // Queries
  const { data: vaultsData, isLoading, refetch } = trpc.obsidianAdvanced.listVaults.useQuery();
  const utils = trpc.useUtils();

  // Mutations
  const createVaultMutation = trpc.obsidianAdvanced.createVault.useMutation({
    onSuccess: () => {
      toast.success("Vault criado com sucesso!");
      setIsCreateOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao criar vault: ${error.message}`);
    },
  });

  const syncVaultMutation = trpc.obsidianAdvanced.syncVault.useMutation({
    onSuccess: (data) => {
      toast.success(`Sincronização concluída! ${data.novos} novas, ${data.modificados} modificadas`);
      setSyncingVaultId(null);
      utils.obsidianAdvanced.listVaults.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao sincronizar: ${error.message}`);
      setSyncingVaultId(null);
    },
  });

  const startAutoSyncMutation = trpc.obsidianAdvanced.startAutoSync.useMutation({
    onSuccess: () => {
      toast.success("Auto-sync ativado!");
      utils.obsidianAdvanced.listVaults.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao ativar auto-sync: ${error.message}`);
    },
  });

  const stopAutoSyncMutation = trpc.obsidianAdvanced.stopAutoSync.useMutation({
    onSuccess: () => {
      toast.success("Auto-sync desativado!");
      utils.obsidianAdvanced.listVaults.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao desativar auto-sync: ${error.message}`);
    },
  });

  const resetForm = useCallback(() => {
    setNome("");
    setDescricao("");
    setCor("#8b5cf6");
    setIcone("📚");
  }, []);

  const handleCreateVault = useCallback(() => {
    if (!nome.trim()) {
      toast.error("Nome do vault é obrigatório");
      return;
    }

    createVaultMutation.mutate({
      nome: nome.trim(),
      descricao: descricao.trim() || undefined,
      cor,
      icone,
    });
  }, [nome, descricao, cor, icone, createVaultMutation]);

  const handleSyncVault = useCallback((e: React.MouseEvent, vaultId: number) => {
    e.stopPropagation();
    setSyncingVaultId(vaultId);
    syncVaultMutation.mutate({ vaultId });
  }, [syncVaultMutation]);

  const handleToggleAutoSync = useCallback((e: React.MouseEvent, vaultId: number, currentStatus: boolean) => {
    e.stopPropagation();
    if (currentStatus) {
      stopAutoSyncMutation.mutate({ vaultId });
    } else {
      startAutoSyncMutation.mutate({ vaultId });
    }
  }, [startAutoSyncMutation, stopAutoSyncMutation]);

  // Filtrar vaults
  const filteredVaults = useMemo(() => {
    if (!vaultsData?.vaults) return [];
    if (!searchQuery) return vaultsData.vaults;

    const query = searchQuery.toLowerCase();
    return vaultsData.vaults.filter(
      (vault) =>
        vault.nome.toLowerCase().includes(query) ||
        vault.descricao?.toLowerCase().includes(query)
    );
  }, [vaultsData, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Vaults Obsidian</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie seus vaults e notas do Obsidian
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Novo Vault
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar vaults..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Vaults Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando vaults...</p>
          </div>
        ) : filteredVaults.length === 0 ? (
          <Card className="p-12 text-center">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? "Nenhum vault encontrado" : "Nenhum vault criado"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? "Tente ajustar sua busca"
                : "Crie seu primeiro vault para começar"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Vault
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVaults.map((vault) => (
              <Card
                key={vault.id}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setLocation(`/obsidian/vault/${vault.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${vault.cor}20`, color: vault.cor || "#8b5cf6" }}
                  >
                    {vault.icone}
                  </div>
                  {!vault.ativo && (
                    <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                      Inativo
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-semibold mb-2">{vault.nome}</h3>
                {vault.descricao && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {vault.descricao}
                  </p>
                )}

                <div className="grid grid-cols-3 gap-4 pt-4 border-t mb-4">
                  <div className="text-center">
                    <FileText className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-sm font-semibold">{vault.totalNotas || 0}</p>
                    <p className="text-xs text-muted-foreground">Notas</p>
                  </div>
                  <div className="text-center">
                    <Tag className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-sm font-semibold">{vault.totalTags || 0}</p>
                    <p className="text-xs text-muted-foreground">Tags</p>
                  </div>
                  <div className="text-center">
                    <Calendar className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-sm font-semibold">
                      {vault.ultimoSync
                        ? new Date(vault.ultimoSync).toLocaleDateString("pt-BR")
                        : "Nunca"}
                    </p>
                    <p className="text-xs text-muted-foreground">Sync</p>
                  </div>
                </div>

                {/* Sync Controls */}
                <div className="flex gap-2 pt-4 border-t" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => handleSyncVault(e, vault.id)}
                    disabled={syncingVaultId === vault.id}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${syncingVaultId === vault.id ? 'animate-spin' : ''}`} />
                    {syncingVaultId === vault.id ? "Sincronizando..." : "Sincronizar"}
                  </Button>
                  <Button
                    variant={vault.autoSyncAtivo ? "default" : "outline"}
                    size="sm"
                    onClick={(e) => handleToggleAutoSync(e, vault.id, vault.autoSyncAtivo)}
                    title={vault.autoSyncAtivo ? "Desativar auto-sync" : "Ativar auto-sync"}
                  >
                    {vault.autoSyncAtivo ? (
                      <Power className="w-4 h-4" />
                    ) : (
                      <PowerOff className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create Vault Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Vault</DialogTitle>
              <DialogDescription>
                Crie um novo vault para organizar suas notas do Obsidian
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  placeholder="Meu Vault"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descrição do vault..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="icone">Ícone</Label>
                  <Input
                    id="icone"
                    placeholder="📚"
                    value={icone}
                    onChange={(e) => setIcone(e.target.value)}
                    maxLength={2}
                  />
                </div>

                <div>
                  <Label htmlFor="cor">Cor</Label>
                  <Input
                    id="cor"
                    type="color"
                    value={cor}
                    onChange={(e) => setCor(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateVault}
                disabled={createVaultMutation.isPending || !nome.trim()}
              >
                {createVaultMutation.isPending ? "Criando..." : "Criar Vault"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
