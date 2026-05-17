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
  {
    title: "教育部官网（招生考试）",
    desc: "教育部官方门户，研究生招生政策、文件原文发布渠道。",
    url: "http://www.moe.gov.cn/",
    kind: "site",
  },
  {
    title: "研招网 - 考研指南",
    desc: "研招网官方考研指南专题，覆盖报名 / 考试 / 复试调剂全流程。",
    url: "https://yz.chsi.com.cn/kyzn/",
    kind: "site",
  },
  {
    title: "中国大学 MOOC（icourse163）",
    desc: "国家级在线开放课程平台，覆盖各高校研究生公开课与专业基础课。",
    url: "https://www.icourse163.org/",
    kind: "site",
  },
  {
    title: "知乎「考研」话题",
    desc: "知乎考研聚合话题，含经验贴 / 院校分析 / 名师测评。",
    url: "https://www.zhihu.com/topic/19550994",
    kind: "site",
  },
  {
    title: "考研帮",
    desc: "老牌考研社区，含院校库 / 真题 / 经验帖。",
    url: "https://www.kaoyan.com/",
    kind: "site",
  },
  {
    title: "小木虫 - 考研版",
    desc: "学术与考研论坛，理工科考研经验贴较多。",
    url: "http://muchong.com/bbs/index.php",
    kind: "site",
  },
  {
    title: "考研论坛",
    desc: "民间老牌考研论坛，含分专业讨论区与资料分享。",
    url: "http://www.kaoyan.cn/",
    kind: "site",
  },
  {
    title: "中国教育在线 - 考研频道",
    desc: "权威教育门户考研频道，含分数线 / 报录比 / 调剂信息。",
    url: "https://kaoyan.eol.cn/",
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
          {
            title: "B 站搜索：徐涛 强化班 马原",
            desc: "徐涛强化班马原章节切片，理论基础最易听懂。",
            url: "https://search.bilibili.com/all?keyword=%E5%BE%90%E6%B6%9B%20%E5%BC%BA%E5%8C%96%E7%8F%AD%20%E9%A9%AC%E5%8E%9F",
            kind: "video",
          },
          {
            title: "B 站搜索：肖秀荣 时政",
            desc: "肖秀荣时政课与近年形势与政策解读切片。",
            url: "https://search.bilibili.com/all?keyword=%E8%82%96%E7%A7%80%E8%8D%A3%20%E6%97%B6%E6%94%BF",
            kind: "video",
          },
          {
            title: "B 站搜索：腿姐 冲刺背诵手册",
            desc: "腿姐背诵手册逐章带背公开内容。",
            url: "https://search.bilibili.com/all?keyword=%E8%85%BF%E5%A7%90%20%E8%83%8C%E8%AF%B5%E6%89%8B%E5%86%8C",
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
          {
            title: "GitHub 搜索：考研政治 笔记",
            desc: "GitHub 上社区整理的政治学习笔记仓库聚合。",
            url: "https://github.com/search?q=%E8%80%83%E7%A0%94%E6%94%BF%E6%B2%BB+%E7%AC%94%E8%AE%B0&type=repositories",
            kind: "code",
          },
          {
            title: "GitHub 搜索：肖四 肖八",
            desc: "GitHub 上肖四肖八真题 / 押题相关整理仓库。",
            url: "https://github.com/search?q=%E8%82%96%E5%9B%9B+%E8%82%96%E5%85%AB&type=repositories",
            kind: "code",
          },
          {
            title: "知乎专栏：考研政治大题答题模板",
            desc: "知乎搜索「考研政治大题模板」，含主观题答题套路汇总。",
            url: "https://www.zhihu.com/search?q=%E8%80%83%E7%A0%94%E6%94%BF%E6%B2%BB%E5%A4%A7%E9%A2%98%E6%A8%A1%E6%9D%BF",
            kind: "site",
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
          {
            title: "求是网",
            desc: "中共中央机关刊《求是》杂志官网，理论与重大文件首发渠道。",
            url: "http://www.qstheory.cn/",
            kind: "site",
          },
          {
            title: "学习强国",
            desc: "权威理论学习平台，时政热点 / 重要讲话 / 党史专题。",
            url: "https://www.xuexi.cn/",
            kind: "site",
          },
          {
            title: "中共中央党校（国家行政学院）",
            desc: "中共中央党校官网，理论文章与时政评论一手来源。",
            url: "https://www.ccps.gov.cn/",
            kind: "site",
          },
          {
            title: "新华网 - 时政频道",
            desc: "新华社时政原文，重要会议与文件解读。",
            url: "http://www.news.cn/politics/",
            kind: "site",
          },
          {
            title: "央视网 - 新闻联播",
            desc: "央视新闻联播官方网页，每日时政热点入口。",
            url: "https://tv.cctv.com/lm/xwlb/",
            kind: "site",
          },
          {
            title: "中国共产党新闻网",
            desc: "人民网党史 / 党建 / 重要文献专题，史纲与毛中特一手史料。",
            url: "http://cpc.people.com.cn/",
            kind: "site",
          },
          {
            title: "光明网 - 理论频道",
            desc: "马克思主义理论与思政原文集中地，强化理论底色。",
            url: "https://theory.gmw.cn/",
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
          {
            title: "B 站搜索：王江涛 写作",
            desc: "王江涛写作课公开切片，覆盖小作文 / 大作文模板。",
            url: "https://search.bilibili.com/all?keyword=%E7%8E%8B%E6%B1%9F%E6%B6%9B%20%E5%86%99%E4%BD%9C",
            kind: "video",
          },
          {
            title: "B 站搜索：朱伟 恋恋有词",
            desc: "朱伟恋恋有词词汇课公开切片，词汇带读与词根记忆。",
            url: "https://search.bilibili.com/all?keyword=%E6%9C%B1%E4%BC%9F%20%E6%81%8B%E6%81%8B%E6%9C%89%E8%AF%8D",
            kind: "video",
          },
          {
            title: "B 站搜索：刘晓艳 你还在背单词吗",
            desc: "刘晓艳大雁带你飞 / 词汇课公开切片，零基础友好。",
            url: "https://search.bilibili.com/all?keyword=%E5%88%98%E6%99%93%E8%89%B3%20%E8%AF%8D%E6%B1%87",
            kind: "video",
          },
          {
            title: "B 站搜索：颉斌斌 新题型",
            desc: "颉斌斌新题型方法论与七选五 / 排序公开切片。",
            url: "https://search.bilibili.com/all?keyword=%E9%A2%89%E6%96%8C%E6%96%8C%20%E6%96%B0%E9%A2%98%E5%9E%8B",
            kind: "video",
          },
          {
            title: "B 站搜索：宋逸轩 翻译",
            desc: "宋逸轩 / 唐静等翻译课公开切片。",
            url: "https://search.bilibili.com/all?keyword=%E5%94%90%E9%9D%99%20%E7%BF%BB%E8%AF%91",
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
          {
            title: "GitHub 搜索：KaoYan-English",
            desc: "GitHub 上 KaoYan-English 系列仓库，覆盖真题文本与解析。",
            url: "https://github.com/search?q=KaoYan-English&type=repositories",
            kind: "code",
          },
          {
            title: "GitHub 搜索：考研英语 外刊",
            desc: "GitHub 社区整理的真题外刊原文出处汇总。",
            url: "https://github.com/search?q=%E8%80%83%E7%A0%94%E8%8B%B1%E8%AF%AD+%E5%A4%96%E5%88%8A&type=repositories",
            kind: "code",
          },
          {
            title: "纽约时报中英对照",
            desc: "纽约时报中文网，原文常作为考研英语题源参考。",
            url: "https://cn.nytimes.com/",
            kind: "site",
          },
        ],
      },
      {
        label: "外刊与外语学习",
        icon: Globe,
        items: [
          {
            title: "China Daily 双语新闻",
            desc: "中国日报双语新闻频道，中英对照适合精读训练。",
            url: "https://language.chinadaily.com.cn/",
            kind: "site",
          },
          {
            title: "VOA Learning English",
            desc: "VOA 慢速英语官网，听力 + 文本对照，适合基础阶段。",
            url: "https://learningenglish.voanews.com/",
            kind: "site",
          },
          {
            title: "BBC Learning English",
            desc: "BBC 官方英语学习站点，6 Minute English 等系列素材。",
            url: "https://www.bbc.co.uk/learningenglish",
            kind: "site",
          },
          {
            title: "Etymonline 词根词缀辞典",
            desc: "在线词源辞典，配合词根记忆法理解单词构词。",
            url: "https://www.etymonline.com/",
            kind: "site",
          },
          {
            title: "Longman 朗文当代英语词典在线",
            desc: "权威英英词典，适合高阶阶段查询正式语义与搭配。",
            url: "https://www.ldoceonline.com/",
            kind: "site",
          },
          {
            title: "Cambridge 剑桥词典在线",
            desc: "剑桥英汉双解词典，例句质量高，覆盖近义辨析。",
            url: "https://dictionary.cambridge.org/zhs/",
            kind: "site",
          },
          {
            title: "Merriam-Webster 韦氏词典",
            desc: "美式英语权威词典，精确义项与发音。",
            url: "https://www.merriam-webster.com/",
            kind: "site",
          },
          {
            title: "经济学人中文网",
            desc: "经济学人简体中文版（部分双语对照），考研外刊重要参考。",
            url: "https://www.economist.com.cn/",
            kind: "site",
          },
          {
            title: "21st Century English",
            desc: "China Daily 旗下 21 世纪英文报，时事英语精选。",
            url: "https://www.i21st.cn/",
            kind: "site",
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
            title: "B 站搜索：张宇 基础 30 讲",
            desc: "张宇基础 30 讲配套视频公开切片。",
            url: "https://search.bilibili.com/all?keyword=%E5%BC%A0%E5%AE%87%20%E5%9F%BA%E7%A1%8030%E8%AE%B2",
            kind: "video",
          },
          {
            title: "B 站搜索：张宇 强化班",
            desc: "张宇强化阶段公开课切片，覆盖典型题型。",
            url: "https://search.bilibili.com/all?keyword=%E5%BC%A0%E5%AE%87%20%E5%BC%BA%E5%8C%96%E7%8F%AD",
            kind: "video",
          },
          {
            title: "B 站搜索：汤家凤 高等数学",
            desc: "B 站搜索结果页，含汤家凤基础班、零基础入门公开内容。",
            url: "https://search.bilibili.com/all?keyword=%E6%B1%A4%E5%AE%B6%E5%87%A4%20%E9%AB%98%E6%95%B0",
            kind: "video",
          },
          {
            title: "B 站搜索：汤家凤 1800 题",
            desc: "汤家凤 1800 题讲解公开切片，刷题阶段必备。",
            url: "https://search.bilibili.com/all?keyword=%E6%B1%A4%E5%AE%B6%E5%87%A4%201800",
            kind: "video",
          },
          {
            title: "B 站搜索：武忠祥 高等数学",
            desc: "武忠祥强化课公开切片，结构清晰，配套讲义有口皆碑。",
            url: "https://search.bilibili.com/all?keyword=%E6%AD%A6%E5%BF%A0%E7%A5%A5%20%E9%AB%98%E6%95%B0",
            kind: "video",
          },
          {
            title: "B 站搜索：李永乐 线性代数",
            desc: "李永乐线性代数辅导公开切片，体系成熟。",
            url: "https://search.bilibili.com/all?keyword=%E6%9D%8E%E6%B0%B8%E4%B9%90%20%E7%BA%BF%E6%80%A7%E4%BB%A3%E6%95%B0",
            kind: "video",
          },
          {
            title: "B 站搜索：王式安 概率论",
            desc: "王式安考研概率论公开切片，覆盖大数定律与统计推断。",
            url: "https://search.bilibili.com/all?keyword=%E7%8E%8B%E5%BC%8F%E5%AE%89%20%E6%A6%82%E7%8E%87%E8%AE%BA",
            kind: "video",
          },
          {
            title: "B 站搜索：杨超 高数",
            desc: "杨超 SVIP / 真题课公开切片，难题处理思路。",
            url: "https://search.bilibili.com/all?keyword=%E6%9D%A8%E8%B6%85%20%E9%AB%98%E6%95%B0",
            kind: "video",
          },
          {
            title: "MIT OCW 18.01 Single Variable Calculus",
            desc: "MIT 单变量微积分公开课，英文教材 + 视频 + 习题，体系扎实。",
            url: "https://ocw.mit.edu/courses/18-01-single-variable-calculus-fall-2010/",
            kind: "video",
          },
          {
            title: "MIT OCW 18.02 Multivariable Calculus",
            desc: "MIT 多变量微积分公开课，对接高数下册的曲面积分与场论。",
            url: "https://ocw.mit.edu/courses/18-02-multivariable-calculus-fall-2007/",
            kind: "video",
          },
          {
            title: "MIT OCW 18.06 Linear Algebra（Gilbert Strang）",
            desc: "Strang 教授线性代数经典公开课，强烈推荐对照学习矩阵几何直觉。",
            url: "https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/",
            kind: "video",
          },
          {
            title: "MIT OCW 6.041 Probabilistic Systems Analysis",
            desc: "MIT 概率论公开课，配套教材为 Bertsekas《Introduction to Probability》。",
            url: "https://ocw.mit.edu/courses/6-041-probabilistic-systems-analysis-and-applied-probability-fall-2010/",
            kind: "video",
          },
          {
            title: "3Blue1Brown 《线性代数的本质》",
            desc: "B 站搬运的 3Blue1Brown 线代直觉系列，理解矩阵与向量空间神器。",
            url: "https://www.bilibili.com/video/BV1ys411472E/",
            kind: "video",
          },
          {
            title: "3Blue1Brown 《微积分的本质》",
            desc: "B 站微积分本质系列，配合高数学习直觉建构。",
            url: "https://www.bilibili.com/video/BV1qW411N7FU/",
            kind: "video",
          },
          {
            title: "中国大学 MOOC：高等数学（同济）",
            desc: "中国大学 MOOC 上同济大学高等数学公开课。",
            url: "https://www.icourse163.org/search.htm?search=%E9%AB%98%E7%AD%89%E6%95%B0%E5%AD%A6",
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
          {
            title: "GitHub 搜索：KaoYan-Math",
            desc: "GitHub 上 KaoYan-Math 系列仓库，覆盖 1987 年以来真题汇总。",
            url: "https://github.com/search?q=KaoYan-Math&type=repositories",
            kind: "code",
          },
          {
            title: "GitHub 搜索：Didnelpsun Math",
            desc: "Didnelpsun 系列考研数学笔记仓库（高数 / 线代 / 概率全套）。",
            url: "https://github.com/search?q=Didnelpsun+Math&type=repositories",
            kind: "code",
          },
          {
            title: "GitHub 搜索：考研数学 真题 PDF",
            desc: "GitHub 社区整理的真题 PDF 仓库，按 stars 选靠谱来源。",
            url: "https://github.com/search?q=%E8%80%83%E7%A0%94%E6%95%B0%E5%AD%A6+%E7%9C%9F%E9%A2%98+pdf&type=repositories",
            kind: "code",
          },
          {
            title: "GitHub 搜索：考研数学一",
            desc: "GitHub 上数学一专项仓库聚合（笔记 / 错题 / 公式手册）。",
            url: "https://github.com/search?q=%E8%80%83%E7%A0%94%E6%95%B0%E5%AD%A6%E4%B8%80&type=repositories",
            kind: "code",
          },
        ],
      },
      {
        label: "经典教材与公开课",
        icon: BookOpen,
        items: [
          {
            title: "同济大学《高等数学》第七版",
            desc: "考研数学一最主流参考教材之一；请通过正规渠道购买正版。",
            kind: "book",
          },
          {
            title: "京东搜索：张宇 基础 30 讲",
            desc: "张宇基础 30 讲购买入口（京东自营）。",
            url: "https://search.jd.com/Search?keyword=%E5%BC%A0%E5%AE%87%E5%9F%BA%E7%A1%8030%E8%AE%B2",
            kind: "book",
          },
          {
            title: "京东搜索：武忠祥 高数 18 讲",
            desc: "武忠祥高数辅导讲义购买入口（京东）。",
            url: "https://search.jd.com/Search?keyword=%E6%AD%A6%E5%BF%A0%E7%A5%A5+%E9%AB%98%E6%95%B0+18%E8%AE%B2",
            kind: "book",
          },
          {
            title: "京东搜索：汤家凤 1800 题",
            desc: "汤家凤 1800 题购买入口（京东自营）。",
            url: "https://search.jd.com/Search?keyword=%E6%B1%A4%E5%AE%B6%E5%87%A41800%E9%A2%98",
            kind: "book",
          },
          {
            title: "京东搜索：李永乐 线代辅导讲义",
            desc: "李永乐线性代数辅导讲义购买入口。",
            url: "https://search.jd.com/Search?keyword=%E6%9D%8E%E6%B0%B8%E4%B9%90+%E7%BA%BF%E6%80%A7%E4%BB%A3%E6%95%B0",
            kind: "book",
          },
          {
            title: "当当搜索：考研数学 660 题",
            desc: "660 题购买入口（当当）。",
            url: "https://search.dangdang.com/?key=%C0%EE%D3%C0%C0%D6%20660%CC%E2",
            kind: "book",
          },
          {
            title: "Bertsekas《Introduction to Probability》课程页",
            desc: "MIT 概率论配套书与课件官方下载页。",
            url: "https://www.athenasc.com/probbook.html",
            kind: "book",
          },
          {
            title: "Strang《Introduction to Linear Algebra》课程页",
            desc: "Gilbert Strang 线代教材 MIT 课程页（含勘误与样章）。",
            url: "https://math.mit.edu/~gs/linearalgebra/",
            kind: "book",
          },
        ],
      },
      {
        label: "官方资源",
        icon: Globe,
        items: [
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
          {(() => {
            // new URL() 在 protocol 缺失等异常时会 throw 让整页崩；safe parse。
            if (!item.url) return "暂无可信 URL";
            try {
              return new URL(item.url).hostname.replace(/^www\./, "");
            } catch {
              return item.url.slice(0, 40);
            }
          })()}
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
