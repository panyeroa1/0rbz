
import React, { useRef, useEffect, useState } from 'react';
import { Pencil, Eraser, Trash2, Download, Square, Circle as CircleIcon, Type } from 'lucide-react';

const Whiteboard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#3B82F6');
  const [tool, setTool] = useState<'pencil' | 'eraser'>('pencil');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.beginPath();
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    ctx.strokeStyle = tool === 'eraser' ? '#000000' : color;
    ctx.lineWidth = tool === 'eraser' ? 20 : 3;
    
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950 rounded-2xl border border-white/5 overflow-hidden">
      <div className="flex items-center gap-2 p-3 bg-white/5 border-b border-white/5">
        <button onClick={() => setTool('pencil')} className={`p-2 rounded-lg ${tool === 'pencil' ? 'bg-blue-600 text-white' : 'hover:bg-white/10'}`}><Pencil size={18}/></button>
        <button onClick={() => setTool('eraser')} className={`p-2 rounded-lg ${tool === 'eraser' ? 'bg-blue-600 text-white' : 'hover:bg-white/10'}`}><Eraser size={18}/></button>
        <div className="w-px h-6 bg-white/10 mx-1"></div>
        {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#FFFFFF'].map(c => (
          <button key={c} onClick={() => setColor(c)} className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-white' : 'border-transparent'}`} style={{backgroundColor: c}} />
        ))}
        <div className="flex-1"></div>
        <button onClick={clear} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg"><Trash2 size={18}/></button>
      </div>
      <div className="flex-1 relative cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </div>
  );
};

export default Whiteboard;
