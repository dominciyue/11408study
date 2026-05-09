"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FileText, Wand2, ChevronLeft, Check } from "lucide-react";
import { knowledgeApi, topicsApi } from "@/lib/api";
import type { Topic } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type PdfChunk = { content: string; pageNumber?: number; sectionTitle?: string };
type ParseResp = { title?: string; totalPages?: number; chunks: PdfChunk[] };
type ExtractPoint = { title: string; content: string; difficulty?: string };
type ExtractResp = { knowledgePoints: ExtractPoint[]; rawText?: string };

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok || data?.success === false) throw new Error(data?.message || "请求失败");
  return data.data as T;
}

export default function MaterialImportPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const materialId = Number(params.id);

  const [parse, setParse] = useState<ParseResp | null>(null);
  const [selectedChunkIdx, setSelectedChunkIdx] = useState<number | null>(null);
  const [extract, setExtract] = useState<ExtractResp | null>(null);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [subjectName, setSubjectName] = useState("408计算机专业基础");
  const [topicId, setTopicId] = useState<number | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setIsLoading(true);
      try {
        const parsed = await postJson<ParseResp>(`/api/import/materials/${materialId}/parse-pdf`);
        if (!cancelled) {
          setParse(parsed);
          setSelectedChunkIdx(parsed.chunks.length ? 0 : null);
        }
        // 默认加载 408(=4) 的 topics（后续可做 subjectId 选择）
        const t = await topicsApi.listBySubject(4);
        if (!cancelled) {
          setTopics(t.data);
          setTopicId(t.data[0]?.id ?? null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [materialId]);

  const currentChunk = useMemo(() => {
    if (!parse || selectedChunkIdx == null) return null;
    return parse.chunks[selectedChunkIdx] || null;
  }, [parse, selectedChunkIdx]);

  async function doExtract() {
    if (!currentChunk) return;
    setIsExtracting(true);
    try {
      const ex = await postJson<ExtractResp>("/api/import/extract", {
        text: currentChunk.content,
        subject: subjectName,
        topic: topics.find((t) => t.id === topicId)?.name,
      });
      setExtract(ex);
      const init: Record<number, boolean> = {};
      ex.knowledgePoints.forEach((_, i) => (init[i] = true));
      setChecked(init);
    } finally {
      setIsExtracting(false);
    }
  }

  async function doImport() {
    if (!extract || !topicId) return;
    const picked = extract.knowledgePoints.filter((_, i) => checked[i]);
    if (!picked.length) return;
    setIsImporting(true);
    try {
      for (const p of picked) {
        await knowledgeApi.createNode({
          title: p.title,
          content: p.content,
          difficulty: p.difficulty === "HARD" ? 3 : p.difficulty === "MEDIUM" ? 2 : 1,
          topicId,
        });
      }
      router.push("/graph");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-blue-400" />
          <h1 className="text-2xl font-bold text-white">资料导入向导</h1>
          <Badge className="bg-blue-500/20 text-blue-400">PDF → 知识点 → 图谱</Badge>
        </div>
        <Button variant="outline" className="border-white/[0.08] text-gray-200" onClick={() => router.push("/materials")}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          返回资料库
        </Button>
      </div>

      {isLoading ? (
        <Card className="border-white/[0.06]">
          <CardContent className="p-6 text-gray-500">加载中…</CardContent>
        </Card>
      ) : !parse ? (
        <Card className="border-white/[0.06]">
          <CardContent className="p-6 text-gray-500">解析失败或无数据。</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="border-white/[0.06] lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base text-gray-200">
                分块（{parse.chunks.length}）
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {parse.chunks.slice(0, 30).map((c, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className={
                    i === selectedChunkIdx
                      ? "w-full justify-start border-blue-500/40 bg-blue-500/10 text-blue-200"
                      : "w-full justify-start border-white/[0.08] hover:bg-white/10 text-gray-200"
                  }
                  onClick={() => {
                    setSelectedChunkIdx(i);
                    setExtract(null);
                  }}
                >
                  第 {c.pageNumber ?? "?"} 页 {c.sectionTitle ? `· ${c.sectionTitle}` : ""}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/[0.06] lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base text-gray-200">提取与导入</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">学科名（传给 AI 提示用）</div>
                  <Input className="bg-white/5 border-white/[0.08]" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs text-gray-500 mb-1">导入到 Topic</div>
                  <select
                    className="w-full h-10 rounded-md bg-white/5 border border-white/[0.08] text-gray-200 px-3"
                    value={topicId ?? ""}
                    onChange={(e) => setTopicId(Number(e.target.value))}
                  >
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Card className="border-white/[0.06] bg-white/5">
                <CardContent className="p-4 text-sm text-gray-300 whitespace-pre-wrap max-h-56 overflow-auto">
                  {currentChunk?.content || "请选择分块"}
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button className="bg-purple-600 hover:bg-purple-700" disabled={!currentChunk || isExtracting} onClick={doExtract}>
                  <Wand2 className="w-4 h-4 mr-2" />
                  {isExtracting ? "提取中…" : "AI 提取知识点"}
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700" disabled={!extract || isImporting || !topicId} onClick={doImport}>
                  <Check className="w-4 h-4 mr-2" />
                  {isImporting ? "导入中…" : "确认导入到图谱"}
                </Button>
              </div>

              {extract ? (
                <div className="space-y-2">
                  <div className="text-sm text-gray-400">候选知识点（勾选导入）</div>
                  {extract.knowledgePoints.map((p, i) => (
                    <label key={i} className="block p-3 rounded-xl border border-white/[0.06] bg-white/5">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!checked[i]}
                          onChange={(e) => setChecked((prev) => ({ ...prev, [i]: e.target.checked }))}
                        />
                        <span className="text-sm font-medium text-gray-200">{p.title}</span>
                        {p.difficulty ? (
                          <Badge className="bg-white/10 text-gray-300">{p.difficulty}</Badge>
                        ) : null}
                      </div>
                      <div className="text-xs text-gray-400 mt-2 whitespace-pre-wrap line-clamp-4">{p.content}</div>
                    </label>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

