"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  type NodeTypes,
  BackgroundVariant,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import { Loader2 } from "lucide-react";
import { KnowledgeNode } from "@/components/graph/knowledge-node";
import { NodeDetailPanel } from "@/components/graph/node-detail-panel";
import { GraphToolbar, type MasteryFilter } from "@/components/graph/graph-toolbar";
import { knowledgeApi } from "@/lib/api";
import type {
  KnowledgeNode as KnowledgeNodeType,
  KnowledgeEdge as KnowledgeEdgeType,
} from "@/types";

/** 0-100 掌握度 -> 1..5 星；<=0 / undefined 视为 0 */
function masteryToStarsLevel(m: number | undefined): number {
  if (m == null || !Number.isFinite(m)) return 0;
  const v = Math.max(0, Math.min(100, m));
  if (v <= 0) return 0;
  if (v <= 20) return 1;
  if (v <= 40) return 2;
  if (v <= 60) return 3;
  if (v <= 80) return 4;
  return 5;
}

const nodeTypes: NodeTypes = {
  knowledge: KnowledgeNode,
};

/** 边类型 -> 颜色 */
const edgeColors: Record<string, string> = {
  PREREQUISITE: "#f97316",
  RELATED: "#3b82f6",
  EXTENDS: "#22c55e",
  CROSS_SUBJECT: "#a855f7",
  INCLUDES: "#22c55e", // 兜底：includes 视作 extends 类绿色
};

/** 边类型 -> 虚线样式（空数组 = 实线） */
const edgeDashArray: Record<string, string | undefined> = {
  PREREQUISITE: undefined,
  RELATED: "5 5",
  EXTENDS: undefined,
  CROSS_SUBJECT: "3 3",
  INCLUDES: undefined,
};

const NODE_WIDTH = 180;
const NODE_HEIGHT = 60;

/**
 * 后端 difficulty 可能是 string (EASY/MEDIUM/HARD) 或 number (1-5)。
 * KnowledgeNode 组件用字符串映射 EASY/MEDIUM/HARD，所以统一转字符串。
 */
function normalizeDifficulty(d: unknown): string {
  if (typeof d === "string") {
    const u = d.toUpperCase();
    if (u === "EASY" || u === "MEDIUM" || u === "HARD") return u;
    // 1/2/3 也可能以字符串形式来
    const n = Number(d);
    if (Number.isFinite(n)) return numberToDiffString(n);
    return "MEDIUM";
  }
  if (typeof d === "number") return numberToDiffString(d);
  return "MEDIUM";
}

function numberToDiffString(n: number): string {
  if (n <= 1) return "EASY";
  if (n >= 3) return "HARD";
  return "MEDIUM";
}

function normalizeRelation(r: unknown): string {
  if (typeof r !== "string") return "RELATED";
  return r.toUpperCase();
}

/**
 * 使用 dagre 计算横向布局，写回到 xyflow Node.position。
 * dagre 的 (x,y) 是节点中心点；xyflow 用左上角，所以要减半宽/半高。
 */
function layoutWithDagre(
  nodes: KnowledgeNodeType[],
  edges: KnowledgeEdgeType[],
): Array<KnowledgeNodeType & { position: { x: number; y: number } }> {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", nodesep: 50, ranksep: 80 });

  nodes.forEach((n) => {
    g.setNode(String(n.id), { width: NODE_WIDTH, height: NODE_HEIGHT });
  });
  edges.forEach((e) => {
    if (e.sourceId == null || e.targetId == null) return;
    g.setEdge(String(e.sourceId), String(e.targetId));
  });
  dagre.layout(g);

  return nodes.map((n) => {
    const p = g.node(String(n.id));
    return {
      ...n,
      position: p
        ? { x: p.x - NODE_WIDTH / 2, y: p.y - NODE_HEIGHT / 2 }
        : { x: 0, y: 0 },
    };
  });
}

