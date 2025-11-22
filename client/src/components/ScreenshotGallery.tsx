import { useState } from "react";
import { X, Download, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Screenshot {
  id: number;
  filePath: string;
  width: number | null;
  height: number | null;
  section: string | null;
  scrollPosition: number | null;
}

interface ScreenshotGalleryProps {
  screenshots: Screenshot[];
  title?: string;
}

export default function ScreenshotGallery({ screenshots, title = "Screenshots" }: ScreenshotGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<Screenshot | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const openLightbox = (screenshot: Screenshot, index: number) => {
    setSelectedImage(screenshot);
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    setSelectedIndex(-1);
  };

  const goToPrevious = () => {
    if (selectedIndex > 0) {
      const newIndex = selectedIndex - 1;
      setSelectedImage(screenshots[newIndex]);
      setSelectedIndex(newIndex);
    }
  };

  const goToNext = () => {
    if (selectedIndex < screenshots.length - 1) {
      const newIndex = selectedIndex + 1;
      setSelectedImage(screenshots[newIndex]);
      setSelectedIndex(newIndex);
    }
  };

  const downloadImage = (filePath: string) => {
    const link = document.createElement('a');
    link.href = filePath;
    link.download = filePath.split('/').pop() || 'screenshot.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (screenshots.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhum screenshot disponível</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      
      {/* Grid de Screenshots */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {screenshots.map((screenshot, index) => (
          <div
            key={screenshot.id}
            className="relative group cursor-pointer rounded-lg overflow-hidden border hover:border-primary transition-colors"
            onClick={() => openLightbox(screenshot, index)}
          >
            <img
              src={screenshot.filePath}
              alt={`Screenshot ${screenshot.section || index + 1}`}
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ZoomIn className="w-8 h-8 text-white" />
            </div>
            {screenshot.section && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs px-2 py-1">
                {screenshot.section}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="relative max-w-7xl w-full h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-white">
                <p className="text-lg font-semibold">
                  {selectedImage.section || `Screenshot ${selectedIndex + 1}`}
                </p>
                <p className="text-sm text-gray-300">
                  {selectedImage.width} × {selectedImage.height}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => downloadImage(selectedImage.filePath)}
                  className="text-white hover:bg-white/20"
                >
                  <Download className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeLightbox}
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Imagem */}
            <div className="flex-1 flex items-center justify-center">
              <img
                src={selectedImage.filePath}
                alt={`Screenshot ${selectedImage.section || selectedIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* Navegação */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <Button
                variant="outline"
                onClick={goToPrevious}
                disabled={selectedIndex === 0}
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                Anterior
              </Button>
              <span className="text-white">
                {selectedIndex + 1} / {screenshots.length}
              </span>
              <Button
                variant="outline"
                onClick={goToNext}
                disabled={selectedIndex === screenshots.length - 1}
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                Próximo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
