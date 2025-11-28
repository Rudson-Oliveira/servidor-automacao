import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2, RefreshCw, Trash2, Target } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function CacheStats() {
  const [pattern, setPattern] = useState("");
  
  const { data: stats, isLoading, refetch } = trpc.cache.stats.useQuery(undefined, {
    refetchInterval: 5000, // Atualizar a cada 5 segundos
  });
  
  const clearMutation = trpc.cache.clear.useMutation({
    onSuccess: () => {
      toast.success("Cache limpo com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao limpar cache: ${error.message}`);
    },
  });
  
  const invalidateMutation = trpc.cache.invalidate.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.invalidated} entradas invalidadas!`);
      refetch();
      setPattern("");
    },
    onError: (error) => {
      toast.error(`Erro ao invalidar: ${error.message}`);
    },
  });
  
  const resetStatsMutation = trpc.cache.resetStats.useMutation({
    onSuccess: () => {
      toast.success("Estatísticas resetadas!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao resetar: ${error.message}`);
    },
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cache Inteligente</h1>
        <p className="text-muted-foreground mt-2">
          Monitore e gerencie o cache em memória do sistema
        </p>
      </div>
      
      {/* Estatísticas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Acerto</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.hitRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats?.hits} hits / {stats?.misses} misses
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.size}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.sets} inserções
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hits</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.hits}</div>
            <p className="text-xs text-muted-foreground">
              Queries servidas do cache
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Misses</CardTitle>
            <Target className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.misses}</div>
            <p className="text-xs text-muted-foreground">
              Queries que foram ao banco
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Ações de Gerenciamento */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Invalidar por Padrão</CardTitle>
            <CardDescription>
              Remover entradas do cache que correspondem a um padrão regex
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pattern">Padrão Regex</Label>
              <Input
                id="pattern"
                placeholder="Ex: obsidian:.*"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Exemplos: <code>obsidian:.*</code>, <code>user:123:.*</code>
              </p>
            </div>
            <Button
              onClick={() => invalidateMutation.mutate({ pattern })}
              disabled={!pattern || invalidateMutation.isPending}
              className="w-full"
            >
              {invalidateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Invalidar
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Ações Globais</CardTitle>
            <CardDescription>
              Gerenciar cache e estatísticas globalmente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar Estatísticas
            </Button>
            
            <Button
              onClick={() => resetStatsMutation.mutate()}
              variant="outline"
              className="w-full"
              disabled={resetStatsMutation.isPending}
            >
              {resetStatsMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Resetar Estatísticas
            </Button>
            
            <Button
              onClick={() => clearMutation.mutate()}
              variant="destructive"
              className="w-full"
              disabled={clearMutation.isPending}
            >
              {clearMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Limpar Todo o Cache
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Sobre o Cache Inteligente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>TTL Padrão:</strong> 5 minutos
          </p>
          <p>
            <strong>Tamanho Máximo:</strong> 1000 entradas
          </p>
          <p>
            <strong>Estratégia de Evicção:</strong> LRU (Least Recently Used)
          </p>
          <p>
            <strong>Limpeza Automática:</strong> A cada 1 minuto
          </p>
          <p className="pt-2">
            O cache é automaticamente invalidado quando dados são modificados através
            de mutations. A taxa de acerto ideal é acima de 70%.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
