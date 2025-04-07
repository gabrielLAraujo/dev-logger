declare module 'jspdf' {
  export default class jsPDF {
    constructor(options?: {
      orientation?: 'p' | 'l';
      unit?: 'pt' | 'px' | 'in' | 'mm' | 'cm' | 'm';
      format?: string | [number, number];
      compress?: boolean;
      precision?: number;
      userUnit?: number;
      hotfixes?: string[];
      putOnlyUsedFonts?: boolean;
      floatPrecision?: number;
    });
    
    setFontSize(size: number): jsPDF;
    text(text: string, x: number, y: number): jsPDF;
    save(filename: string): jsPDF;
  }
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