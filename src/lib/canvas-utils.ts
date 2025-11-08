// Funções auxiliares para flood fill e manipulação de cores
export function getPixel(imageData: ImageData, x: number, y: number): [number, number, number, number] {
  const offset = (y * imageData.width + x) * 4;
  return [
    imageData.data[offset],
    imageData.data[offset + 1],
    imageData.data[offset + 2],
    imageData.data[offset + 3],
  ];
}

export function setPixel(imageData: ImageData, x: number, y: number, color: [number, number, number, number]): void {
  const offset = (y * imageData.width + x) * 4;
  imageData.data[offset] = color[0];
  imageData.data[offset + 1] = color[1];
  imageData.data[offset + 2] = color[2];
  imageData.data[offset + 3] = color[3];
}

export function hexToRgba(hex: string): [number, number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
    255
  ] : [0, 0, 0, 255];
}

import { optimizedFloodFill } from './optimized-flood-fill';

export function floodFill(
  imageData: ImageData,
  startX: number,
  startY: number,
  fillColor: [number, number, number, number],
  tolerance: number = 1
): void {
  optimizedFloodFill(imageData, startX, startY, fillColor, tolerance);
}

export function drawLine(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number
): void {
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
}

export function drawRect(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  fill: boolean = false
): void {
  const width = endX - startX;
  const height = endY - startY;
  
  if (fill) {
    ctx.fillRect(startX, startY, width, height);
  } else {
    ctx.strokeRect(startX, startY, width, height);
  }
}

export function drawCircle(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  fill: boolean = false
): void {
  const radius = Math.sqrt(
    Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
  );
  
  ctx.beginPath();
  ctx.arc(startX, startY, radius, 0, Math.PI * 2);
  
  if (fill) {
    ctx.fill();
  } else {
    ctx.stroke();
  }
}