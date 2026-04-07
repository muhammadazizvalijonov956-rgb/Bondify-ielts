"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Type, List, AlignLeft, Minus, CheckSquare, LayoutList, LayoutGrid, Upload, Clock, Send, Mic } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type ItemType = "heading" | "text" | "section" | "question" | "matching_group" | "table" | "image";
type AnswerType = "blank" | "multiple_choice" | "multi_select" | "dropdown" | "true_false" | "yes_no";

interface MatchingOption { letter: string; text: string; }
interface MatchingQuestion { id: number; label: string; correctAnswer: string; }

interface PartItem {
  type: ItemType;
  content?: string;
  // question fields
  id?: number;
  label?: string;
  suffix?: string;
  answer_type?: AnswerType;
  options?: string[];
  correctAnswer?: string;
  // multi_select fields
  ids?: number[];
  maxSelections?: number;
  // matching_group fields
  title?: string;
  optionsTitle?: string;
  matchOptions?: MatchingOption[];
  questions?: MatchingQuestion[];
  // table fields
  headers?: string[];
  rows?: { cells: { content: string }[] }[];
  tableQuestions?: { id: number; correctAnswer: string }[];
  imageUrl?: string;
  imageCaption?: string;
}

interface Props {
  partJson: string;
  onChange: (updatedJson: string) => void;
  section?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseItems(json: string): PartItem[] {
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed.items)) return parsed.items;
    const qs = Array.isArray(parsed.questions)
      ? parsed.questions
      : parsed.questions ? Object.values(parsed.questions as Record<string, unknown>) : [];
    if ((qs as any[]).length > 0) {
      return (qs as any[]).map((q: any) => ({
        type: "question" as ItemType,
        id: q.id ?? q.number,
        label: q.text ?? q.label ?? "",
        answer_type: q.type === "multiple_choice" ? "multiple_choice" : "blank",
        options: q.options ?? [],
        correctAnswer: q.correctAnswer ?? "",
        suffix: q.suffix ?? "",
      }));
    }
    return [];
  } catch { return []; }
}

function serializeItems(json: string, items: PartItem[]): string {
  try {
    const parsed = JSON.parse(json);
    parsed.items = items;
    return JSON.stringify(parsed, null, 2);
  } catch { return json; }
}

const FALLBACK_META = { label: "unknown", color: "bg-slate-100 text-slate-500 border-slate-200", icon: <AlignLeft className="w-3 h-3" /> };

