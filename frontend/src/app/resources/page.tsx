"use client";

import React from "react";
import {
  BookOpen,
  Video,
  FileText,
  Code2,
  ExternalLink,
  Library,
  Info,
  GraduationCap,
  Globe,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// ──────────────────────────────────────────────────────────
// 数据模型
// ──────────────────────────────────────────────────────────
type LinkKind = "video" | "book" | "code" | "site";

interface ResourceLink {
  title: string;
  desc: string;
  url?: string; // 没有可信 URL 则不写，不捏造
  kind: LinkKind;
}

interface ResourceGroup {
  label: string;
  icon: React.ElementType;
  items: ResourceLink[];
}

interface SubjectBlock {
  id: string;
  name: string;
  desc: string;
  /** Tailwind 颜色基色，例如 red / blue / green / purple */
  tone: "red" | "blue" | "green" | "purple" | "slate";
  groups: ResourceGroup[];
}

// ──────────────────────────────────────────────────────────
// 通用资源（置顶提示卡之下、tab 之上独立呈现）
// ──────────────────────────────────────────────────────────
const COMMON_LINKS: ResourceLink[] = [
  {
    title: "中国研究生招生信息网（研招网）",
    desc: "教育部官方研招报名 / 调剂 / 院校查询门户。",
    url: "https://yz.chsi.com.cn/",
    kind: "site",
  },
  {
    title: "全国硕士研究生招生考试公告与大纲",
    desc: "研招网年度考试公告与考试大纲入口（每年更新）。",
    url: "https://yz.chsi.com.cn/kyzx/",
    kind: "site",
  },
  {
    title: "中国考研网",
    desc: "民间考研资讯门户，含历年信息整理。",
    url: "https://www.chinakaoyan.com/",
    kind: "site",
  },
  {
    title: "学信网（学籍学历查询）",
    desc: "学籍 / 学历 / 在线验证报告官方查询。",
    url: "https://www.chsi.com.cn/",
    kind: "site",
  },
];

// ──────────────────────────────────────────────────────────
// 学科资源
// ──────────────────────────────────────────────────────────
const SUBJECTS: SubjectBlock[] = [
  // ── 政治 ──
  {
    id: "politics",
    name: "政治",
    desc: "马原 / 毛中特 / 史纲 / 思修法基 / 形势与政策。建议跟随主流名师体系做时政与冲刺。",
    tone: "red",
    groups: [
      {
        label: "视频课程",
        icon: Video,
        items: [
          {
            title: "B 站搜索：肖秀荣 考研政治",
            desc: "B 站搜索结果页，覆盖肖秀荣公开课、答疑切片、近年时政解读。",
            url: "https://search.bilibili.com/all?keyword=%E8%82%96%E7%A7%80%E8%8D%A3%20%E8%80%83%E7%A0%94%E6%94%BF%E6%B2%BB",
            kind: "video",
          },
          {
            title: "B 站搜索：徐涛 冲刺班",
            desc: "B 站搜索结果页，含强化班、冲刺背诵、考前点题相关公开内容。",
            url: "https://search.bilibili.com/all?keyword=%E5%BE%90%E6%B6%9B%20%E8%80%83%E7%A0%94%E6%94%BF%E6%B2%BB",
            kind: "video",
          },
          {
            title: "B 站搜索：腿姐 政治技巧班",
            desc: "B 站搜索结果，覆盖陆寓丰技巧班 / 选择题方法论公开切片。",
            url: "https://search.bilibili.com/all?keyword=%E8%85%BF%E5%A7%90%20%E6%94%BF%E6%B2%BB",
            kind: "video",
          },
        ],
      },
      {
        label: "真题与题库",
        icon: FileText,
        items: [
          {
            title: "GitHub 搜索：考研政治 真题 / 题库",
            desc: "GitHub 仓库搜索入口，按 stars 可筛选社区整理的题库与笔记。",
            url: "https://github.com/search?q=%E8%80%83%E7%A0%94%E6%94%BF%E6%B2%BB+%E7%9C%9F%E9%A2%98&type=repositories",
            kind: "code",
          },
        ],
      },
      {
        label: "官方资源",
        icon: Globe,
        items: [
          {
            title: "教育部考试中心 / 政治考试大纲",
            desc: "每年由高等教育出版社出版的官方政治考试大纲；以官方公告为准，本页不外链盗版资源。",
            kind: "book",
          },
          {
            title: "人民网 - 时政频道",
            desc: "权威主流媒体时政原文，作为形势与政策一手资料来源。",
            url: "https://politics.people.com.cn/",
            kind: "site",
          },
        ],
      },
    ],
  },

  // ── 英语一 ──
  {
    id: "english",
    name: "英语一",
    desc: "完形 / 阅读 / 新题型 / 翻译 / 写作。核心是真题精读与长难句训练。",
    tone: "blue",
    groups: [
      {
        label: "视频课程",
        icon: Video,
        items: [
          {
            title: "B 站搜索：唐迟 阅读",
            desc: "B 站搜索结果页，含阅读方法论、逻辑分析公开课切片。",
            url: "https://search.bilibili.com/all?keyword=%E5%94%90%E8%BF%9F%20%E9%98%85%E8%AF%BB",
            kind: "video",
          },
          {
            title: "B 站搜索：何凯文 长难句",
            desc: "B 站搜索结果页，长难句拆解与每日一句相关公开内容。",
            url: "https://search.bilibili.com/all?keyword=%E4%BD%95%E5%87%AF%E6%96%87%20%E9%95%BF%E9%9A%BE%E5%8F%A5",
            kind: "video",
          },
          {
            title: "B 站搜索：田静 语法",
            desc: "B 站搜索结果页，句句真研 / 基础语法公开内容。",
            url: "https://search.bilibili.com/all?keyword=%E7%94%B0%E9%9D%99%20%E8%AF%AD%E6%B3%95",
            kind: "video",
          },
        ],
      },
      {
        label: "真题与题库",
        icon: FileText,
        items: [
          {
            title: "China Daily（中国日报英文版）",
            desc: "考研英语阅读题源之一，原文风格与考研一致，适合外刊精读。",
            url: "https://www.chinadaily.com.cn/",
            kind: "site",
          },
          {
            title: "The Economist 官网",
            desc: "考研英语真题阅读高频题源（注意官方付费墙）。",
            url: "https://www.economist.com/",
            kind: "site",
          },
          {
            title: "GitHub 搜索：考研英语 真题 / 词汇",
            desc: "GitHub 社区整理的词频表 / 真题文本 / Anki 牌组等。",
            url: "https://github.com/search?q=%E8%80%83%E7%A0%94%E8%8B%B1%E8%AF%AD+%E7%9C%9F%E9%A2%98&type=repositories",
            kind: "code",
          },
        ],
      },
      {
        label: "官方资源",
        icon: Globe,
        items: [
          {
            title: "全国硕士研究生招生考试英语（一）大纲",
            desc: "由高等教育出版社年度出版，以官方公告与正版书籍为准。",
            kind: "book",
          },
        ],
      },
    ],
  },

  // ── 数学一 ──
  {
    id: "math",
    name: "数学一",
    desc: "高等数学 / 线性代数 / 概率论与数理统计。重在概念、计算量与综合题训练。",
    tone: "green",
    groups: [
      {
        label: "视频课程",
        icon: Video,
        items: [
          {
            title: "B 站搜索：张宇 高等数学",
            desc: "B 站搜索结果页，含张宇基础班 / 强化班 / 18 讲相关公开切片。",
            url: "https://search.bilibili.com/all?keyword=%E5%BC%A0%E5%AE%87%20%E9%AB%98%E6%95%B0",
            kind: "video",
          },
          {
            title: "B 站搜索：汤家凤 高等数学",
            desc: "B 站搜索结果页，含汤家凤基础班、零基础入门公开内容。",
            url: "https://search.bilibili.com/all?keyword=%E6%B1%A4%E5%AE%B6%E5%87%A4%20%E9%AB%98%E6%95%B0",
            kind: "video",
          },
          {
            title: "MIT OCW 18.01 Single Variable Calculus",
            desc: "MIT 单变量微积分公开课，英文教材 + 视频 + 习题，体系扎实。",
            url: "https://ocw.mit.edu/courses/18-01-single-variable-calculus-fall-2010/",
            kind: "video",
          },
          {
            title: "MIT OCW 18.06 Linear Algebra（Gilbert Strang）",
            desc: "Strang 教授线性代数经典公开课，强烈推荐对照学习矩阵几何直觉。",
            url: "https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/",
            kind: "video",
          },
        ],
      },
      {
        label: "真题与题库",
        icon: FileText,
        items: [
          {
            title: "GitHub 搜索：考研数学 笔记 / 真题",
            desc: "GitHub 上的考研数学笔记 / 题目整理仓库聚合。",
            url: "https://github.com/search?q=%E8%80%83%E7%A0%94%E6%95%B0%E5%AD%A6+%E7%AC%94%E8%AE%B0&type=repositories",
            kind: "code",
          },
        ],
      },
      {
        label: "官方资源",
        icon: Globe,
        items: [
          {
            title: "同济大学《高等数学》第七版",
            desc: "考研数学一最主流参考教材之一；请通过正规渠道购买正版。",
            kind: "book",
          },
          {
            title: "全国硕士研究生招生考试数学（一）大纲",
            desc: "高等教育出版社官方出版，以年度大纲与考试中心公告为准。",
            kind: "book",
          },
        ],
      },
    ],
  },

  // ── 408 ──
  {
    id: "cs408",
    name: "408 计算机",
    desc: "数据结构 / 计算机组成原理 / 操作系统 / 计算机网络。核心是王道四件套与历年真题。",
    tone: "purple",
    groups: [
      {
        label: "视频课程",
        icon: Video,
        items: [
          {
            title: "B 站搜索：王道 数据结构",
            desc: "王道 408 数据结构公开课搜索结果页。",
            url: "https://search.bilibili.com/all?keyword=%E7%8E%8B%E9%81%93%20%E6%95%B0%E6%8D%AE%E7%BB%93%E6%9E%84",
            kind: "video",
          },
          {
            title: "B 站搜索：王道 计算机组成原理",
            desc: "王道 408 计算机组成原理公开课搜索结果页。",
            url: "https://search.bilibili.com/all?keyword=%E7%8E%8B%E9%81%93%20%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BB%84%E6%88%90%E5%8E%9F%E7%90%86",
            kind: "video",
          },
          {
            title: "B 站搜索：王道 操作系统",
            desc: "王道 408 操作系统公开课搜索结果页。",
            url: "https://search.bilibili.com/all?keyword=%E7%8E%8B%E9%81%93%20%E6%93%8D%E4%BD%9C%E7%B3%BB%E7%BB%9F",
            kind: "video",
          },
          {
            title: "B 站搜索：王道 计算机网络",
            desc: "王道 408 计算机网络公开课搜索结果页。",
            url: "https://search.bilibili.com/all?keyword=%E7%8E%8B%E9%81%93%20%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C",
            kind: "video",
          },
          {
            title: "中国大学 MOOC（icourse163）",
            desc: "搜索哈工大《计算机组成原理》、浙大《数据结构》等高校公开课，体系完备。",
            url: "https://www.icourse163.org",
            kind: "video",
          },
          {
            title: "MIT 6.S081 Operating System Engineering",
            desc: "MIT 操作系统工程课程，xv6 实验著名课程，进阶强烈推荐。",
            url: "https://pdos.csail.mit.edu/6.S081/",
            kind: "video",
          },
        ],
      },
      {
        label: "真题与题库",
        icon: FileText,
        items: [
          {
            title: "LeetCode 数据结构题单",
            desc: "LeetCode 中国区，配合王道数据结构刷题验证。",
            url: "https://leetcode.cn/",
            kind: "site",
          },
          {
            title: "GitHub 搜索：408 真题",
            desc: "GitHub 上 408 历年真题与题解整理仓库聚合。",
            url: "https://github.com/search?q=408+%E7%9C%9F%E9%A2%98&type=repositories",
            kind: "code",
          },
        ],
      },
      {
        label: "官方资源",
        icon: Globe,
        items: [
          {
            title: "王道论坛 / 王道在线",
            desc: "王道官方公开内容入口，含部分免费资料与勘误。",
            url: "https://www.cskaoyan.com/",
            kind: "site",
          },
          {
            title: "《2024 年王道 408 复习指导》四件套",
            desc: "考研 408 主流复习资料；请通过正规渠道购买正版。",
            kind: "book",
          },
        ],
      },
      {
        label: "优质 GitHub 仓库",
        icon: Code2,
        items: [
          {
            title: "CyC2018 / CS-Notes",
            desc: "经典 CS 基础笔记，覆盖操作系统 / 网络 / 数据结构等高频主题。",
            url: "https://github.com/CyC2018/CS-Notes",
            kind: "code",
          },
          {
            title: "GitHub Topic：考研 408",
            desc: "GitHub topic 聚合页，可发现新仓库与社区整理。",
            url: "https://github.com/topics/408",
            kind: "code",
          },
          {
            title: "GitHub 搜索：408 复习 / 笔记",
            desc: "按关键词搜索高 stars 的 408 复习仓库。",
            url: "https://github.com/search?q=408+%E5%A4%8D%E4%B9%A0&type=repositories",
            kind: "code",
          },
        ],
      },
    ],
  },
];

// ──────────────────────────────────────────────────────────
// 样式工具：基于 tone 生成颜色 class
// ──────────────────────────────────────────────────────────
const TONE: Record<
  SubjectBlock["tone"],
  { dot: string; ring: string; chip: string; text: string; soft: string }
> = {
  red: {
    dot: "bg-red-500",
    ring: "ring-red-500/30",
    chip: "bg-red-500/10 text-red-300 border-red-500/20",
    text: "text-red-300",
    soft: "from-red-500/10 to-transparent",
  },
  blue: {
    dot: "bg-blue-500",
    ring: "ring-blue-500/30",
    chip: "bg-blue-500/10 text-blue-300 border-blue-500/20",
    text: "text-blue-300",
    soft: "from-blue-500/10 to-transparent",
  },
  green: {
    dot: "bg-green-500",
    ring: "ring-green-500/30",
    chip: "bg-green-500/10 text-green-300 border-green-500/20",
    text: "text-green-300",
    soft: "from-green-500/10 to-transparent",
  },
  purple: {
    dot: "bg-purple-500",
    ring: "ring-purple-500/30",
    chip: "bg-purple-500/10 text-purple-300 border-purple-500/20",
    text: "text-purple-300",
    soft: "from-purple-500/10 to-transparent",
  },
  slate: {
    dot: "bg-slate-500",
    ring: "ring-slate-500/30",
    chip: "bg-slate-500/10 text-slate-300 border-slate-500/20",
    text: "text-slate-300",
    soft: "from-slate-500/10 to-transparent",
  },
};

const KIND_ICON: Record<LinkKind, React.ElementType> = {
  video: Video,
  book: BookOpen,
  code: Code2,
  site: ExternalLink,
};

// ──────────────────────────────────────────────────────────
// 子组件：单个外链卡片
// ──────────────────────────────────────────────────────────
function LinkCard({
  item,
  tone,
}: {
  item: ResourceLink;
  tone: SubjectBlock["tone"];
}) {
  const Icon = KIND_ICON[item.kind];
  const t = TONE[tone];
  const hasUrl = Boolean(item.url);

  const handleOpen = () => {
    if (item.url) {
      window.open(item.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]",
        "hover:bg-white/[0.04] hover:border-white/[0.12] transition-colors duration-200"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border border-white/[0.08]",
            "bg-white/[0.03]"
          )}
        >
          <Icon className={cn("w-4 h-4", t.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-gray-100 leading-snug">
              {item.title}
            </h4>
            {!hasUrl && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 border-amber-500/30 text-amber-300 bg-amber-500/10"
              >
                仅说明
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-400 leading-relaxed line-clamp-3">
            {item.desc}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto">
        <span className="text-[11px] text-gray-500 truncate max-w-[60%]">
          {item.url
            ? new URL(item.url).hostname.replace(/^www\./, "")
            : "暂无可信 URL"}
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={!hasUrl}
          onClick={handleOpen}
          className={cn(
            "h-7 px-2.5 text-xs gap-1.5 border-white/10 text-gray-200",
            "hover:bg-white/5 hover:text-white",
            !hasUrl && "opacity-50 cursor-not-allowed"
          )}
        >
          跳转
          <ExternalLink className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// 子组件：学科区块
// ──────────────────────────────────────────────────────────
function SubjectSection({ subject }: { subject: SubjectBlock }) {
  const t = TONE[subject.tone];
  const totalLinks = subject.groups.reduce(
    (s, g) => s + g.items.length,
    0
  );

  return (
    <div className="space-y-6">
      {/* 学科卡 */}
      <Card
        className={cn(
          "border-white/[0.06] bg-gradient-to-br to-[#0a0a0f]",
          t.soft
        )}
      >
        <CardContent className="flex items-center gap-4 py-5">
          <div
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-xl ring-1",
              "bg-white/[0.04]",
              t.ring
            )}
          >
            <GraduationCap className={cn("w-6 h-6", t.text)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white">
                {subject.name}
              </h2>
              <Badge
                variant="outline"
                className={cn("text-[10px] px-1.5 py-0", t.chip)}
              >
                {totalLinks} 个外链
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-400 leading-relaxed">
              {subject.desc}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 各分组 */}
      {subject.groups.map((group) => {
        const GIcon = group.icon;
        return (
          <div key={group.label} className="space-y-3">
            <div className="flex items-center gap-2">
              <GIcon className={cn("w-4 h-4", t.text)} />
              <h3 className="text-sm font-semibold text-gray-200">
                {group.label}
              </h3>
              <span className="text-xs text-gray-500">
                · {group.items.length}
              </span>
              <div className="flex-1 h-px bg-white/[0.06] ml-2" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => (
                <LinkCard key={item.title} item={item} tone={subject.tone} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// 页面主体
// ──────────────────────────────────────────────────────────
export default function ResourcesPage() {
  const totalAll = SUBJECTS.reduce(
    (sum, s) => sum + s.groups.reduce((g, gg) => g + gg.items.length, 0),
    0
  );

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#0a0a0f] text-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
          {/* 页头 */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
                <Library className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">学习资源</h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  按学科精选公开免费资源外链 ·{" "}
                  <span className="text-gray-300">
                    共 {totalAll + COMMON_LINKS.length} 项
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* 免责说明 */}
          <Card className="border-white/[0.06] bg-white/[0.02]">
            <CardContent className="flex gap-3 py-4">
              <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
              <div className="text-xs text-gray-400 leading-relaxed">
                本页所有资源均为外链至公开免费内容（B 站搜索、官方门户、GitHub
                公共仓库、MIT OCW 等），不托管任何受版权保护的视频 / 教材正文。
                如发现链接失效或涉及版权问题，请通过反馈渠道告知，我们会尽快下架或更正。
              </div>
            </CardContent>
          </Card>

          {/* 通用资源 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-300" />
              <h3 className="text-sm font-semibold text-gray-200">
                通用 / 官方门户
              </h3>
              <span className="text-xs text-gray-500">
                · {COMMON_LINKS.length}
              </span>
              <div className="flex-1 h-px bg-white/[0.06] ml-2" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {COMMON_LINKS.map((item) => (
                <LinkCard key={item.title} item={item} tone="slate" />
              ))}
            </div>
          </div>

          {/* 学科 Tabs */}
          <Tabs defaultValue={SUBJECTS[0].id} className="w-full">
            <TabsList className="h-11 bg-white/[0.03] border border-white/[0.06]">
              {SUBJECTS.map((s) => {
                const t = TONE[s.tone];
                return (
                  <TabsTrigger
                    key={s.id}
                    value={s.id}
                    className="gap-2 px-4 data-[state=active]:bg-white/[0.06] data-[state=active]:text-white"
                  >
                    <span
                      className={cn("w-2 h-2 rounded-full", t.dot)}
                      aria-hidden
                    />
                    {s.name}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {SUBJECTS.map((s) => (
              <TabsContent key={s.id} value={s.id} className="mt-6">
                <SubjectSection subject={s} />
              </TabsContent>
            ))}
          </Tabs>

          {/* 页尾 */}
          <Card className="border-white/[0.06] bg-white/[0.02]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-200 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gray-400" />
                如何使用本页
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-400 leading-relaxed space-y-1.5">
              <p>
                · 点击任意卡片右下角的「跳转」按钮，会在新标签页打开外部资源；
              </p>
              <p>
                · 标记为「仅说明」的条目暂未提供 URL，请通过正规渠道（书店 /
                官方公告）获取；
              </p>
              <p>
                · 推荐组合：B 站公开课打底 + 真题精练 + GitHub
                社区笔记查漏，最后回归官方大纲。
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
