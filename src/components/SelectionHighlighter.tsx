"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Highlighter, FileText } from 'lucide-react';

interface SelectionHighlighterProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

export default function SelectionHighlighter({ containerRef }: SelectionHighlighterProps) {
  const [showToolbar, setShowToolbar] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [range, setRange] = useState<Range | null>(null);

  const updateSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      setShowToolbar(false);
      return;
    }

    const text = selection.toString().trim();
    if (!text) {
      setShowToolbar(false);
      return;
    }

    // Check if selection is within the container
    const selectionRange = selection.getRangeAt(0);
    if (!containerRef.current?.contains(selectionRange.commonAncestorContainer)) {
      setShowToolbar(false);
      return;
    }

    const rect = selectionRange.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    setRange(selectionRange.cloneRange());

    // Position toolbar above selection relative to container
    setPosition({
      top: rect.top - containerRect.top - 48,
      left: rect.left - containerRect.left + rect.width / 2,
    });
    setShowToolbar(true);
  }, [containerRef]);

  useEffect(() => {
    const handleMouseUp = () => {
      setTimeout(updateSelection, 10);
    };

    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setShowToolbar(false);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [updateSelection]);

  const applyHighlight = (color: 'orange' | 'black') => {
    if (!range) return;

    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }

    const className = color === 'orange' ? 'ielts-highlight-orange' : 'ielts-highlight-black';

    const mark = document.createElement('mark');
    mark.className = className;

    try {
      range.surroundContents(mark);
    } catch (e) {
      // Simple fallback for multi-node selection
      const fragment = range.extractContents();
      mark.appendChild(fragment);
      range.insertNode(mark);
    }

    setShowToolbar(false);
    window.getSelection()?.removeAllRanges();
  };

  const removeHighlight = () => {
    if (!range) return;
    const container = containerRef.current;
    if (!container) return;

    const marks = container.querySelectorAll('.ielts-highlight-orange, .ielts-highlight-black');
    marks.forEach(mark => {
      const selection = window.getSelection();
      if (selection && selection.containsNode(mark, true)) {
        const parent = mark.parentNode;
        while (mark.firstChild) {
          parent?.insertBefore(mark.firstChild, mark);
        }
        parent?.removeChild(mark);
      }
    });

    setShowToolbar(false);
    window.getSelection()?.removeAllRanges();
  };

  if (!showToolbar) return null;

  return (
    <div
      className="absolute z-[9999] flex items-center bg-white border border-slate-300 rounded shadow-md p-1 animate-in fade-in zoom-in duration-100 transform -translate-x-1/2"
      style={{ top: position.top, left: position.left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="flex gap-1">
        <button
          onClick={() => applyHighlight('orange')}
          className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 border border-slate-200 rounded transition-colors group"
          title="Highlight Orange"
        >
          <Highlighter className="w-5 h-5 text-orange-500" strokeWidth={2.5} />
        </button>
        <button
          onClick={() => applyHighlight('black')}
          className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 border border-slate-200 rounded transition-colors group"
          title="Highlight Black"
        >
          <Highlighter className="w-5 h-5 text-slate-900" strokeWidth={2.5} />
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 border border-slate-200 rounded transition-colors group"
          title="Add Note"
        >
          <FileText className="w-5 h-5 text-slate-800" fill="currentColor" />
        </button>
        <button
          onClick={removeHighlight}
          className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 border border-slate-200 rounded transition-colors group"
          title="Clear Highlight"
        >
          <div className="w-5 h-5 border-2 border-slate-800 rounded-sm relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -rotate-45 -translate-y-1/2" />
          </div>
        </button>
      </div>

      {/* Tooltip Arrow */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-white" />
    </div>
  );
}
