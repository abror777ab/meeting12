'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  PenTool,
  Eraser,
  Trash2,
  Download,
  X,
  Undo,
  Palette,
  Minus,
} from 'lucide-react';
import { DrawLine } from '@/services/signalingService';

const COLORS = [
  '#ffffff',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
];

const STROKE_SIZES = [2, 4, 8, 16];

interface WhiteboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  lines: DrawLine[];
  onDrawLine: (line: DrawLine) => void;
  onClear: () => void;
}

export function WhiteboardModal({
  isOpen,
  onClose,
  lines,
  onDrawLine,
  onClear,
}: WhiteboardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const [selectedSize, setSelectedSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // Redraw canvas whenever lines change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high DPI canvas size
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid background lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 30;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Render all lines
    lines.forEach((line) => {
      ctx.beginPath();
      ctx.moveTo(line.prevX * canvas.width, line.prevY * canvas.height);
      ctx.lineTo(line.currX * canvas.width, line.currY * canvas.height);
      ctx.strokeStyle = line.isEraser ? '#0f172a' : line.color;
      ctx.lineWidth = line.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    });
  }, [lines, isOpen]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvas.width;
    const y = (e.clientY - rect.top) / canvas.height;

    setIsDrawing(true);
    lastPosRef.current = { x, y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPosRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const currX = (e.clientX - rect.left) / canvas.width;
    const currY = (e.clientY - rect.top) / canvas.height;

    const line: DrawLine = {
      prevX: lastPosRef.current.x,
      prevY: lastPosRef.current.y,
      currX,
      currY,
      color: selectedColor,
      size: isEraser ? selectedSize * 4 : selectedSize,
      isEraser,
    };

    onDrawLine(line);
    lastPosRef.current = { x: currX, y: currY };
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    lastPosRef.current = null;
  };

  // Touch handlers for smartphones & tablets
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) / canvas.width;
    const y = (touch.clientY - rect.top) / canvas.height;

    setIsDrawing(true);
    lastPosRef.current = { x, y };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPosRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const currX = (touch.clientX - rect.left) / canvas.width;
    const currY = (touch.clientY - rect.top) / canvas.height;

    const line: DrawLine = {
      prevX: lastPosRef.current.x,
      prevY: lastPosRef.current.y,
      currX,
      currY,
      color: selectedColor,
      size: isEraser ? selectedSize * 4 : selectedSize,
      isEraser,
    };

    onDrawLine(line);
    lastPosRef.current = { x: currX, y: currY };
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const image = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = image;
    a.download = `meeting-whiteboard-${Date.now()}.png`;
    a.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-5xl h-[85vh] rounded-3xl bg-slate-900 border border-slate-800 flex flex-col shadow-2xl overflow-hidden">
        {/* Header toolbar */}
        <div className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Interaktiv Doska (Whiteboard)</h3>
              <p className="text-[11px] text-slate-400">Jamoa bilan chizing va g&apos;oyalarni vizuallashtiring</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Yuklab olish</span>
            </button>
            <button
              type="button"
              onClick={onClear}
              className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium flex items-center gap-1.5 border border-red-500/20 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tozalash</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Secondary Toolbar (Colors, Eraser, Thickness) */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between gap-4 overflow-x-auto">
          {/* Tools */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEraser(false)}
              className={`p-2 rounded-xl flex items-center gap-1.5 text-xs font-medium transition-all ${
                !isEraser
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Qalam</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEraser(true)}
              className={`p-2 rounded-xl flex items-center gap-1.5 text-xs font-medium transition-all ${
                isEraser
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>O&apos;chirg&apos;ich</span>
            </button>
          </div>

          {/* Color Palette */}
          {!isEraser && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Rang:</span>
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  style={{ backgroundColor: color }}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    selectedColor === color ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900 scale-110' : 'hover:scale-105'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Stroke Thickness */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Qalinlik:</span>
            {STROKE_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold ${
                  selectedSize === size
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative cursor-crosshair bg-[#0f172a] overflow-hidden">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
            className="w-full h-full block touch-none"
          />
        </div>
      </div>
    </div>
  );
}
