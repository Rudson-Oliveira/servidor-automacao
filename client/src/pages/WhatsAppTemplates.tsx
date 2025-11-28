import { useState } from 'react';
import PageLayout from '@/components/PageLayout';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Copy, FileText } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['recrutamento', 'marketing', 'suporte', 'vendas', 'geral'] as const;

export default function WhatsAppTemplates() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'geral' as typeof CATEGORIES[number],
    content: '',
  });
  const [previewData, setPreviewData] = useState({ nome: 'João Silva', vaga: 'Desenvolvedor', empresa: 'TechCorp' });

  const utils = trpc.useUtils();
  const { data: templatesData, isLoading } = trpc.templates.list.useQuery({});
  const createMutation = trpc.templates.create.useMutation({
    onSuccess: () => {
      utils.templates.list.invalidate();
      setIsDialogOpen(false);
      resetForm();
      toast.success('Template criado com sucesso!');
    },
  });
  const updateMutation = trpc.templates.update.useMutation({
    onSuccess: () => {
      utils.templates.list.invalidate();
      setIsDialogOpen(false);
      resetForm();
      toast.success('Template atualizado com sucesso!');
    },
  });
  const deleteMutation = trpc.templates.delete.useMutation({
    onSuccess: () => {
      utils.templates.list.invalidate();
      toast.success('Template deletado com sucesso!');
    },
  });

  const resetForm = () => {
    setFormData({ name: '', category: 'geral', content: '' });
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      toast.error('Preencha nome e conteúdo');
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (template: any) => {
    setFormData({
      name: template.name,
      category: template.category,
      content: template.content,
    });
    setEditingId(template.id);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja deletar este template?')) {
      deleteMutation.mutate({ id });
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Template copiado!');
  };

  // Extrair variáveis do template
  const extractVariables = (content: string) => {
    const matches = content.match(/\{\{(\w+)\}\}/g);
    return matches ? Array.from(new Set(matches.map(m => m.slice(2, -2)))) : [];
  };

  // Preview com substituição de variáveis
  const renderPreview = (content: string) => {
    return content.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const value = previewData[key as keyof typeof previewData];
      return value || `{{${key}}}`;
    });
  };

  const groupedTemplates = templatesData?.templates.reduce((acc, template) => {
    const category = template.category || 'geral';
    if (!acc[category]) acc[category] = [];
    acc[category]!.push(template);
    return acc;
  }, {} as Record<string, typeof templatesData.templates>);

  return (
    <PageLayout
      title="Templates WhatsApp"
      description="Gerencie templates de mensagens com variáveis dinâmicas"
    >
      <div className="space-y-6">
        {/* Botão Criar */}
        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar Template' : 'Novo Template'}</DialogTitle>
                <DialogDescription>
                  Use variáveis como {`{{nome}}, {{vaga}}, {{empresa}}`} para personalizar mensagens
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Editor */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome do Template</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Convite para Vaga"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value as typeof CATEGORIES[number] })}
                    >
                      <SelectTrigger id="category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="content">Conteúdo</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Olá {{nome}}! Temos uma vaga de {{vaga}} na {{empresa}}..."
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>

                  {/* Variáveis Detectadas */}
                  {formData.content && (
                    <div>
                      <Label>Variáveis Detectadas</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {extractVariables(formData.content).map((variable) => (
                          <Badge key={variable} variant="secondary">
                            {`{{${variable}}}`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Preview */}
                <div className="space-y-4">
                  <div>
                    <Label>Preview</Label>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-2">
                      <p className="text-sm whitespace-pre-wrap">
                        {formData.content ? renderPreview(formData.content) : 'Digite o conteúdo para ver o preview...'}
                      </p>
                    </div>
                  </div>

                  {/* Dados de Exemplo */}
                  <div>
                    <Label>Dados de Exemplo (para preview)</Label>
                    <div className="space-y-2 mt-2">
                      {Object.entries(previewData).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          <Label className="w-20 text-xs">{`{{${key}}}`}</Label>
                          <Input
                            value={value}
                            onChange={(e) => setPreviewData({ ...previewData, [key]: e.target.value })}
                            className="flex-1 h-8 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>
                  {editingId ? 'Atualizar' : 'Criar'} Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de Templates */}
        {isLoading ? (
          <div className="text-center py-12">Carregando templates...</div>
        ) : !groupedTemplates || Object.keys(groupedTemplates).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum template criado ainda.</p>
              <p className="text-sm text-muted-foreground mt-2">Clique em "Novo Template" para começar.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTemplates).map(([category, templates]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold mb-3 capitalize">{category}</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {templates.map((template) => (
                    <Card key={template.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            <CardDescription className="mt-1">
                              <Badge variant="outline" className="text-xs">
                                {template.category}
                              </Badge>
                            </CardDescription>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleCopy(template.content)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(template)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(template.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                          {template.content}
                        </p>
                        {template.variables && template.variables.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {template.variables.map((variable) => (
                              <Badge key={variable} variant="secondary" className="text-xs">
                                {`{{${variable}}}`}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