function toXyflowNode(
  n: KnowledgeNodeType & { position: { x: number; y: number } },
): Node {
  return {
    id: String(n.id),
    type: "knowledge",
    position: n.position,
    data: {
      label: n.title,
      topicName: n.topicName || "",
      subjectName: n.subjectName || "",
      difficulty: normalizeDifficulty(n.difficulty),
      mastery: typeof n.mastery === "number" ? n.mastery : undefined,
      // 透传，便于详情面板使用
      _content: n.content || "",
      _topicId: n.topicId,
      _subjectId: n.subjectId,
    },
  };
}

function toXyflowEdge(e: KnowledgeEdgeType): Edge {
  const rel = normalizeRelation(e.relationType);
  const color = edgeColors[rel] || edgeColors.RELATED;
  const dash = edgeDashArray[rel];
  return {
    id: `e-${e.id}`,
    source: String(e.sourceId),
    target: String(e.targetId),
    label: e.label,
    style: {
      stroke: color,
      strokeWidth: 1.5,
      ...(dash ? { strokeDasharray: dash } : {}),
    },
    markerEnd: { type: MarkerType.ArrowClosed, color },
    data: { relationType: rel },
  };
}

function GraphPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subjectIdParam = searchParams.get("subjectId");
  const topicIdParam = searchParams.get("topicId");
  const focusNodeIdParam = searchParams.get("focusNodeId");

  const subjectId = Number(subjectIdParam);
  const topicId = topicIdParam ? Number(topicIdParam) : null;
  const focusNodeId = focusNodeIdParam ? Number(focusNodeIdParam) : null;

  const hasValidSubject = Number.isFinite(subjectId) && subjectId > 0;

  // 缺 subjectId 时不要弹错，直接引导回 /subjects 选学科入口。
  useEffect(() => {
    if (!hasValidSubject) {
      router.replace("/subjects");
    }
  }, [hasValidSubject, router]);
  const hasValidTopic =
    topicId !== null && Number.isFinite(topicId) && topicId > 0;
  const hasValidFocus =
    focusNodeId !== null && Number.isFinite(focusNodeId) && focusNodeId > 0;

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [rawNodes, setRawNodes] = useState<KnowledgeNodeType[]>([]);
  const [rawEdges, setRawEdges] = useState<KnowledgeEdgeType[]>([]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [masteryFilter, setMasteryFilter] = useState<MasteryFilter>(null);
  const [heatmapOn, setHeatmapOn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const reactFlow = useReactFlow();

  // 拉数据
  useEffect(() => {
    if (!hasValidSubject) {
      setIsLoading(false);
      setErrorMsg("缺少 subjectId 参数，请从 /subjects 页面进入。");
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setErrorMsg(null);
    knowledgeApi
      .getGraphData({ subjectId })
      .then((res) => {
        if (cancelled) return;
        const data = res.data || { nodes: [], edges: [] };
        setRawNodes(data.nodes || []);
        setRawEdges(data.edges || []);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: unknown }).message)
            : "图谱加载失败";
        setErrorMsg(msg);
        setRawNodes([]);
        setRawEdges([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [subjectId, hasValidSubject]);

  // 布局 + 映射成 xyflow 节点/边
  useEffect(() => {
    if (rawNodes.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }
    const positioned = layoutWithDagre(rawNodes, rawEdges);
    const xyNodes = positioned.map(toXyflowNode);
    const xyEdges = rawEdges.map(toXyflowEdge);
    setNodes(xyNodes);
    setEdges(xyEdges);
  }, [rawNodes, rawEdges, setNodes, setEdges]);

  // 来自 URL 的 focusNodeId：数据布局完成后自动选中并居中（仅一次）
  useEffect(() => {
    if (!hasValidFocus || nodes.length === 0) return;
    const targetId = String(focusNodeId);
    const target = nodes.find((n) => n.id === targetId);
    if (!target) return;
    setSelectedNodeId(targetId);
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, selected: n.id === targetId, dimmed: false },
      })),
    );
    // dagre 算出的是节点左上角，setCenter 需要中心点
    const cx = target.position.x + NODE_WIDTH / 2;
    const cy = target.position.y + NODE_HEIGHT / 2;
    reactFlow.setCenter(cx, cy, { zoom: 1.5, duration: 600 });
    // 一次性副作用：仅在 focusNodeId 或节点数变化时触发
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusNodeId, nodes.length]);

  // 热度地图开关 — 通过 data.heatmap 让自定义节点切换配色（独立于布局）
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, heatmap: heatmapOn },
      })),
    );
  }, [heatmapOn, setNodes, rawNodes]);

  // masteryFilter + topicId + searchQuery 联合作用：不匹配的 dimmed
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    setNodes((nds) =>
      nds.map((n) => {
        const m =
          typeof n.data.mastery === "number" ? (n.data.mastery as number) : undefined;
        const stars = masteryToStarsLevel(m);
        const masteryMatch =
          masteryFilter === null ? true : stars === masteryFilter;
        const rawTopicId = (n.data as Record<string, unknown>)._topicId;
        const nodeTopicId =
          typeof rawTopicId === "number" ? rawTopicId : undefined;
        const topicMatch = hasValidTopic ? nodeTopicId === topicId : true;
        const label = String(n.data.label || "").toLowerCase();
        const searchMatch = q === "" || label.includes(q);
        const matches = masteryMatch && topicMatch && searchMatch;
        return {
          ...n,
          data: { ...n.data, dimmed: !matches },
        };
      }),
    );
    // 注意：这里依赖 rawNodes 而非 nodes，避免 setNodes 引起的无限循环
    // setNodes 不会触发本 effect 重跑（它来自 useNodesState）
  }, [masteryFilter, topicId, hasValidTopic, searchQuery, setNodes, rawNodes]);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    const node = nodes.find((n) => n.id === selectedNodeId);
    if (!node) return null;
    const d = node.data as Record<string, unknown>;
    return {
      id: node.id,
      title: String(d.label || ""),
      content: String(d._content || ""),
      difficulty: String(d.difficulty || "MEDIUM"),
      topicName: String(d.topicName || ""),
      subjectName: String(d.subjectName || ""),
      mastery: typeof d.mastery === "number" ? (d.mastery as number) : undefined,
    };
  }, [selectedNodeId, nodes]);

  const relatedNodes = useMemo(() => {
    if (!selectedNodeId) return [];
    return edges
      .filter((e) => e.source === selectedNodeId || e.target === selectedNodeId)
      .map((e) => {
        const otherId = e.source === selectedNodeId ? e.target : e.source;
        const otherNode = nodes.find((n) => n.id === otherId);
        return {
          id: otherId,
          title: otherNode ? String(otherNode.data.label || "") : otherId,
          relationType: String(
            (e.data as Record<string, unknown>)?.relationType || "RELATED",
          ),
        };
      });
  }, [selectedNodeId, edges, nodes]);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: {
            ...n.data,
            selected: n.id === node.id,
            dimmed: false,
          },
        })),
      );
    },
    [setNodes],
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, selected: false, dimmed: false },
      })),
    );
  }, [setNodes]);

  const handleRelatedNodeClick = useCallback(
    (nodeId: string) => {
      setSelectedNodeId(nodeId);
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: { ...n.data, selected: n.id === nodeId, dimmed: false },
        })),
      );
    },
    [setNodes],
  );

  const handleZoomIn = useCallback(() => reactFlow.zoomIn(), [reactFlow]);
  const handleZoomOut = useCallback(() => reactFlow.zoomOut(), [reactFlow]);
  const handleFitView = useCallback(
    () => reactFlow.fitView({ padding: 0.2 }),
    [reactFlow],
  );
  const handleReset = useCallback(
    () => reactFlow.fitView({ padding: 0.2 }),
    [reactFlow],
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-6 relative">
      <div className="flex-1 relative">
        <GraphToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          masteryFilter={masteryFilter}
          onMasteryFilter={setMasteryFilter}
          heatmapOn={heatmapOn}
          onHeatmapToggle={setHeatmapOn}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitView={handleFitView}
          onReset={handleReset}
          nodeCount={nodes.length}
          edgeCount={edges.length}
        />

        {/* 热度地图色例 — 仅在热度地图开启时显示 */}
        {heatmapOn && nodes.length > 0 ? (
          <div className="absolute bottom-4 left-4 z-10 pointer-events-none rounded-lg border border-white/[0.08] bg-[#111118]/90 backdrop-blur-md px-3 py-2 text-[11px] text-gray-400">
            <div className="font-medium text-gray-300 mb-1.5">掌握度色例</div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-sm border border-gray-600/60 bg-gray-700/40" />
              <span>未学</span>
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-sm border border-red-500/60 bg-red-500/20" />
              <span>薄弱 &lt;30</span>
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-sm border border-amber-500/60 bg-amber-500/20" />
              <span>一般 30-69</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm border border-emerald-500/60 bg-emerald-500/20" />
              <span>掌握 ≥70</span>
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0f0f17] text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            图谱加载中…
          </div>
        ) : errorMsg ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0f0f17]">
            <div className="max-w-md text-center text-sm text-red-400 px-6 py-4 rounded-lg border border-red-500/20 bg-red-500/5">
              {errorMsg}
            </div>
          </div>
        ) : nodes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0f0f17]">
            <div className="text-center text-gray-500">
              <p className="text-base mb-2">该学科暂无知识点</p>
              <p className="text-xs text-gray-600">
                请在管理端导入学科种子或资料解析后再来查看。
              </p>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.1}
            maxZoom={2}
            defaultEdgeOptions={{
              animated: false,
              style: { strokeWidth: 1.5 },
            }}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="rgba(255,255,255,0.03)"
            />
            <Controls
              className="!bg-[#111118]/90 !border-white/[0.08] !rounded-lg [&_button]:!bg-transparent [&_button]:!border-white/[0.06] [&_button]:!text-gray-400 [&_button:hover]:!bg-white/5"
              position="bottom-left"
            />
            <MiniMap
              className="!bg-[#111118]/90 !border-white/[0.08] !rounded-lg"
              maskColor="rgba(0,0,0,0.7)"
              nodeColor={(node) => {
                const topic = String(node.data?.topicName || "");
                if (
                  topic.includes("数据结构") ||
                  topic.includes("操作系统") ||
                  topic.includes("计算机网络") ||
                  topic.includes("组成原理")
                )
                  return "#a855f7";
                if (
                  topic.includes("高等数学") ||
                  topic.includes("线性代数") ||
                  topic.includes("概率")
                )
                  return "#22c55e";
                return "#3b82f6";
              }}
              position="bottom-right"
            />
          </ReactFlow>
        )}

        {/* Legend */}
        {!isLoading && nodes.length > 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 px-4 py-2 rounded-lg bg-[#111118]/90 backdrop-blur-md border border-white/[0.08] text-[11px]">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-0.5 bg-orange-500" />
              <span className="text-gray-500">前置依赖</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-6 h-0.5 bg-blue-500"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(90deg, #3b82f6 0, #3b82f6 5px, transparent 5px, transparent 10px)",
                }}
              />
              <span className="text-gray-500">相关知识</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-0.5 bg-green-500" />
              <span className="text-gray-500">深入拓展</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-6 h-0.5 bg-purple-500"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(90deg, #a855f7 0, #a855f7 3px, transparent 3px, transparent 6px)",
                }}
              />
              <span className="text-gray-500">跨学科</span>
            </div>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selectedNode && (
        <NodeDetailPanel
          node={selectedNode}
          relatedNodes={relatedNodes}
          onClose={() => {
            setSelectedNodeId(null);
            onPaneClick();
          }}
          onNodeClick={handleRelatedNodeClick}
        />
      )}
    </div>
  );
}

export default function GraphPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[calc(100vh-4rem)] text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          加载中…
        </div>
      }
    >
      <ReactFlowProvider>
        <GraphPageInner />
      </ReactFlowProvider>
    </Suspense>
  );
}
