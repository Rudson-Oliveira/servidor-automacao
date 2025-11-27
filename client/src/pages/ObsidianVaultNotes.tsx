import { useState, useMemo, useCallback, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Search,
  FileText,
  Tag,
  Calendar,
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  Save,
  X,
  Link as LinkIcon,
  History,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * 🔗 Página de Notas do Vault Obsidian
 * 
 * Funcionalidades:
 * - Lista de notas com busca
 * - Editor inline
 * - Visualização de backlinks
 * - Navegação por tags
 * - Preview de notas
 */

export default function ObsidianVaultNotes() {
  const [, params] = useRoute("/obsidian/vault/:id");
  const [, setLocation] = useLocation();
  const vaultId = params?.id ? parseInt(params.id) : null;

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editingNota, setEditingNota] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [previewNota, setPreviewNota] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form state
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCaminho, setNewCaminho] = useState("");
  const [newTags, setNewTags] = useState("");

  // Queries
  const { data: vaultData } = trpc.obsidianAdvanced.getVault.useQuery(
    { vaultId: vaultId! },
    { enabled: !!vaultId }
  );

  const { data: notasData, refetch: refetchNotas } = trpc.obsidianAdvanced.listNotas.useQuery(
    { vaultId: vaultId! },
    { enabled: !!vaultId }
  );

  const { data: tagsData } = trpc.obsidianAdvanced.listTags.useQuery(
    { vaultId: vaultId! },
    { enabled: !!vaultId }
  );

  const { data: previewData } = trpc.obsidianAdvanced.getNota.useQuery(
    { notaId: previewNota! },
    { enabled: !!previewNota }
  );

  // Mutations
  const createNotaMutation = trpc.obsidianAdvanced.createNota.useMutation({
    onSuccess: () => {
      toast.success("Nota criada com sucesso!");
      setIsCreateOpen(false);
      resetCreateForm();
      refetchNotas();
    },
    onError: (error) => {
      toast.error(`Erro ao criar nota: ${error.message}`);
    },
  });

  const updateNotaMutation = trpc.obsidianAdvanced.updateNota.useMutation({
    onSuccess: () => {
      toast.success("Nota atualizada!");
      setEditingNota(null);
      refetchNotas();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const uploadZipMutation = trpc.obsidianAdvanced.uploadVaultZip.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.importadas} notas importadas! ${data.erros > 0 ? `(${data.erros} erros)` : ""}`);
      setIsUploading(false);
      refetchNotas();
    },
    onError: (error) => {
      toast.error(`Erro ao importar: ${error.message}`);
      setIsUploading(false);
    },
  });

  const deleteNotaMutation = trpc.obsidianAdvanced.deleteNota.useMutation({
    onSuccess: () => {
      toast.success("Nota deletada!");
      refetchNotas();
    },
    onError: (error) => {
      toast.error(`Erro ao deletar: ${error.message}`);
    },
  });

  const resetCreateForm = useCallback(() => {
    setNewTitle("");
    setNewContent("");
    setNewCaminho("");
    setNewTags("");
  }, []);

  const handleCreateNota = useCallback(() => {
    if (!vaultId || !newTitle.trim() || !newCaminho.trim()) {
      toast.error("Título e caminho são obrigatórios");
      return;
    }

    const tags = newTags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    createNotaMutation.mutate({
      vaultId,
      titulo: newTitle.trim(),
      caminho: newCaminho.trim(),
      conteudo: newContent,
      tags: tags.length > 0 ? tags : undefined,
    });
  }, [vaultId, newTitle, newCaminho, newContent, newTags, createNotaMutation]);

  const handleStartEdit = useCallback((nota: any) => {
    setEditingNota(nota.id);
    setEditTitle(nota.titulo);
    setEditContent(nota.conteudo);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingNota) return;

    updateNotaMutation.mutate({
      notaId: editingNota,
      titulo: editTitle,
      conteudo: editContent,
    });
  }, [editingNota, editTitle, editContent, updateNotaMutation]);

  const handleCancelEdit = useCallback(() => {
    setEditingNota(null);
    setEditTitle("");
    setEditContent("");
  }, []);

  const handleDeleteNota = useCallback((notaId: number) => {
    if (confirm("Tem certeza que deseja deletar esta nota?")) {
      deleteNotaMutation.mutate({ notaId });
    }
  }, [deleteNotaMutation]);

  const handleUploadZip = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !vaultId) return;

    if (!file.name.endsWith(".zip")) {
      toast.error("Por favor, selecione um arquivo .zip");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result?.toString().split(",")[1];
      if (base64) {
        uploadZipMutation.mutate({ vaultId, zipBase64: base64 });
      }
    };
    reader.onerror = () => {
      toast.error("Erro ao ler arquivo");
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  }, [vaultId, uploadZipMutation]);

  // Filtrar notas
  const filteredNotas = useMemo(() => {
    if (!notasData?.notas) return [];

    let filtered = notasData.notas;

    // Filtro de busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (nota) =>
          nota.titulo.toLowerCase().includes(query) ||
          nota.conteudo.toLowerCase().includes(query)
      );
    }

    // Filtro de tag
    if (selectedTag) {
      filtered = filtered.filter((nota) => nota.tags?.includes(selectedTag));
    }

    return filtered;
  }, [notasData, searchQuery, selectedTag]);

  if (!vaultId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Vault inválido</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/obsidian/vaults")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold">{vaultData?.nome || "Carregando..."}</h1>
            {vaultData?.descricao && (
              <p className="text-muted-foreground mt-2">{vaultData.descricao}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="lg" disabled={isUploading} asChild>
              <label className="cursor-pointer">
                <Upload className="w-5 h-5 mr-2" />
                {isUploading ? "Importando..." : "Upload .zip"}
                <input
                  type="file"
                  accept=".zip"
                  className="hidden"
                  onChange={handleUploadZip}
                  disabled={isUploading}
                />
              </label>
            </Button>
            <Button onClick={() => setIsCreateOpen(true)} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Nova Nota
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Tags */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags
              </h3>
              <div className="space-y-2">
                <Button
                  variant={selectedTag === null ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedTag(null)}
                >
                  Todas ({notasData?.count || 0})
                </Button>
                {tagsData?.tags.map((tag) => (
                  <Button
                    key={tag.id}
                    variant={selectedTag === tag.tag ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedTag(tag.tag)}
                  >
                    #{tag.tag} ({tag.usoCount})
                  </Button>
                ))}
              </div>
            </Card>
          </div>

          {/* Main - Notas */}
          <div className="lg:col-span-3">
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar notas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Notas List */}
            {filteredNotas.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">
                  {searchQuery || selectedTag ? "Nenhuma nota encontrada" : "Nenhuma nota criada"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || selectedTag
                    ? "Tente ajustar sua busca ou filtro"
                    : "Crie sua primeira nota para começar"}
                </p>
                {!searchQuery && !selectedTag && (
                  <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Nota
                  </Button>
                )}
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredNotas.map((nota) => (
                  <Card key={nota.id} className="p-6">
                    {editingNota === nota.id ? (
                      // Editor Inline
                      <div className="space-y-4">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Título da nota"
                          className="text-xl font-semibold"
                        />
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          placeholder="Conteúdo da nota (Markdown)"
                          rows={10}
                          className="font-mono"
                        />
                        <div className="flex gap-2">
                          <Button onClick={handleSaveEdit} disabled={updateNotaMutation.isPending}>
                            <Save className="w-4 h-4 mr-2" />
                            {updateNotaMutation.isPending ? "Salvando..." : "Salvar"}
                          </Button>
                          <Button variant="outline" onClick={handleCancelEdit}>
                            <X className="w-4 h-4 mr-2" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold mb-2">{nota.titulo}</h3>
                            <p className="text-sm text-muted-foreground">{nota.caminho}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setPreviewNota(nota.id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleStartEdit(nota)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteNota(nota.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                          {nota.conteudo.substring(0, 200)}...
                        </p>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(nota.ultimaModificacao).toLocaleDateString("pt-BR")}
                          </div>
                          {nota.tags && nota.tags.length > 0 && (
                            <div className="flex gap-2">
                              {nota.tags.map((tag) => (
                                <Badge key={tag} variant="secondary">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create Nota Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Nota</DialogTitle>
              <DialogDescription>
                Adicione uma nova nota ao vault
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  placeholder="Minha Nota"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="caminho">Caminho *</Label>
                <Input
                  id="caminho"
                  placeholder="pasta/minha-nota.md"
                  value={newCaminho}
                  onChange={(e) => setNewCaminho(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="conteudo">Conteúdo (Markdown)</Label>
                <Textarea
                  id="conteudo"
                  placeholder="# Título

Conteúdo da nota..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={10}
                  className="font-mono"
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                <Input
                  id="tags"
                  placeholder="tag1, tag2, tag3"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateNota}
                disabled={createNotaMutation.isPending || !newTitle.trim() || !newCaminho.trim()}
              >
                {createNotaMutation.isPending ? "Criando..." : "Criar Nota"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Modal */}
        <Dialog open={!!previewNota} onOpenChange={(open) => !open && setPreviewNota(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            {previewData && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl">{previewData.titulo}</DialogTitle>
                  <DialogDescription>{previewData.caminho}</DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Markdown Content */}
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {previewData.conteudo}
                    </ReactMarkdown>
                  </div>

                  <Separator />

                  {/* Backlinks */}
                  {(previewData.backlinks.incoming.length > 0 || previewData.backlinks.outgoing.length > 0) && (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" />
                        Backlinks
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        {previewData.backlinks.incoming.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">
                              Incoming ({previewData.backlinks.incoming.length})
                            </p>
                            <div className="space-y-2">
                              {previewData.backlinks.incoming.map((link: any) => (
                                <Button
                                  key={link.id}
                                  variant="outline"
                                  size="sm"
                                  className="w-full justify-start"
                                  onClick={() => setPreviewNota(link.notaId)}
                                >
                                  {link.titulo}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                        {previewData.backlinks.outgoing.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">
                              Outgoing ({previewData.backlinks.outgoing.length})
                            </p>
                            <div className="space-y-2">
                              {previewData.backlinks.outgoing.map((link: any) => (
                                <Button
                                  key={link.id}
                                  variant="outline"
                                  size="sm"
                                  className="w-full justify-start"
                                  onClick={() => setPreviewNota(link.notaId)}
                                >
                                  {link.titulo}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4" />
                      {previewData.versoes} versões
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(previewData.ultimaModificacao).toLocaleString("pt-BR")}
                    </div>
                  </div>

                  {previewData.tags && previewData.tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {previewData.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setPreviewNota(null)}>
                    Fechar
                  </Button>
                  <Button onClick={() => {
                    setPreviewNota(null);
                    handleStartEdit(previewData);
                  }}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
