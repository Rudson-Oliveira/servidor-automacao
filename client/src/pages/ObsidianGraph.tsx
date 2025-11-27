import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import ObsidianGraphView from "@/components/ObsidianGraphView";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import Header from "@/components/Header";

/**
 * 🕸️ PÁGINA OBSIDIAN GRAPH VIEW
 * 
 * Visualização de rede de todas as notas de um vault
 */
export default function ObsidianGraph() {
  const [, setLocation] = useLocation();
  const [selectedVaultId, setSelectedVaultId] = useState<number | null>(null);

  // Carregar vaults
  const { data: vaultsData, isLoading: loadingVaults } = trpc.obsidianAdvanced.listVaults.useQuery();

  // Carregar notas do vault selecionado
  const { data: notasData, isLoading: loadingNotas } = trpc.obsidianAdvanced.listNotas.useQuery(
    { vaultId: selectedVaultId! },
    { enabled: selectedVaultId !== null }
  );

  // Carregar backlinks
  const { data: backlinksData } = trpc.obsidianAdvanced.getBacklinks.useQuery(
    { notaId: 0 }, // TODO: Carregar backlinks de todas as notas
    { enabled: false }
  );

  // Preparar dados para o grafo
  const nodes = notasData?.notas.map((nota) => ({
    id: nota.id,
    titulo: nota.titulo,
    tags: nota.tags || [],
  })) || [];

  // TODO: Construir links reais a partir de backlinks
  const links: Array<{ source: number; target: number }> = [];

  const handleNodeClick = (nodeId: number) => {
    if (selectedVaultId) {
      setLocation(`/obsidian/vault/${selectedVaultId}?nota=${nodeId}`);
    }
  };

  if (loadingVaults) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/obsidian/vaults")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Graph View</h1>
              <p className="text-muted-foreground mt-1">
                Visualização de rede de notas Obsidian
              </p>
            </div>
          </div>
        </div>

        {/* Seletor de Vault */}
        {!selectedVaultId && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {vaultsData?.vaults.map((vault) => (
              <button
                key={vault.id}
                onClick={() => setSelectedVaultId(vault.id)}
                className="p-6 border rounded-lg hover:border-primary transition-colors text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  {vault.icone && <span className="text-2xl">{vault.icone}</span>}
                  <h3 className="font-semibold text-lg">{vault.nome}</h3>
                </div>
                {vault.descricao && (
                  <p className="text-sm text-muted-foreground">{vault.descricao}</p>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Graph View */}
        {selectedVaultId && (
          <>
            {loadingNotas ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : nodes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Nenhuma nota encontrada neste vault
                </p>
              </div>
            ) : (
              <ObsidianGraphView
                nodes={nodes}
                links={links}
                onNodeClick={handleNodeClick}
                height={700}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
