import { nanoid } from "nanoid";

export function generateId(): string {
  return nanoid(12);
}

export function generateToken(): string {
  return nanoid(8);
}