const TYPE_META: Record<ItemType, { label: string; color: string; icon: React.ReactNode }> = {
  heading:        { label: "Heading",   color: "bg-violet-100 text-violet-700 border-violet-200",  icon: <Type className="w-3 h-3" /> },
  section:        { label: "Section",   color: "bg-blue-100 text-blue-700 border-blue-200",         icon: <Minus className="w-3 h-3" /> },
  text:           { label: "Text",      color: "bg-slate-100 text-slate-600 border-slate-200",       icon: <AlignLeft className="w-3 h-3" /> },
  question:       { label: "Question",  color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: <List className="w-3 h-3" /> },
  matching_group: { label: "Matching",  color: "bg-orange-100 text-orange-700 border-orange-200",   icon: <LayoutList className="w-3 h-3" /> },
  table:          { label: "Table",     color: "bg-sky-100 text-sky-700 border-sky-200",            icon: <LayoutGrid className="w-3 h-3" /> },
  image:          { label: "Image/Graph", color: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200", icon: <LayoutGrid className="w-3 h-3" /> },
};

const ANSWER_TYPE_META: Record<AnswerType, { label: string; color: string; icon: React.ReactNode }> = {
  blank:            { label: "Fill in Blank",    color: "bg-sky-50 text-sky-700 border-sky-200",        icon: <AlignLeft className="w-3 h-3" /> },
  multiple_choice:  { label: "Multiple Choice",  color: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: <List className="w-3 h-3" /> },
  multi_select:     { label: "Multi-Select",     color: "bg-purple-50 text-purple-700 border-purple-200", icon: <CheckSquare className="w-3 h-3" /> },
  dropdown:         { label: "Dropdown Select",  color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <ChevronDown className="w-3 h-3" /> },
  true_false:       { label: "T/F/NG Choice",    color: "bg-amber-50 text-amber-700 border-amber-200",   icon: <CheckSquare className="w-3 h-3" /> },
  yes_no:           { label: "Y/N/NG Choice",    color: "bg-rose-50 text-rose-700 border-rose-200",     icon: <CheckSquare className="w-3 h-3" /> },
};

// ── ItemCard ──────────────────────────────────────────────────────────────────

function ItemCard({ item, index, total, onUpdate, onRemove, onMove, globalNextId, section }: {
  item: PartItem; index: number; total: number;
  onUpdate: (u: PartItem) => void; onRemove: () => void; onMove: (d: -1 | 1) => void;
  globalNextId: number;
  section?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = TYPE_META[item.type as ItemType] ?? FALLBACK_META;
  const update = (patch: Partial<PartItem>) => onUpdate({ ...item, ...patch });

  // ── Matching Group Helpers ──
  const addMatchOption = () => update({ matchOptions: [...(item.matchOptions ?? []), { letter: String.fromCharCode(65 + (item.matchOptions?.length ?? 0)), text: "" }] });
  const updateMatchOption = (i: number, text: string) => { const o = [...(item.matchOptions ?? [])]; o[i] = { ...o[i], text }; update({ matchOptions: o }); };
  const removeMatchOption = (i: number) => {
    const o = [...(item.matchOptions ?? [])]; o.splice(i, 1);
    update({ matchOptions: o.map((opt, idx) => ({ ...opt, letter: String.fromCharCode(65 + idx) })) });
  };
  const addMatchQuestion = () => {
    const localMax = (item.questions ?? []).reduce((m, q) => Math.max(m, q.id ?? 0), 0);
    const nextId = Math.max(localMax + 1, globalNextId);
    update({ questions: [...(item.questions ?? []), { id: nextId, label: "", correctAnswer: "" }] });
  };
  const updateMatchQuestion = (i: number, patch: Partial<MatchingQuestion>) => { const q = [...(item.questions ?? [])]; q[i] = { ...q[i], ...patch }; update({ questions: q }); };
  const removeMatchQuestion = (i: number) => { const q = [...(item.questions ?? [])]; q.splice(i, 1); update({ questions: q }); };

  // ── Question Helpers ──
  const addOption = () => update({ options: [...(item.options ?? []), ""] });
  const updateOption = (i: number, val: string) => { const o = [...(item.options ?? [])]; o[i] = val; update({ options: o }); };
  const removeOption = (i: number) => { const o = [...(item.options ?? [])]; o.splice(i, 1); update({ options: o }); };

  const previewLabel = item.type === "question"
    ? `[${item.ids ? item.ids.join(" & ") : item.id ?? "?"}] ${item.label ?? "(no label)"}${item.suffix ? " … " + item.suffix : ""}`
    : item.type === "matching_group"
      ? `Matching Group — ${item.questions?.length ?? 0} qs, ${item.matchOptions?.length ?? 0} opts`
      : item.type === "table"
        ? `Table — ${item.headers?.length ?? 0} cols, ${item.rows?.length ?? 0} rows`
        : (item.content || item.label) ?? "(empty)";

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm group">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <GripVertical className="w-4 h-4 text-slate-300 shrink-0 cursor-grab" />
        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded border ${meta.color} shrink-0`}>
          {meta.icon} {meta.label}
        </span>
        {item.type === "question" && item.answer_type && item.answer_type !== "blank" && section !== 'speaking' && (
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded border ${ANSWER_TYPE_META[item.answer_type]?.color ?? ""} shrink-0`}>
            {ANSWER_TYPE_META[item.answer_type]?.icon}
          </span>
        )}
        <span className="text-sm text-slate-700 truncate flex-1 font-medium">{previewLabel}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button type="button" disabled={index === 0} onClick={() => onMove(-1)} className="p-1 hover:bg-slate-100 rounded disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5 text-slate-500" /></button>
          <button type="button" disabled={index === total - 1} onClick={() => onMove(1)} className="p-1 hover:bg-slate-100 rounded disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5 text-slate-500" /></button>
          <button type="button" onClick={() => setExpanded(v => !v)} className="p-1 hover:bg-slate-100 rounded text-slate-500">{expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</button>
          <button type="button" onClick={onRemove} className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-4 grid gap-3">
          {/* ── Text / Heading / Section ── */}
          {(item.type === "heading" || item.type === "text" || item.type === "section") && (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Content</label>
              <input type="text" value={item.content ?? ""} onChange={e => update({ content: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter text..." />
            </div>
          )}

          {/* ── Image ── */}
          {item.type === "image" && (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Image URL</label>
                <input type="text" value={item.imageUrl ?? ""} onChange={e => update({ imageUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-fuchsia-500 outline-none" placeholder="https://..." />
              </div>
              {item.imageUrl && (
                <div className="relative aspect-video w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                   <img src={item.imageUrl} alt="Preview" className="w-full h-full object-contain" />
                </div>
              )}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Caption / Instruction</label>
                <input type="text" value={item.imageCaption ?? ""} onChange={e => update({ imageCaption: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-fuchsia-500 outline-none" placeholder="Summarise the information..." />
              </div>
            </div>
          )}

          {/* ── Question ── */}
          {item.type === "question" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {section !== 'speaking' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Answer Type</label>
                    <select value={item.answer_type ?? "blank"} onChange={e => update({ answer_type: e.target.value as AnswerType, options: [], ids: undefined })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                      <option value="blank">Fill in the Blank</option>
                      <option value="multiple_choice">Multiple Choice (single)</option>
                      <option value="multi_select">Multi-Select (checkboxes)</option>
                      <option value="dropdown">Dropdown (Match to Paragraph)</option>
                      <option value="true_false">True / False / Not Given</option>
                      <option value="yes_no">Yes / No / Not Given</option>
                    </select>
                  </div>
                )}
                {item.answer_type !== "multi_select" ? (
                  <div className={section === 'speaking' ? 'col-span-2' : ''}>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Question #</label>
                    <input type="number" value={item.id ?? ""} onChange={e => update({ id: parseInt(e.target.value) || undefined })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Question IDs</label>
                    <input type="text" value={(item.ids ?? []).join(", ")}
                      onChange={e => update({ ids: e.target.value.split(",").map(v => parseInt(v.trim())).filter(n => !isNaN(n)) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 14, 15" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">{section === 'speaking' ? 'Prompt Text' : 'Label / Text'}</label>
                <input type="text" value={item.label ?? ""} onChange={e => update({ label: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              {item.answer_type === "blank" && section !== 'speaking' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Suffix</label>
                  <input type="text" value={item.suffix ?? ""} onChange={e => update({ suffix: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              )}

              {item.answer_type && item.answer_type !== "blank" && section !== 'speaking' && (
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    {item.answer_type === "dropdown" ? "Dropdown Options (e.g. A, B, C...)" : "Options"}
                  </label>
                  {(item.options ?? []).map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="w-5 text-xs font-bold pt-2">{item.answer_type === "dropdown" ? "" : String.fromCharCode(65 + i)}</span>
                      <input type="text" value={opt} onChange={e => updateOption(i, e.target.value)} className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm" placeholder={item.answer_type === "dropdown" ? "e.g. A" : ""} />
                      <button type="button" onClick={() => removeOption(i)}><Trash2 className="w-3.5 h-3.5 text-slate-300 hover:text-rose-500" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={addOption} className="text-xs font-bold text-blue-600">+ Add Option</button>
                  {item.answer_type === "dropdown" && (item.options ?? []).length === 0 && (
                    <button type="button" onClick={() => update({ options: ["A", "B", "C", "D", "E", "F", "G"] })} className="text-[10px] text-slate-400 hover:text-blue-500 transition-colors ml-4 underline underline-offset-2 font-medium">Quick add A-G</button>
                  )}
                  {item.answer_type === "true_false" && (item.options ?? []).length === 0 && (
                    <button type="button" onClick={() => update({ options: ["TRUE", "FALSE", "NOT GIVEN"] })} className="text-[10px] text-slate-400 hover:text-blue-500 transition-colors ml-4 underline underline-offset-2 font-medium">Quick add T/F/NG</button>
                  )}
                  {item.answer_type === "yes_no" && (item.options ?? []).length === 0 && (
                    <button type="button" onClick={() => update({ options: ["YES", "NO", "NOT GIVEN"] })} className="text-[10px] text-slate-400 hover:text-blue-500 transition-colors ml-4 underline underline-offset-2 font-medium">Quick add Y/N/NG</button>
                  )}
                </div>
              )}

              {section !== 'speaking' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Correct Answer</label>
                  <input type="text" value={item.correctAnswer ?? ""} onChange={e => update({ correctAnswer: e.target.value })}
                    className="w-full px-3 py-2 border border-emerald-100 bg-emerald-50/30 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              )}
            </div>
          )}

          {/* ── Table ── */}
          {item.type === "table" && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Column Headers</label>
                <div className="flex flex-wrap gap-2">
                  {(item.headers ?? []).map((h, i) => (
                    <div key={i} className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg pr-1">
                      <input type="text" value={h} onChange={e => {
                        const h2 = [...(item.headers ?? [])]; h2[i] = e.target.value; update({ headers: h2 });
                      }} className="px-2 py-1 text-xs outline-none bg-transparent w-24 font-bold" />
                      <button type="button" onClick={() => {
                        const h2 = [...(item.headers ?? [])]; h2.splice(i, 1);
                        const r2 = (item.rows ?? []).map(r => ({ cells: r.cells.filter((_, idx) => idx !== i) }));
                        update({ headers: h2, rows: r2 });
                      }} className="p-1 text-slate-300 hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => {
                    const h2 = [...(item.headers ?? []), "New Col"];
                    const r2 = (item.rows ?? []).map(r => ({ cells: [...r.cells, { content: "" }] }));
                    update({ headers: h2, rows: r2 });
                  }} className="text-xs font-bold text-blue-600 px-2 py-1">+ Add Column</button>
                </div>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="w-8"></th>
                      {(item.headers ?? []).map((h, i) => <th key={i} className="px-3 py-2 text-left text-[10px] text-slate-400 uppercase font-black">{h}</th>)}
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(item.rows ?? []).map((row, ri) => (
                      <tr key={ri}>
                        <td className="text-center text-[10px] text-slate-300 font-mono">{ri + 1}</td>
                        {row.cells.map((cell, ci) => (
                          <td key={ci} className="px-1 py-1">
                            <textarea value={cell.content} onChange={e => {
                              const r2 = [...(item.rows ?? [])]; r2[ri].cells[ci].content = e.target.value; update({ rows: r2 });
                            }} className="w-full p-2 border border-transparent hover:border-slate-100 rounded text-xs outline-none focus:bg-white resize-none" rows={2} />
                          </td>
                        ))}
                        <td className="text-center">
                          <button type="button" onClick={() => { const r2 = [...(item.rows ?? [])]; r2.splice(ri, 1); update({ rows: r2 }); }}><Trash2 className="w-3.5 h-3.5 text-slate-200 hover:text-rose-500" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button type="button" onClick={() => update({ rows: [...(item.rows ?? []), { cells: (item.headers ?? []).map(() => ({ content: "" })) }] })}
                  className="w-full py-2 text-xs font-bold text-slate-400 hover:bg-slate-50">+ Add Row</button>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 italic px-1">Tip: Use <b>[q:number]</b> inside cells for question inputs (e.g. <b>wide range of [q:4]</b>)</p>

              {/* Table Question Correct Answers */}
              {(() => {
                const ids: number[] = [];
                (item.rows ?? []).forEach(r => r.cells.forEach(c => {
                  const m = (c.content || "").match(/\[q:(\d+)\]/g);
                  if (m) m.forEach(s => {
                    const n = s.match(/\d+/);
                    if (n) ids.push(parseInt(n[0]));
                  });
                }));
                const uniqueIds = Array.from(new Set(ids)).sort((a, b) => a - b);
                if (uniqueIds.length === 0) return null;

                return (
                  <div className="mt-4 p-3 bg-white border border-slate-200 rounded-xl space-y-3">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Table Question Answers</label>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {uniqueIds.map(id => {
                        const existing = (item.tableQuestions ?? []).find(q => q.id === id);
                        return (
                          <div key={id} className="flex items-center gap-2">
                             <span className="w-6 h-6 flex items-center justify-center bg-sky-100 text-sky-700 rounded text-[10px] font-bold shrink-0">{id}</span>
                             <input 
                               type="text" 
                               value={existing?.correctAnswer ?? ""} 
                               onChange={e => {
                                 const tq = [...(item.tableQuestions ?? [])];
                                 const idx = tq.findIndex(q => q.id === id);
                                 if (idx >= 0) tq[idx] = { ...tq[idx], correctAnswer: e.target.value };
                                 else tq.push({ id, correctAnswer: e.target.value });
                                 update({ tableQuestions: tq });
                               }}
                               className="flex-1 px-2 py-1 border border-slate-200 rounded text-[11px] focus:ring-1 focus:ring-sky-500 outline-none"
                               placeholder="Correct answer..."
                             />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── Matching Group ── */}
          {item.type === "matching_group" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={item.optionsTitle ?? ""} onChange={e => update({ optionsTitle: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" placeholder="Options Title" />
                <input type="text" value={item.title ?? ""} onChange={e => update({ title: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" placeholder="Questions Title" />
              </div>
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Options (A, B, C...)</label>
                {(item.matchOptions ?? []).map((o, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="w-5 font-bold pt-2">{o.letter}</span>
                    <input type="text" value={o.text} onChange={e => updateMatchOption(i, e.target.value)} className="flex-1 px-3 py-1.5 border rounded-lg text-sm" />
                    <button type="button" onClick={() => removeMatchOption(i)}><Trash2 className="w-3.5 h-3.5 text-slate-300" /></button>
                  </div>
                ))}
                <button type="button" onClick={addMatchOption} className="text-xs font-bold text-blue-600">+ Add Option</button>
              </div>
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Questions</label>
                {(item.questions ?? []).map((q, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="w-6 font-bold pt-2">{q.id}</span>
                    <input type="text" value={q.label} onChange={e => updateMatchQuestion(i, { label: e.target.value })} className="flex-1 px-3 py-1.5 border rounded-lg text-sm" />
                    <select value={q.correctAnswer} onChange={e => updateMatchQuestion(i, { correctAnswer: e.target.value })} className="w-16 border rounded-lg text-sm font-bold">
                      <option value="">Ans</option>
                      {(item.matchOptions ?? []).map(o => <option key={o.letter} value={o.letter}>{o.letter}</option>)}
                    </select>
                    <button type="button" onClick={() => removeMatchQuestion(i)}><Trash2 className="w-3.5 h-3.5 text-slate-300" /></button>
                  </div>
                ))}
                <button type="button" onClick={addMatchQuestion} className="text-xs font-bold text-orange-600">+ Add Question</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const ADD_TYPES: { type: ItemType; label: string; desc: string }[] = [
  { type: "question",       label: "Question",       desc: "Blank, MC, or multi-select" },
  { type: "matching_group", label: "Matching Group", desc: "Option bank + dropdowns" },
  { type: "table",          label: "Table",          desc: "Multi-column summary table" },
  { type: "heading",        label: "Heading",        desc: "Bold title block" },
  { type: "section",        label: "Section",        desc: "Underlined sub-header" },
  { type: "text",           label: "Text",           desc: "Plain info line" },
  { type: "image",          label: "Image/Graph",    desc: "Display a graph or visual aid" },
];

export default function PartItemsBuilder({ partJson, onChange, section }: Props) {
  const [items, setItems] = useState<PartItem[]>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // Close add-menu when clicking outside
  useEffect(() => {
    if (!showAddMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showAddMenu]);

  useEffect(() => {
    setItems(parseItems(partJson));
  }, [partJson]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const updated = serializeItems(partJson, items);
    if (updated !== partJson) {
      onChange(updated);
    }
  }, [items]);

  const commit = (updated: PartItem[]) => {
    setItems(updated);
    onChange(serializeItems(partJson, updated));
  };

  const addItem = (type: ItemType) => {
    const base: PartItem = { type };
    if (type === "question") {
      const maxId = items.reduce((m, i) => (i.type === "question" && (i.id ?? 0) > m ? (i.id ?? 0) : m), 0);
      Object.assign(base, { id: maxId + 1, label: "", answer_type: "blank", correctAnswer: "" });
    } else if (type === "matching_group") {
      Object.assign(base, { optionsTitle: "", title: "", matchOptions: [], questions: [] });
    } else if (type === "table") {
      Object.assign(base, { headers: ["Column 1", "Column 2"], rows: [{ cells: [{ content: "" }, { content: "" }] }] });
    } else {
      base.content = "";
    }
    commit([...items, base]);
    setShowAddMenu(false);
  };

  const updateItem = (i: number, u: PartItem) => { const n = [...items]; n[i] = u; commit(n); };
  const removeItem = (i: number) => { const n = [...items]; n.splice(i, 1); commit(n); };
  const moveItem = (i: number, dir: -1 | 1) => {
    const n = [...items]; const j = i + dir;
    if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j], n[i]]; commit(n);
  };

  const questionCount = items.reduce((count, item) => {
    if (item.type === "question") return count + 1;
    if (item.type === "matching_group") return count + (item.questions?.length ?? 0);
    if (item.type === "table") {
      const ids: number[] = [];
      (item.rows ?? []).forEach(r => r.cells.forEach(c => {
        const m = (c.content || "").match(/\[q:\d+\]/g);
        if (m) m.forEach(s => {
          const n = s.match(/\d+/);
          if (n) ids.push(parseInt(n[0]));
        });
      }));
      return count + (new Set(ids).size);
    }
    return count;
  }, 0);

  // Global next question ID — looks across ALL items and all matching group sub-questions
  const globalNextId = items.reduce((m, it) => {
    if (it.type === "question") return Math.max(m, it.id ?? 0);
    if (it.type === "matching_group") {
      const mgMax = (it.questions ?? []).reduce((mm: number, q: MatchingQuestion) => Math.max(mm, q.id ?? 0), 0);
      return Math.max(m, mgMax);
    }
    if (it.type === "table") {
      const tMax = (it.tableQuestions ?? []).reduce((tm, q) => Math.max(tm, q.id), 0);
      return Math.max(m, tMax);
    }
    return m;
  }, 0) + 1;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
        <div>
          <h2 className="font-bold text-slate-800 text-sm">Visual Question Builder</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {questionCount} question{questionCount !== 1 ? "s" : ""} · {items.length} items
            <span className="ml-2 text-slate-300">• Syncs with JSON Editor above</span>
          </p>
        </div>
        <div className="relative" ref={menuRef}>
          <button type="button" onClick={() => setShowAddMenu(v => !v)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-sm shadow-blue-500/20">
            <Plus className="w-3.5 h-3.5" /> Add Item
          </button>
          {showAddMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 z-30 overflow-hidden">
              {ADD_TYPES
                .filter(t => section === 'speaking' ? ["heading", "text", "question"].includes(t.type) : true)
                .map(({ type, label, desc }) => {
                const m = TYPE_META[type];
                return (
                  <button key={type} type="button" onClick={() => addItem(type)}
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded border mt-0.5 shrink-0 ${m.color}`}>{m.icon} {label}</span>
                    <span className="text-xs text-slate-500">{desc}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-3xl mb-2">📋</div>
            <p className="text-sm font-bold text-slate-400">No items yet</p>
            <p className="text-xs text-slate-300 mt-1">Click "Add Item" to build this part</p>
          </div>
        ) : (
          items.map((item, idx) => (
            <ItemCard key={idx} item={item} index={idx} total={items.length}
              globalNextId={globalNextId}
              section={section}
              onUpdate={u => updateItem(idx, u)} onRemove={() => removeItem(idx)} onMove={dir => moveItem(idx, dir)} />
          ))
        )}
      </div>
    </div>
  );
}
