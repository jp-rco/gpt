import React from 'react';
import { Text, StyleSheet } from 'react-native';

/**
 * Convierte un string con Markdown a un array de JSX <Text> que conserva:
 * - Encabezados (#, ##, ###, ...)
 * - Listas (viñetas y numéricas)
 * - Texto normal
 * Y además parsea inline **bold**, *italic* y `code`.
 */
export function parseAndFormat(markdown: string): JSX.Element[] {
  // Separamos el texto en líneas
  const lines = markdown.split('\n');

  return lines.map((line, index) => {
    // Lógica para detectar si la línea es un encabezado (#, ##, etc.), viñeta, etc.
    return parseLine(line, index, lines.length);
  });
}

/**
 * Detecta si la línea es un encabezado (# Título), lista con viñeta (- , * ),
 * lista numérica (1. ), etc., y luego parsea inline el texto.
 */
function parseLine(line: string, index: number, totalLines: number): JSX.Element {
  // Encabezado (hasta 6 niveles), p.ej "# Título", "## Título", etc.
  const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
  if (headingMatch) {
    const level = headingMatch[1].length; // número de # (1 a 6)
    const content = headingMatch[2];      // texto del heading
    return (
      <Text key={`heading-${index}`} style={getHeadingStyle(level)}>
        {renderInlines(content).map((comp, i) => (
          <React.Fragment key={i}>{comp}</React.Fragment>
        ))}
        {index < totalLines - 1 ? '\n' : null}
      </Text>
    );
  }

  // Lista con viñeta: "- algo" o "* algo"
  const bulletMatch = line.match(/^(\- |\* )(.*)$/);
  if (bulletMatch) {
    const bulletContent = bulletMatch[2];
    return (
      <Text key={`bullet-${index}`} style={styles.line}>
        <Text style={styles.bullet}>{'\u2022 '}</Text>
        {renderInlines(bulletContent).map((comp, i) => (
          <React.Fragment key={i}>{comp}</React.Fragment>
        ))}
        {index < totalLines - 1 ? '\n' : null}
      </Text>
    );
  }

  // Lista numérica: "1. algo", "2. algo", etc.
  const numericMatch = line.match(/^(\d+)\.\s+(.*)$/);
  if (numericMatch) {
    const num = numericMatch[1];
    const listContent = numericMatch[2];
    return (
      <Text key={`num-${index}`} style={styles.line}>
        <Text style={styles.bullet}>{num}. </Text>
        {renderInlines(listContent).map((comp, i) => (
          <React.Fragment key={i}>{comp}</React.Fragment>
        ))}
        {index < totalLines - 1 ? '\n' : null}
      </Text>
    );
  }

  // Línea normal
  return (
    <Text key={`line-${index}`} style={styles.line}>
      {renderInlines(line).map((comp, i) => (
        <React.Fragment key={i}>{comp}</React.Fragment>
      ))}
      {index < totalLines - 1 ? '\n' : null}
    </Text>
  );
}

/**
 * Lógica inline para **bold**, *italic* y `code`.
 */
function renderInlines(text: string): (JSX.Element | string)[] {
  // Regex que captura tokens: **...**, *...*, `...`
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/;
  const parts: (JSX.Element | string)[] = [];
  let remaining = text;

  while (true) {
    const match = remaining.match(pattern);
    if (!match) {
      // Si no hay más coincidencias, agregamos el resto como texto normal
      parts.push(remaining);
      break;
    }

    // Texto anterior al token
    const matchIndex = match.index ?? 0;
    const before = remaining.slice(0, matchIndex);
    if (before) {
      parts.push(before);
    }

    // El token capturado
    const token = match[0];
    parts.push(parseInlineToken(token, parts.length));

    // Actualizamos el "remaining"
    remaining = remaining.slice(matchIndex + token.length);
  }

  return parts;
}

function parseInlineToken(token: string, key: number): JSX.Element {
  // **bold**
  if (token.startsWith('**') && token.endsWith('**')) {
    const content = token.slice(2, -2);
    return (
      <Text key={key} style={styles.bold}>
        {content}
      </Text>
    );
  }
  // *italic*
  if (token.startsWith('*') && token.endsWith('*')) {
    const content = token.slice(1, -1);
    return (
      <Text key={key} style={styles.italic}>
        {content}
      </Text>
    );
  }
  // `code`
  if (token.startsWith('`') && token.endsWith('`')) {
    const content = token.slice(1, -1);
    return (
      <Text key={key} style={styles.inlineCode}>
        {content}
      </Text>
    );
  }

  // No coincide => se devuelve tal cual
  return <Text key={key}>{token}</Text>;
}

/** Retorna el estilo apropiado según el nivel del heading (1 a 6) */
function getHeadingStyle(level: number) {
  switch (level) {
    case 1:
      return styles.heading1;
    case 2:
      return styles.heading2;
    case 3:
      return styles.heading3;
    case 4:
      return styles.heading4;
    case 5:
      return styles.heading5;
    case 6:
      return styles.heading6;
    default:
      return styles.heading1;
  }
}

const styles = StyleSheet.create({
  // Texto normal
  line: {
    color: '#fff', 
    marginBottom: 2
  },

  // Viñeta o número
  bullet: {
    color: '#fff',
    fontWeight: 'bold'
  },

  // Encabezados
  heading1: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8
  },
  heading2: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 6
  },
  heading3: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 5
  },
  heading4: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 4
  },
  heading5: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginVertical: 3
  },
  heading6: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginVertical: 2
  },

  // Inline
  bold: {
    fontWeight: 'bold'
  },
  italic: {
    fontStyle: 'italic'
  },
  inlineCode: {
    fontFamily: 'monospace',
    backgroundColor: '#333',
    paddingHorizontal: 3,
    borderRadius: 3,
    color: '#fff'
  }
});
