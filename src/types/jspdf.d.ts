declare module 'jspdf' {
  interface JsPDFOptions {
    orientation?: 'p' | 'l';
    unit?: 'pt' | 'px' | 'in' | 'mm' | 'cm' | 'm';
    format?: string | [number, number];
    compress?: boolean;
    precision?: number;
    userPassword?: string;
    ownerPassword?: string;
    encryption?: {
      userPermissions?: string[];
    };
  }

  interface TextOptions {
    align?: 'left' | 'center' | 'right' | 'justify';
    maxWidth?: number;
    renderingMode?: 'fill' | 'stroke' | 'fillThenStroke';
  }

  interface CellOptions {
    halign?: 'left' | 'center' | 'right';
    valign?: 'top' | 'middle' | 'bottom';
    cellPadding?: number;
    cellWidth?: number | 'auto';
    cellHeight?: number | 'auto';
    minCellHeight?: number;
    minCellWidth?: number;
    maxCellWidth?: number;
    cellColor?: string | number[];
    textColor?: string | number[];
    fontStyle?: string;
    overflow?: 'linebreak' | 'ellipsis' | 'visible' | 'hidden';
  }

  class jsPDF {
    constructor(options?: JsPDFOptions);
    text(text: string, x: number, y: number, options?: TextOptions): jsPDF;
    addPage(): jsPDF;
    save(filename: string): jsPDF;
    output(type: string, options?: { filename?: string }): string | Uint8Array;
    setFont(fontName: string, fontStyle?: string): jsPDF;
    setFontSize(size: number): jsPDF;
    setTextColor(color: string | number[]): jsPDF;
    setFillColor(color: string | number[]): jsPDF;
    rect(x: number, y: number, w: number, h: number, style?: string): jsPDF;
    line(x1: number, y1: number, x2: number, y2: number): jsPDF;
    autoTable(options: {
      head?: string[][];
      body?: string[][];
      foot?: string[][];
      startY?: number;
      margin?: { top?: number; right?: number; bottom?: number; left?: number };
      styles?: {
        cellPadding?: number;
        fontSize?: number;
        font?: string;
        cellWidth?: number | 'auto';
        halign?: 'left' | 'center' | 'right';
        valign?: 'top' | 'middle' | 'bottom';
      };
      headStyles?: CellOptions;
      bodyStyles?: CellOptions;
      footStyles?: CellOptions;
      alternateRowStyles?: CellOptions;
      columnStyles?: { [key: string]: CellOptions };
      theme?: string;
      didDrawPage?: (data: { pageNumber: number; pageCount: number; settings: Record<string, unknown> }) => void;
      willDrawCell?: (data: { cell: { text: string; styles: CellOptions }; row: { index: number; data: string[] }; column: { index: number; data: string }; section: string }) => void;
      didDrawCell?: (data: { cell: { text: string; styles: CellOptions }; row: { index: number; data: string[] }; column: { index: number; data: string }; section: string }) => void;
    }): jsPDF;
  }

  export = jsPDF;
}

declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';
  
  interface UserOptions {
    head?: string[][];
    body?: string[][];
    foot?: string[][];
    startY?: number;
    theme?: 'striped' | 'grid' | 'plain';
    styles?: {
      fontSize?: number;
      cellPadding?: number;
      [key: string]: any;
    };
    headStyles?: {
      fillColor?: number[];
      textColor?: number[];
      fontStyle?: string;
      [key: string]: any;
    };
    columnStyles?: {
      [key: string]: {
        cellWidth?: number | string;
        [key: string]: any;
      };
    };
  }
  
  function autoTable(doc: jsPDF, options: UserOptions): void;
  
  export { autoTable };
} 