import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, Plus, Trash2, ExternalLink, Check } from "lucide-react";

interface Link {
  nome: string;
  url: string;
  categoria: string;
}

export default function ObsidianCatalog() {
  const [titulo, setTitulo] = useState("Catalogo de Links");
  const [links, setLinks] = useState<Link[]>([
    { nome: "", url: "", categoria: "" }
  ]);
  const [uriGerada, setUriGerada] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const adicionarLink = () => {
    setLinks([...links, { nome: "", url: "", categoria: "" }]);
  };

  const removerLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const atualizarLink = (index: number, campo: keyof Link, valor: string) => {
    const novosLinks = [...links];
    novosLinks[index][campo] = valor;
    setLinks(novosLinks);
  };

  const gerarURI = async () => {
    // Validar
    const linksValidos = links.filter(l => l.nome && l.url);
    if (linksValidos.length === 0) {
      toast.error("Adicione pelo menos um link válido!");
      return;
    }

    if (!titulo.trim()) {
      toast.error("Digite um título para o catálogo!");
      return;
    }

    setCarregando(true);

    try {
      const response = await fetch("/api/obsidian/catalogar-links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          titulo,
          links: linksValidos
        })
      });

      const data = await response.json();

      if (data.sucesso) {
        setUriGerada(data.uri);
        toast.success(`URI gerada com sucesso! ${data.totalLinks} links em ${data.categorias} categorias.`);
      } else {
        toast.error(data.erro || "Erro ao gerar URI");
      }
    } catch (erro) {
      console.error("Erro:", erro);
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setCarregando(false);
    }
  };

  const copiarURI = async () => {
    if (!uriGerada) {
      toast.error("Gere a URI primeiro!");
      return;
    }

    try {
      await navigator.clipboard.writeText(uriGerada);
      setCopiado(true);
      toast.success("URI copiada para área de transferência!");
      
      setTimeout(() => setCopiado(false), 2000);
    } catch (erro) {
      console.error("Erro ao copiar:", erro);
      toast.error("Erro ao copiar URI");
    }
  };

  const abrirObsidian = () => {
    if (!uriGerada) {
      toast.error("Gere a URI primeiro!");
      return;
    }

    window.location.href = uriGerada;
    toast.success("Abrindo Obsidian...");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">
            📚 Catalogar Links no Obsidian
          </h1>
          <p className="text-gray-600">
            Crie catálogos organizados de links diretamente no Obsidian
          </p>
        </div>

        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Catálogo</CardTitle>
            <CardDescription>
              Preencha os dados e gere a URI para criar o arquivo no Obsidian
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="titulo">Título do Catálogo</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Links Úteis para o Projeto"
              />
            </div>

            {/* Links */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Links ({links.length})</Label>
                <Button
                  onClick={adicionarLink}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Link
                </Button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {links.map((link, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`nome-${index}`}>Nome</Label>
                        <Input
                          id={`nome-${index}`}
                          value={link.nome}
                          onChange={(e) => atualizarLink(index, "nome", e.target.value)}
                          placeholder="Ex: Stanford HAI"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`url-${index}`}>URL</Label>
                        <Input
                          id={`url-${index}`}
                          value={link.url}
                          onChange={(e) => atualizarLink(index, "url", e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`categoria-${index}`}>Categoria</Label>
                        <div className="flex gap-2">
                          <Input
                            id={`categoria-${index}`}
                            value={link.categoria}
                            onChange={(e) => atualizarLink(index, "categoria", e.target.value)}
                            placeholder="Ex: AI Research"
                          />
                          <Button
                            onClick={() => removerLink(index)}
                            size="icon"
                            variant="destructive"
                            disabled={links.length === 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Botão Gerar */}
            <Button
              onClick={gerarURI}
              className="w-full"
              size="lg"
              disabled={carregando}
            >
              {carregando ? "Gerando..." : "Gerar URI do Obsidian"}
            </Button>
          </CardContent>
        </Card>

        {/* URI Gerada */}
        {uriGerada && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900">✅ URI Gerada com Sucesso!</CardTitle>
              <CardDescription>
                Use os botões abaixo para copiar ou abrir diretamente no Obsidian
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* URI */}
              <div className="space-y-2">
                <Label>URI Gerada</Label>
                <div className="p-3 bg-white rounded-md border border-green-200 font-mono text-sm break-all max-h-32 overflow-y-auto">
                  {uriGerada}
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={copiarURI}
                  size="lg"
                  variant={copiado ? "default" : "outline"}
                  className={copiado ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  {copiado ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar URI
                    </>
                  )}
                </Button>

                <Button
                  onClick={abrirObsidian}
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir no Obsidian
                </Button>
              </div>

              {/* Instruções */}
              <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Como usar:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  <li>Clique em "Copiar URI" para copiar para área de transferência</li>
                  <li>Cole no navegador OU clique em "Abrir no Obsidian"</li>
                  <li>O Obsidian abrirá automaticamente e criará o arquivo</li>
                  <li>Verifique em: GERAL RUDSON/{titulo}.md</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
