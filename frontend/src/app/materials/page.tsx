"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FolderOpen,
  Upload,
  FileText,
  Video,
  Link2,
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Eye,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { materialsApi } from "@/lib/api";
import type { Material } from "@/types";

const typeIcon: Record<string, React.ElementType> = {
  PDF: FileText,
  "图片": Link2,  // 图标占位（lucide 无单独 Image 名避免冲突）
  "视频": Video,
  "链接": Link2,
};

const SUBJECT_OPTIONS: Array<{ id: number | null; label: string }> = [
  { id: null, label: "全部" },
  { id: 1, label: "政治" },
  { id: 2, label: "英一" },
  { id: 3, label: "数一" },
  { id: 4, label: "408" },
];

// 标签 → 后端 resolveTypePrefix 做 MIME 前缀映射（PDF/IMAGE/VIDEO/DOC/DOCX/TEXT）
const TYPE_OPTIONS: Array<{ value: string | null; label: string }> = [
  { value: null, label: "全部" },
  { value: "PDF", label: "PDF" },
  { value: "IMAGE", label: "图片" },
  { value: "VIDEO", label: "视频" },
  { value: "DOC", label: "Word" },
];

export default function MaterialsPage() {
  const router = useRouter();
  const [dragActive, setDragActive] = useState(false);
  const [items, setItems] = useState<Material[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    const params: { subjectId?: number; type?: string } = {};
    if (subjectId !== null) params.subjectId = subjectId;
    if (typeFilter !== null) params.type = typeFilter;
    materialsApi
      .list(Object.keys(params).length ? params : undefined)
      .then((res) => {
        if (!cancelled) setItems(res.data);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [subjectId, typeFilter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((m) => (m.title + " " + (m.description || "")).toLowerCase().includes(q));
  }, [items, query]);

  async function uploadFile(file: File) {
    if (isUploading) return;  // 防快速重复点击/拖拽
    setIsUploading(true);
    setUploadError(null);
    const form = new FormData();
    form.append("file", file);
    form.append("title", file.name);
    try {
      const res = await materialsApi.upload(form);
      setItems((prev) => [res.data, ...prev]);
    } catch (e: unknown) {
      // 后端返回 413 / 415 / 500 等都走这里;改为 inline error,不再阻塞 UI
      const msg = (e as { message?: string })?.message || "上传失败";
      setUploadError(msg);
    } finally {
      setIsUploading(false);
      // 清空 input value 让用户能重新选同一个文件再传
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FolderOpen className="w-7 h-7 text-blue-400" />
            资料库
          </h1>
          <p className="text-gray-400 mt-1">上传和管理你的学习资料</p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Plus className="w-4 h-4 mr-2" />
          {isUploading ? "上传中…" : "添加资料"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadFile(file);
          }}
        />
      </div>

      {/* Upload area */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          dragActive ? "border-blue-500/50 bg-blue-500/5" : "border-white/[0.08]"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          const file = e.dataTransfer.files?.[0];
          if (file) uploadFile(file);
        }}
      >
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-500/10 flex items-center justify-center">
            <Upload className="w-8 h-8 text-blue-400" />
          </div>
          <p className="text-gray-300 font-medium mb-1">拖拽文件到此处上传</p>
          <p className="text-sm text-gray-500 mb-4">支持 PDF、Word、图片等格式,单文件最大 50MB</p>
          <Button
            variant="outline"
            className="border-white/[0.08]"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? "上传中…" : "选择文件"}
          </Button>
          {uploadError && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {uploadError}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search and filter */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="搜索资料..."
              className="pl-9 bg-white/5 border-white/[0.08]"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            className={`border-white/[0.08] ${
              showFilter || subjectId !== null || typeFilter !== null
                ? "text-blue-400 bg-blue-500/10"
                : "text-gray-400"
            }`}
            onClick={() => setShowFilter((v) => !v)}
          >
            <Filter className="w-4 h-4 mr-2" />
            筛选
            {(subjectId !== null || typeFilter !== null) && (
              <span className="ml-2 inline-flex items-center justify-center w-4 h-4 text-[10px] rounded-full bg-blue-500 text-white">
                {(subjectId !== null ? 1 : 0) + (typeFilter !== null ? 1 : 0)}
              </span>
            )}
          </Button>
        </div>

        {showFilter && (
          <Card className="border-white/[0.06] bg-white/[0.02]">
            <CardContent className="p-4 space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-2">学科</p>
                <div className="flex flex-wrap gap-2">
                  {SUBJECT_OPTIONS.map((opt) => {
                    const active = subjectId === opt.id;
                    return (
                      <button
                        key={`s-${opt.id ?? "all"}`}
                        onClick={() => setSubjectId(opt.id)}
                        className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                          active
                            ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                            : "bg-white/5 border-white/[0.08] text-gray-400 hover:text-gray-200"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">类型</p>
                <div className="flex flex-wrap gap-2">
                  {TYPE_OPTIONS.map((opt) => {
                    const active = typeFilter === opt.value;
                    return (
                      <button
                        key={`t-${opt.value ?? "all"}`}
                        onClick={() => setTypeFilter(opt.value)}
                        className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                          active
                            ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                            : "bg-white/5 border-white/[0.08] text-gray-400 hover:text-gray-200"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Materials list */}
      <div className="space-y-2">
        {isLoading ? (
          <Card className="border-white/[0.06]">
            <CardContent className="p-4 text-gray-500">加载中…</CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="border-white/[0.06]">
            <CardContent className="p-10 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                <FolderOpen className="w-8 h-8 text-blue-400" />
              </div>
              <p className="text-gray-300 font-medium mb-1">
                {(subjectId !== null || typeFilter !== null || query)
                  ? "没有符合条件的资料"
                  : "暂无资料"}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                {(subjectId !== null || typeFilter !== null || query)
                  ? "尝试清除筛选或换个关键词"
                  : "点击右上角\"添加资料\"或拖拽文件到上方区域开始"}
              </p>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                立即上传
              </Button>
            </CardContent>
          </Card>
        ) : (
          filtered.map((material) => {
          // M2 修复：之前硬写 typeIcon["PDF"]，所有资料都用 PDF 图标。
          // 现按 MIME 大类映射：image/* → 图片图标、video/* → 视频图标、其余文件
          const Icon = material.type?.startsWith("image/")
            ? typeIcon["图片"] ?? FileText
            : material.type?.startsWith("video/")
            ? typeIcon["视频"] ?? FileText
            : material.type === "application/pdf"
            ? typeIcon["PDF"] ?? FileText
            : FileText;
          const sizeMb = material.fileSize ? `${(material.fileSize / (1024 * 1024)).toFixed(1)} MB` : "-";
          return (
            <Card key={material.id} className="border-white/[0.06] hover:border-white/[0.12] transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{material.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">{material.type}</span>
                    <span className="text-xs text-gray-500">{sizeMb}</span>
                    <span className="text-xs text-gray-500">{new Date(material.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-gray-300 h-8 w-8 p-0 disabled:opacity-40"
                    title={material.fileUrl ? "查看" : "暂无文件"}
                    aria-label={material.fileUrl ? "查看资料" : "暂无文件"}
                    disabled={!material.fileUrl}
                    onClick={() => window.open(material.fileUrl!, "_blank")}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-gray-300 h-8 w-8 p-0 disabled:opacity-40"
                    title={material.fileUrl ? "在新标签页打开" : "暂无文件"}
                    aria-label={material.fileUrl ? "在新标签页打开" : "暂无文件"}
                    disabled={!material.fileUrl}
                    onClick={() => window.open(material.fileUrl!, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-purple-400 h-8 w-8 p-0"
                    onClick={() => router.push(`/materials/import/${material.id}`)}
                    title="AI 导入"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-red-400 h-8 w-8 p-0"
                    onClick={async () => {
                      // M3 修复：删文件不可逆，加确认
                      if (!window.confirm(`确认删除「${material.title}」？文件将从存储中移除且不可恢复。`)) {
                        return;
                      }
                      try {
                        await materialsApi.delete(material.id);
                        setItems((prev) => prev.filter((x) => x.id !== material.id));
                      } catch (e: unknown) {
                        const msg = (e as { message?: string })?.message || "删除失败";
                        setUploadError(msg);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })
        )}
      </div>
    </div>
  );
}
