import { useCallback, useRef, useState } from "react";
import { Crosshair, Eye, EyeOff, Maximize2, Minus, Plus, RotateCcw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSignedUrl } from "@/lib/survey-data";
import type { Observation } from "@/lib/survey-types";
import { cn } from "@/lib/utils";

type Props = {
  mapRef: string | null;
  observations: Observation[];
  selectedId: string | null;
  highlightedIds?: string[];
  onSelect: (id: string) => void;
  onAddAt: (point: { x: number; y: number }) => void;
  onUploadMap: () => void;
};

export function MapCanvas({
  mapRef,
  observations,
  selectedId,
  highlightedIds = [],
  onSelect,
  onAddAt,
  onUploadMap,
}: Props) {
  const { data: mapUrl } = useSignedUrl(mapRef);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [showMarkers, setShowMarkers] = useState(true);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number; moved: boolean } | null>(
    null,
  );
  const stageRef = useRef<HTMLDivElement>(null);

  const reset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const handlePointerDown = (event: React.PointerEvent) => {
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      ox: offset.x,
      oy: offset.y,
      moved: false,
    };
    (event.target as Element).setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) drag.moved = true;
    setOffset({ x: drag.ox + dx, y: drag.oy + dy });
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const handleStageClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (dragRef.current?.moved) return;
      const image = stageRef.current?.querySelector("img");
      if (!image) return;
      const rect = image.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      if (x < 0 || x > 1 || y < 0 || y > 1) return;
      onAddAt({ x: Number(x.toFixed(4)), y: Number(y.toFixed(4)) });
    },
    [onAddAt],
  );

  if (!mapRef) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-surface p-8 text-center">
        <p className="text-base font-medium">No campus map uploaded</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Upload a campus blueprint, layout, land map or site plan to start placing plant markers.
        </p>
        <Button onClick={onUploadMap}>
          <Upload className="mr-2 size-4" /> Upload Map
        </Button>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden rounded-lg border bg-surface">
      <div
        className="absolute inset-0 cursor-crosshair touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={handleStageClick}
      >
        <div
          ref={stageRef}
          className="relative origin-top-left"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
        >
          <img
            src={mapUrl ?? undefined}
            alt="Campus survey map"
            draggable={false}
            className="block w-full select-none"
          />
          {showMarkers &&
            observations
              .filter((o) => o.map_x !== null && o.map_y !== null)
              .map((o) => {
                const active = o.id === selectedId;
                const highlighted = highlightedIds.includes(o.id);
                return (
                  <button
                    key={o.id}
                    type="button"
                    style={{ left: `${(o.map_x ?? 0) * 100}%`, top: `${(o.map_y ?? 0) * 100}%` }}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect(o.id);
                    }}
                    className={cn(
                      "absolute flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-card bg-primary text-[10px] font-semibold text-primary-foreground shadow transition",
                      highlighted && "ring-2 ring-primary ring-offset-2 ring-offset-card",
                      active && "size-9 bg-foreground",
                    )}
                    title={`${o.common_name} · ${o.count}`}
                  >
                    {o.count}
                  </button>
                );
              })}
        </div>
      </div>

      <div className="absolute right-3 top-3 flex flex-col gap-1 rounded-md border bg-card p-1 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => setScale((s) => Math.min(6, s * 1.25))}>
          <Plus className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setScale((s) => Math.max(0.3, s / 1.25))}>
          <Minus className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={reset} title="Reset view">
          <RotateCcw className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={reset} title="Fit map">
          <Maximize2 className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowMarkers((v) => !v)}
          title="Toggle markers"
        >
          {showMarkers ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={onUploadMap} title="Replace map">
          <Upload className="size-4" />
        </Button>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded-md border bg-card/90 px-3 py-1.5 text-xs text-muted-foreground">
        <Crosshair className="size-3.5" /> Tap anywhere on the map to add a plant
      </div>
    </div>
  );
}
