import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/opacity.css';
import SkeletonLoader from "@/components/SkeletonLoader";

interface ImageComparisonProps {
  originalImage: string;
  generatedImage: string;
  originalLabel?: string;
  generatedLabel?: string;
}

export default function ImageComparison({
  originalImage,
  generatedImage,
  originalLabel = "Original",
  generatedLabel = "Gerado"
}: ImageComparisonProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState<"slider" | "side-by-side" | "overlay">("slider");
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  return (
    <div className="space-y-4">
      {/* Controles de Modo */}
      <div className="flex items-center gap-2">
        <Button
          variant={mode === "slider" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("slider")}
        >
          Slider
        </Button>
        <Button
          variant={mode === "side-by-side" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("side-by-side")}
        >
          Lado a Lado
        </Button>
        <Button
          variant={mode === "overlay" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("overlay")}
        >
          Sobreposição
        </Button>
      </div>

      {/* Modo Slider */}
      {mode === "slider" && (
        <div
          ref={containerRef}
          className="relative w-full aspect-video overflow-hidden rounded-lg border cursor-col-resize select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseUp}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          {/* Imagem Original (fundo) */}
          <LazyLoadImage
            src={originalImage}
            alt={originalLabel}
            className="absolute inset-0 w-full h-full object-cover"
            effect="opacity"
            threshold={0}
            wrapperProps={{ style: { position: 'absolute', inset: 0 } }}
            placeholder={
              <SkeletonLoader width="100%" height="100%" />
            }
          />

          {/* Imagem Gerada (com clip) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <LazyLoadImage
              src={generatedImage}
              alt={generatedLabel}
              className="absolute inset-0 w-full h-full object-cover"
              effect="opacity"
              threshold={0}
              wrapperProps={{ style: { position: 'absolute', inset: 0 } }}
            />
          </div>

          {/* Linha do Slider */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-col-resize"
            style={{ left: `${sliderPosition}%` }}
            onMouseDown={handleMouseDown}
            onTouchStart={() => setIsDragging(true)}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
              <div className="flex gap-0.5">
                <div className="w-0.5 h-4 bg-gray-600"></div>
                <div className="w-0.5 h-4 bg-gray-600"></div>
              </div>
            </div>
          </div>

          {/* Labels */}
          <div className="absolute top-4 left-4 bg-black/70 text-white text-sm px-3 py-1 rounded">
            {originalLabel}
          </div>
          <div className="absolute top-4 right-4 bg-black/70 text-white text-sm px-3 py-1 rounded">
            {generatedLabel}
          </div>
        </div>
      )}

      {/* Modo Lado a Lado */}
      {mode === "side-by-side" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="relative rounded-lg border overflow-hidden">
            <LazyLoadImage
              src={originalImage}
              alt={originalLabel}
              className="w-full aspect-video object-cover"
              effect="opacity"
              threshold={100}
              placeholder={
                <SkeletonLoader width="100%" height="auto" className="aspect-video" />
              }
            />
            <div className="absolute top-4 left-4 bg-black/70 text-white text-sm px-3 py-1 rounded">
              {originalLabel}
            </div>
          </div>
          <div className="relative rounded-lg border overflow-hidden">
            <LazyLoadImage
              src={generatedImage}
              alt={generatedLabel}
              className="w-full aspect-video object-cover"
              effect="opacity"
              threshold={100}
              placeholder={
                <SkeletonLoader width="100%" height="auto" className="aspect-video" />
              }
            />
            <div className="absolute top-4 left-4 bg-black/70 text-white text-sm px-3 py-1 rounded">
              {generatedLabel}
            </div>
          </div>
        </div>
      )}

      {/* Modo Sobreposição */}
      {mode === "overlay" && (
        <div className="relative w-full aspect-video rounded-lg border overflow-hidden">
          <LazyLoadImage
            src={originalImage}
            alt={originalLabel}
            className="absolute inset-0 w-full h-full object-cover"
            effect="opacity"
            threshold={0}
            wrapperProps={{ style: { position: 'absolute', inset: 0 } }}
            placeholder={
              <SkeletonLoader width="100%" height="100%" />
            }
          />
          <LazyLoadImage
            src={generatedImage}
            alt={generatedLabel}
            className="absolute inset-0 w-full h-full object-cover opacity-50"
            effect="opacity"
            threshold={0}
            wrapperProps={{ style: { position: 'absolute', inset: 0 } }}
          />
          <div className="absolute top-4 left-4 bg-black/70 text-white text-sm px-3 py-1 rounded">
            {originalLabel} + {generatedLabel}
          </div>
        </div>
      )}
    </div>
  );
}
