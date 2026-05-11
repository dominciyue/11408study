"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  StickyNote,
  Plus,
  Search,
  Clock,
  Tag,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { notesApi } from "@/lib/api";
import type { Note } from "@/types";

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    notesApi
      .list()
      .then((res) => {
        if (!cancelled) setNotes(res.data);
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
    if (!q) return notes;
    return notes.filter((n) => (n.title + " " + n.content).toLowerCase().includes(q));
  }, [notes, query]);

  async function createNote() {
    const title = window.prompt("标题");
    if (!title) return;
    const content = window.prompt("内容");
    if (!content) return;
    const res = await notesApi.create({ nodeId: 1, title, content });
    setNotes((prev) => [res.data, ...prev]);
  }

  function openEdit(note: Note) {
    setEditing(note);
    setEditTitle(note.title || "");
    setEditContent(note.content || "");
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await notesApi.update(editing.id, {
        title: editTitle,
        content: editContent,
      });
      setNotes((prev) => prev.map((n) => (n.id === editing.id ? res.data : n)));
      setEditing(null);
    } finally {
      setSaving(false);
    }
  }

  async function removeNote(note: Note) {
    if (!window.confirm(`确认删除笔记"${note.title}"？`)) return;
    await notesApi.delete(note.id);
    setNotes((prev) => prev.filter((n) => n.id !== note.id));
  }

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
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={createNote}>
          <Plus className="w-4 h-4 mr-2" />
          新建笔记
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          placeholder="搜索笔记..."
          className="pl-9 bg-white/5 border-white/[0.08]"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <Card className="border-white/[0.06]">
            <CardContent className="p-5 text-gray-500">加载中…</CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="border-white/[0.06]">
            <CardContent className="p-5 text-gray-500">暂无笔记。</CardContent>
          </Card>
        ) : (
          filtered.map((note) => (
          <Card
            key={note.id}
            className="border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer group"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-base font-semibold text-gray-100 group-hover:text-blue-400 transition-colors">
                  {note.title}
                </h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-gray-300 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity data-[state=open]:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-[#0f0f17] border-white/[0.08] text-gray-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenuItem
                      onSelect={() => openEdit(note)}
                      className="cursor-pointer focus:bg-white/[0.06]"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      编辑
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/[0.06]" />
                    <DropdownMenuItem
                      onSelect={() => removeNote(note)}
                      className="cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-300"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="text-sm text-gray-400 line-clamp-2 mb-3">{note.content}</p>
              <div className="flex items-center gap-2 mb-3">
                {note.subjectName ? (
                  <Badge variant="outline" className="text-xs bg-white/5 border-white/[0.08] text-gray-400">
                    <Tag className="w-3 h-3 mr-1" />
                    {note.subjectName}
                  </Badge>
                ) : null}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="text-gray-400">
                  {(note.nodeTitle || note.topicName || "未关联知识点")}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(note.updatedAt).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="bg-[#0f0f17] border-white/[0.08] text-gray-200 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-100">编辑笔记</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">标题</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="bg-white/5 border-white/[0.08]"
                placeholder="笔记标题"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">内容</label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={8}
                className="w-full rounded-md bg-white/5 border border-white/[0.08] text-sm text-gray-200 p-3 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="笔记内容"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-white/[0.08] text-gray-300"
              onClick={() => setEditing(null)}
              disabled={saving}
            >
              取消
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={saveEdit}
              disabled={saving || !editTitle.trim()}
            >
              {saving ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
