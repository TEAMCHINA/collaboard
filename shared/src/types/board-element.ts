export interface BaseElement {
  id: string;
  type: string;
  owner: string;
  createdAt: number;
  zIndex: number;
}

export interface StrokeElement extends BaseElement {
  type: "stroke";
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

export interface TextElement extends BaseElement {
  type: "text";
  x: number;
  y: number;
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export interface ImageElement extends BaseElement {
  type: "image";
  x: number;
  y: number;
  width: number;
  height: number;
  dataUrl: string;
}

export interface RectElement extends BaseElement {
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  strokeWidth: number;
  filled?: boolean;
}

export type BoardElement = StrokeElement | TextElement | ImageElement | RectElement;
