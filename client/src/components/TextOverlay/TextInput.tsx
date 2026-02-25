import { useState, useRef } from "react";
import { useToolStore } from "../../store/tool-store";
import { useViewportStore } from "../../store/viewport-store";
import { useTextOptions } from "../../tools/TextTool";

interface Props {
  x: number;
  y: number;
  onCommit: (text: string) => void;
  onCancel: () => void;
  onChange: (text: string) => void;
}

export function TextInput({ x, y, onCommit, onCancel, onChange }: Props) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef(false);
  const { size: fontSize, color: textColor } = useTextOptions();
  const fontFamily = useToolStore((s) => s.fontFamily);
  const scale = useViewportStore((s) => s.scale);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!doneRef.current) {
        doneRef.current = true;
        onCommit(value);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (!doneRef.current) {
        doneRef.current = true;
        onCancel();
      }
    }
    e.stopPropagation();
  };

  const handleBlur = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (value.trim()) {
      onCommit(value);
    } else {
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      autoFocus
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      style={{
        position: "absolute",
        left: x,
        top: y,
        fontSize: fontSize * scale,
        fontFamily,
        color: textColor,
        background: "transparent",
        border: "1px dashed #2563eb",
        borderRadius: 2,
        outline: "none",
        padding: "0 2px",
        minWidth: 40,
        zIndex: 500,
      }}
    />
  );
}
