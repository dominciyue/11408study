"use client";

import React from "react";
import {
  BookOpen,
  ExternalLink,
  GraduationCap,
  Globe,
  Upload,
  AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * 资源中心 — 2026-05-18 重构
 *
 * 设计哲学：
 *   1. 不堆 30+ 个"在 B 站搜索 XXX"的硬链 —— 搜索结果命中率低、URL 长、易失效
 *   2. 只保留官方/明确的高价值链接（考试中心、研招网、官方课程页等）
 *   3. 顶部强推"自上传讲义/PDF"，让 materials 表才是真主流
 *
 * 重构前：1107 行、41 个 search URL 卡片；重构后：~150 行、确定 URL + banner。
 */

interface Link {
  title: string;
  desc: string;
  url: string;
  badge?: string;
}

const OFFICIAL: Link[] = [
  {
    title: "中国研究生招生信息网（研招网）",
    desc: "教育部官方研招报名 / 调剂 / 院校查询门户",
    url: "https://yz.chsi.com.cn/",
    badge: "官方",
  },
  {
    title: "教育部考试中心",
    desc: "考研大纲、命题、考务信息官方发布",
    url: "https://www.neea.edu.cn/",
    badge: "官方",
  },
  {
    title: "国家智慧教育公共服务平台",
    desc: "教育部主办的免费高校公开课与考研培训",
    url: "https://higher.smartedu.cn/",
    badge: "官方·免费",
  },
];

const SUBJECT_CORE: Link[] = [
  {
    title: "中国大学 MOOC（高教社）",
    desc: "免费的高校系统课程，含考研政治、英语、数学、408 多门核心课",
    url: "https://www.icourse163.org/",
    badge: "权威·免费",
  },
  {
    title: "学堂在线",
    desc: "清华主办的公开课平台，研究生科目覆盖较多",
    url: "https://www.xuetangx.com/",
    badge: "权威",
  },
  {
    title: "B 站官方学习中心",
    desc: "B 站汇总的教育频道（自己搜具体老师/课程更精准）",
    url: "https://www.bilibili.com/v/knowledge/",
    badge: "辅助",
  },
];

const REFERENCE: Link[] = [
  {
    title: "Anki 官方",
    desc: "间隔重复 + 卡组分享生态，本平台 SM-2 算法的鼻祖",
    url: "https://apps.ankiweb.net/",
  },
  {
    title: "考研政治大纲（百度百科）",
    desc: "历年大纲简介与变动",
    url: "https://baike.baidu.com/item/%E8%80%83%E7%A0%94%E6%94%BF%E6%B2%BB%E5%A4%A7%E7%BA%B2",
  },
];

function LinkCard({ link }: { link: Link }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 hover:bg-white/[0.06] transition-colors group"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="font-medium text-gray-200 text-sm group-hover:text-blue-300 transition-colors">
          {link.title}
        </div>
        <ExternalLink className="w-3.5 h-3.5 text-gray-500 shrink-0 mt-0.5" />
      </div>
      <p className="text-xs text-gray-400 mb-2 line-clamp-2">{link.desc}</p>
      {link.badge ? (
        <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px]">
          {link.badge}
        </Badge>
      ) : null}
    </a>
  );
}

export default function ResourcesPage() {
  const router = useRouter();
  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* 顶部 banner：推 materials 自传 */}
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <Upload className="w-6 h-6 text-amber-300 shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-amber-100 mb-1">
                  自己手头的 PDF / 讲义才是最适合你的资料
                </h3>
                <p className="text-sm text-amber-200/80 mb-3">
                  下面的外链只是入口参考。把你自己买的王道讲义、张宇 / 汤家凤 / 肖秀荣 PDF
                  上传到资料库，可以做 AI 知识点抽取、自动入图谱、关联到错题。
                </p>
                <div className="flex gap-2">
                  <Button
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={() => router.push("/materials")}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    上传我的讲义
                  </Button>
                  <Button
                    variant="outline"
                    className="border-amber-500/30 text-amber-200 hover:bg-amber-500/10"
                    onClick={() => router.push("/materials")}
                  >
                    去资料库
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 说明：为什么不堆"搜索 XXX"链接 */}
        <Card className="border-white/[0.06] bg-white/[0.02]">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-400 leading-relaxed">
              本页 2026-05 已重构：之前堆了几十个&ldquo;在 B 站搜索 XXX 老师&rdquo;的硬链，
              命中率低、URL 易失效。现在只保留<b>明确指向</b>的官方与高价值站点。
              想找具体老师 / 课程，请直接在 B 站、知乎、小红书搜索；
              想长期学习，强烈推荐把自己的讲义上传到上方资料库做 AI 处理。
            </p>
          </CardContent>
        </Card>

        {/* 官方权威 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-200 mb-3 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-400" />
            官方与权威
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {OFFICIAL.map((l) => (
              <LinkCard key={l.url} link={l} />
            ))}
          </div>
        </section>

        {/* 学科核心平台 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-200 mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            学科核心平台（免费 / 权威）
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SUBJECT_CORE.map((l) => (
              <LinkCard key={l.url} link={l} />
            ))}
          </div>
        </section>

        {/* 工具与参考 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-200 mb-3 flex items-center gap-2">
            <Globe className="w-5 h-5 text-purple-400" />
            工具与参考
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {REFERENCE.map((l) => (
              <LinkCard key={l.url} link={l} />
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
