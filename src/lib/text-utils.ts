interface TextStyle {
  fontFamily: string;
  lineHeight: string;
  fontSize: string;
  color?: string;
}

export const TEXT_STYLES = {
  handwriting: {
    fontFamily: "'Kalam', cursive",
    lineHeight: "2.2",
    fontSize: "20px",
  },
  typewriter: {
    fontFamily: "'Courier Prime', monospace",
    lineHeight: "2",
    fontSize: "18px",
  },
  formal: {
    fontFamily: "'Crimson Text', serif",
    lineHeight: "2",
    fontSize: "19px",
  },
  modern: {
    fontFamily: "'Inter', sans-serif",
    lineHeight: "1.8",
    fontSize: "17px",
  }
} as const;

export function processTextFormatting(text: string): string {
  // Converter marcadores de negrito
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>');
  
  // Converter marcadores de itálico
  text = text.replace(/\*(.*?)\*/g, '<em class="text-foreground">$1</em>');
  
  // Converter marcadores de sublinhado
  text = text.replace(/__(.*?)__/g, '<u class="text-foreground">$1</u>');
  
  // Converter marcadores de lista
  text = text.replace(/^•\s*(.*?)$/gm, '<li class="text-foreground">$1</li>');
  
  // Agrupar itens de lista
  if (text.includes('<li>')) {
    text = '<ul class="list-disc pl-6 space-y-1 text-foreground">' + text + '</ul>';
  }
  
  return text;
}

export function getPlainText(formattedText: string): string {
  return formattedText
    .replace(/<strong.*?>(.*?)<\/strong>/g, '**$1**')
    .replace(/<em.*?>(.*?)<\/em>/g, '*$1*')
    .replace(/<u.*?>(.*?)<\/u>/g, '__$1__')
    .replace(/<li.*?>(.*?)<\/li>/g, '• $1')
    .replace(/<\/?[^>]+(>|$)/g, '');
}