import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export interface DigitCanvasHandle {
  clear: () => void;
  isEmpty: () => boolean;
  getImageDataUrl: () => string;
}

const CANVAS_SIZE = 280;
const GRID_STEP = 28;
const BG_COLOR = '#1e2b24';
const STROKE_COLOR = '#f2f0e6';

function paintBackground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  ctx.strokeStyle = 'rgba(242, 240, 230, 0.08)';
  ctx.lineWidth = 1;
  for (let i = GRID_STEP; i < CANVAS_SIZE; i += GRID_STEP) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, CANVAS_SIZE);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(CANVAS_SIZE, i);
    ctx.stroke();
  }

  ctx.strokeStyle = STROKE_COLOR;
  ctx.lineWidth = 16;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

const DigitCanvas = forwardRef<DigitCanvasHandle>((_props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const hasDrawn = useRef(false);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) paintBackground(ctx);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const touch = e.touches[0];
      return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDrawing.current = true;
    hasDrawn.current = true;
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  useImperativeHandle(ref, () => ({
    clear: () => {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) paintBackground(ctx);
      hasDrawn.current = false;
    },
    isEmpty: () => !hasDrawn.current,
    getImageDataUrl: () => canvasRef.current!.toDataURL('image/png'),
  }));

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={stopDrawing}
      className="touch-none rounded-md border-2 border-dashed border-chalk-dust cursor-crosshair w-full max-w-70 mx-auto block"
    />
  );
});

DigitCanvas.displayName = 'DigitCanvas';
export default DigitCanvas;
