"use client";

import React from "react";
import {
  StickyNote,
  Plus,
  Search,
  Clock,
  Tag,
  MoreHorizontal,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const notes = [
  {
    id: 1,
    title: "KMP算法核心思想",
    content: "KMP算法通过构建next数组避免重复比较，时间复杂度O(n+m)...",
    linkedNode: "KMP字符串匹配",
    subject: "数据结构",
    updatedAt: "2小时前",
    tags: ["算法", "字符串"],
  },
  {
    id: 2,
    title: "虚拟内存与页面置换",
    content: "虚拟内存将物理内存扩展到磁盘，常见页面置换算法：FIFO, LRU, OPT...",
    linkedNode: "虚拟内存管理",
    subject: "操作系统",
    updatedAt: "昨天",
    tags: ["内存管理"],
  },
  {
    id: 3,
    title: "TCP拥塞控制四个阶段",
    content: "慢开始、拥塞避免、快重传、快恢复...",
    linkedNode: "TCP拥塞控制",
    subject: "计算机网络",
    updatedAt: "3天前",
    tags: ["TCP", "传输层"],
  },
  {
    id: 4,
    title: "矩阵特征值分解笔记",
    content: "特征值方程 Ax = λx，其中 λ 为特征值，x 为特征向量...",
    linkedNode: "特征值与特征向量",
    subject: "线性代数",
    updatedAt: "1周前",
    tags: ["线性代数", "矩阵"],
  },
];

const subjectColors: Record<string, string> = {
  "数据结构": "text-purple-400",
  "操作系统": "text-purple-400",
  "计算机网络": "text-purple-400",
  "线性代数": "text-green-400",
};

export default function NotesPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <StickyNote className="w-7 h-7 text-blue-400" />
            我的笔记
          </h1>
          <p className="text-gray-400 mt-1">记录学习心得，关联知识图谱</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          新建笔记
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          placeholder="搜索笔记..."
          className="pl-9 bg-white/5 border-white/[0.08]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notes.map((note) => (
          <Card
            key={note.id}
            className="border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer group"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-base font-semibold text-gray-100 group-hover:text-blue-400 transition-colors">
                  {note.title}
                </h3>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-300 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-400 line-clamp-2 mb-3">{note.content}</p>
              <div className="flex items-center gap-2 mb-3">
                {note.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs bg-white/5 border-white/[0.08] text-gray-400">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className={subjectColors[note.subject] || "text-gray-400"}>
                  {note.subject} · {note.linkedNode}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {note.updatedAt}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
