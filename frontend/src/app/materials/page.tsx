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
  "视频": Video,
  "链接": Link2,
};

export default function MaterialsPage() {
  const router = useRouter();
  const [dragActive, setDragActive] = useState(false);
  const [items, setItems] = useState<Material[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    materialsApi
      .list()
      .then((res) => {
        if (!cancelled) setItems(res.data);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((m) => (m.title + " " + (m.description || "")).toLowerCase().includes(q));
  }, [items, query]);

  async function uploadFile(file: File) {
    const form = new FormData();
    form.append("file", file);
    form.append("title", file.name);
    const res = await materialsApi.upload(form);
    setItems((prev) => [res.data, ...prev]);
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
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => fileInputRef.current?.click()}>
          <Plus className="w-4 h-4 mr-2" />
          添加资料
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
          <p className="text-sm text-gray-500 mb-4">支持 PDF、Word、图片等格式，单文件最大 100MB</p>
          <Button variant="outline" className="border-white/[0.08]" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            选择文件
          </Button>
        </CardContent>
      </Card>

      {/* Search and filter */}
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
        <Button variant="outline" className="border-white/[0.08] text-gray-400">
          <Filter className="w-4 h-4 mr-2" />
          筛选
        </Button>
      </div>

      {/* Materials list */}
      <div className="space-y-2">
        {isLoading ? (
          <Card className="border-white/[0.06]">
            <CardContent className="p-4 text-gray-500">加载中…</CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="border-white/[0.06]">
            <CardContent className="p-4 text-gray-500">暂无资料。</CardContent>
          </Card>
        ) : (
          filtered.map((material) => {
          const Icon = typeIcon["PDF"] || FileText;
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
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-300 h-8 w-8 p-0">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-gray-300 h-8 w-8 p-0"
                    onClick={() => window.open(material.fileUrl, "_blank")}
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
                      await materialsApi.delete(material.id);
                      setItems((prev) => prev.filter((x) => x.id !== material.id));
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
