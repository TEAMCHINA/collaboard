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
}

export type BoardElement = StrokeElement | TextElement;
