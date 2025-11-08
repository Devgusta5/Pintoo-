interface Span {
  y: number;
  left: number;
  right: number;
}

export function optimizedFloodFill(
  imageData: ImageData,
  startX: number,
  startY: number,
  fillColor: [number, number, number, number],
  tolerance: number = 1
): void {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  // Pega a cor do pixel inicial
  const startPos = (startY * width + startX) * 4;
  const startR = data[startPos];
  const startG = data[startPos + 1];
  const startB = data[startPos + 2];
  const startA = data[startPos + 3];

  // Se a cor inicial é igual à cor de preenchimento, não faz nada
  if (
    startR === fillColor[0] &&
    startG === fillColor[1] &&
    startB === fillColor[2] &&
    startA === fillColor[3]
  ) {
    return;
  }

  // Array de spans para processar
  const spans: Span[] = [];
  spans.push({ y: startY, left: startX, right: startX });

  // Função para verificar se um pixel corresponde à cor inicial
  function checkPixel(pos: number): boolean {
    return (
      Math.abs(data[pos] - startR) <= tolerance &&
      Math.abs(data[pos + 1] - startG) <= tolerance &&
      Math.abs(data[pos + 2] - startB) <= tolerance &&
      Math.abs(data[pos + 3] - startA) <= tolerance
    );
  }

  // Função para preencher um span
  function fillSpan(span: Span): void {
    const startOffset = (span.y * width + span.left) * 4;
    const endOffset = (span.y * width + span.right) * 4;

    for (let i = startOffset; i <= endOffset; i += 4) {
      data[i] = fillColor[0];
      data[i + 1] = fillColor[1];
      data[i + 2] = fillColor[2];
      data[i + 3] = fillColor[3];
    }
  }

  // Função para adicionar um novo span
  function addSpan(y: number, left: number, right: number): void {
    if (y >= 0 && y < height) {
      spans.push({ y, left, right });
    }
  }

  while (spans.length > 0) {
    const span = spans.pop()!;
    let { y, left, right } = span;

    // Expande o span para a esquerda
    let pos = (y * width + left) * 4;
    while (left > 0 && checkPixel(pos - 4)) {
      left--;
      pos -= 4;
    }

    // Expande o span para a direita
    pos = (y * width + right) * 4;
    while (right < width - 1 && checkPixel(pos + 4)) {
      right++;
      pos += 4;
    }

    // Preenche o span atual
    fillSpan({ y, left, right });

    // Verifica a linha acima
    let prevInSpan = false;
    if (y > 0) {
      pos = ((y - 1) * width + left) * 4;
      for (let x = left; x <= right; x++) {
        const matchesColor = checkPixel(pos);
        if (!prevInSpan && matchesColor) {
          addSpan(y - 1, x, x);
          prevInSpan = true;
        } else if (prevInSpan && !matchesColor) {
          spans[spans.length - 1].right = x - 1;
          prevInSpan = false;
        }
        pos += 4;
      }
      if (prevInSpan) {
        spans[spans.length - 1].right = right;
      }
    }

    // Verifica a linha abaixo
    prevInSpan = false;
    if (y < height - 1) {
      pos = ((y + 1) * width + left) * 4;
      for (let x = left; x <= right; x++) {
        const matchesColor = checkPixel(pos);
        if (!prevInSpan && matchesColor) {
          addSpan(y + 1, x, x);
          prevInSpan = true;
        } else if (prevInSpan && !matchesColor) {
          spans[spans.length - 1].right = x - 1;
          prevInSpan = false;
        }
        pos += 4;
      }
      if (prevInSpan) {
        spans[spans.length - 1].right = right;
      }
    }
  }
}