"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
  BackgroundVariant,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { KnowledgeNode } from "@/components/graph/knowledge-node";
import { NodeDetailPanel } from "@/components/graph/node-detail-panel";
import { GraphToolbar } from "@/components/graph/graph-toolbar";

const nodeTypes: NodeTypes = {
  knowledge: KnowledgeNode,
};

const edgeColors: Record<string, string> = {
  PREREQUISITE: "#f97316",
  RELATED: "#3b82f6",
  EXTENDS: "#22c55e",
  CROSS_SUBJECT: "#a855f7",
};

const edgeDash: Record<string, number[]> = {
  PREREQUISITE: [],
  RELATED: [5, 5],
  EXTENDS: [8, 4],
  CROSS_SUBJECT: [3, 3],
};

const sampleNodes: Node[] = [
  { id: "1", type: "knowledge", position: { x: 0, y: 0 }, data: { label: "线性表概述", topicName: "数据结构", difficulty: "EASY" } },
  { id: "2", type: "knowledge", position: { x: -200, y: 150 }, data: { label: "顺序表", topicName: "数据结构", difficulty: "EASY" } },
  { id: "3", type: "knowledge", position: { x: 200, y: 150 }, data: { label: "单链表", topicName: "数据结构", difficulty: "EASY" } },
  { id: "4", type: "knowledge", position: { x: 300, y: 300 }, data: { label: "双链表", topicName: "数据结构", difficulty: "MEDIUM" } },
  { id: "5", type: "knowledge", position: { x: -300, y: 300 }, data: { label: "栈", topicName: "数据结构", difficulty: "EASY" } },
  { id: "6", type: "knowledge", position: { x: -100, y: 300 }, data: { label: "队列", topicName: "数据结构", difficulty: "EASY" } },
  { id: "7", type: "knowledge", position: { x: 0, y: 450 }, data: { label: "二叉树", topicName: "数据结构", difficulty: "MEDIUM", mastery: 65 } },
  { id: "8", type: "knowledge", position: { x: -200, y: 600 }, data: { label: "二叉树遍历", topicName: "数据结构", difficulty: "MEDIUM", mastery: 45 } },
  { id: "9", type: "knowledge", position: { x: 200, y: 600 }, data: { label: "二叉排序树(BST)", topicName: "数据结构", difficulty: "MEDIUM" } },
  { id: "10", type: "knowledge", position: { x: 200, y: 750 }, data: { label: "平衡二叉树(AVL)", topicName: "数据结构", difficulty: "HARD" } },
  { id: "11", type: "knowledge", position: { x: 500, y: 0 }, data: { label: "图的基本概念", topicName: "数据结构", difficulty: "EASY" } },
  { id: "12", type: "knowledge", position: { x: 500, y: 150 }, data: { label: "图的遍历", topicName: "数据结构", difficulty: "MEDIUM" } },
  { id: "13", type: "knowledge", position: { x: 400, y: 300 }, data: { label: "最短路径", topicName: "数据结构", difficulty: "HARD" } },
  { id: "14", type: "knowledge", position: { x: 700, y: 150 }, data: { label: "进程与线程", topicName: "操作系统", difficulty: "MEDIUM", mastery: 30 } },
  { id: "15", type: "knowledge", position: { x: 700, y: 300 }, data: { label: "进程调度算法", topicName: "操作系统", difficulty: "MEDIUM" } },
  { id: "16", type: "knowledge", position: { x: 900, y: 150 }, data: { label: "TCP协议", topicName: "计算机网络", difficulty: "MEDIUM" } },
  { id: "17", type: "knowledge", position: { x: 900, y: 300 }, data: { label: "TCP三次握手", topicName: "计算机网络", difficulty: "HARD", mastery: 80 } },
  { id: "18", type: "knowledge", position: { x: 900, y: 450 }, data: { label: "TCP拥塞控制", topicName: "计算机网络", difficulty: "HARD" } },
  { id: "19", type: "knowledge", position: { x: 700, y: 450 }, data: { label: "路由算法", topicName: "计算机网络", difficulty: "HARD" } },
];

const sampleEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2", style: { stroke: edgeColors.PREREQUISITE }, markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors.PREREQUISITE }, data: { relationType: "PREREQUISITE" } },
  { id: "e1-3", source: "1", target: "3", style: { stroke: edgeColors.PREREQUISITE }, markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors.PREREQUISITE }, data: { relationType: "PREREQUISITE" } },
  { id: "e3-4", source: "3", target: "4", style: { stroke: edgeColors.EXTENDS, strokeDasharray: "8 4" }, markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors.EXTENDS }, data: { relationType: "EXTENDS" } },
  { id: "e1-5", source: "1", target: "5", style: { stroke: edgeColors.PREREQUISITE }, markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors.PREREQUISITE }, data: { relationType: "PREREQUISITE" } },
  { id: "e1-6", source: "1", target: "6", style: { stroke: edgeColors.PREREQUISITE }, markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors.PREREQUISITE }, data: { relationType: "PREREQUISITE" } },
  { id: "e7-8", source: "7", target: "8", style: { stroke: edgeColors.PREREQUISITE }, markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors.PREREQUISITE }, data: { relationType: "PREREQUISITE" } },
  { id: "e8-9", source: "8", target: "9", style: { stroke: edgeColors.PREREQUISITE }, markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors.PREREQUISITE }, data: { relationType: "PREREQUISITE" } },
  { id: "e9-10", source: "9", target: "10", style: { stroke: edgeColors.EXTENDS }, markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors.EXTENDS }, data: { relationType: "EXTENDS" } },
  { id: "e11-12", source: "11", target: "12", style: { stroke: edgeColors.PREREQUISITE }, markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors.PREREQUISITE }, data: { relationType: "PREREQUISITE" } },
  { id: "e12-13", source: "12", target: "13", style: { stroke: edgeColors.PREREQUISITE }, markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors.PREREQUISITE }, data: { relationType: "PREREQUISITE" } },
  { id: "e14-15", source: "14", target: "15", style: { stroke: edgeColors.PREREQUISITE }, markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors.PREREQUISITE }, data: { relationType: "PREREQUISITE" } },
  { id: "e6-15", source: "6", target: "15", style: { stroke: edgeColors.CROSS_SUBJECT, strokeDasharray: "3 3" }, markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors.CROSS_SUBJECT }, data: { relationType: "CROSS_SUBJECT" } },
  { id: "e12-19", source: "12", target: "19", style: { stroke: edgeColors.CROSS_SUBJECT, strokeDasharray: "3 3" }, markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors.CROSS_SUBJECT }, data: { relationType: "CROSS_SUBJECT" } },
  { id: "e13-19", source: "13", target: "19", style: { stroke: edgeColors.CROSS_SUBJECT, strokeDasharray: "3 3" }, markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors.CROSS_SUBJECT }, data: { relationType: "CROSS_SUBJECT" } },
  { id: "e16-17", source: "16", target: "17", style: { stroke: edgeColors.PREREQUISITE }, markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors.PREREQUISITE }, data: { relationType: "PREREQUISITE" } },
  { id: "e16-18", source: "16", target: "18", style: { stroke: edgeColors.PREREQUISITE }, markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors.PREREQUISITE }, data: { relationType: "PREREQUISITE" } },
];

export default function GraphPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(sampleNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(sampleEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSubject, setActiveSubject] = useState<string | null>(null);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    const node = nodes.find((n) => n.id === selectedNodeId);
    if (!node) return null;
    return {
      id: node.id,
      title: String(node.data.label || ""),
      content: "知识点详细内容将从后端 API 加载...",
      difficulty: String(node.data.difficulty || "MEDIUM"),
      topicName: String(node.data.topicName || ""),
      mastery: typeof node.data.mastery === "number" ? node.data.mastery : undefined,
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
          relationType: String((e.data as Record<string, unknown>)?.relationType || "RELATED"),
        };
      });
  }, [selectedNodeId, edges, nodes]);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          selected: n.id === node.id,
          dimmed: false,
        },
      }))
    );
  }, [setNodes]);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, selected: false, dimmed: false },
      }))
    );
  }, [setNodes]);

  const handleRelatedNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, selected: n.id === nodeId, dimmed: false },
      }))
    );
  }, [setNodes]);

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-6 relative">
      <div className="flex-1 relative">
        <GraphToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeSubject={activeSubject}
          onSubjectFilter={setActiveSubject}
          onZoomIn={() => {}}
          onZoomOut={() => {}}
          onFitView={() => {}}
          onReset={() => {}}
          nodeCount={nodes.length}
          edgeCount={edges.length}
        />
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
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(255,255,255,0.03)" />
          <Controls
            className="!bg-[#111118]/90 !border-white/[0.08] !rounded-lg [&_button]:!bg-transparent [&_button]:!border-white/[0.06] [&_button]:!text-gray-400 [&_button:hover]:!bg-white/5"
            position="bottom-left"
          />
          <MiniMap
            className="!bg-[#111118]/90 !border-white/[0.08] !rounded-lg"
            maskColor="rgba(0,0,0,0.7)"
            nodeColor={(node) => {
              const topic = String(node.data?.topicName || "");
              if (topic.includes("数据结构")) return "#a855f7";
              if (topic.includes("操作系统")) return "#a855f7";
              if (topic.includes("计算机网络")) return "#a855f7";
              if (topic.includes("组成原理")) return "#a855f7";
              return "#3b82f6";
            }}
            position="bottom-right"
          />
        </ReactFlow>

        {/* Legend */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 px-4 py-2 rounded-lg bg-[#111118]/90 backdrop-blur-md border border-white/[0.08] text-[11px]">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 bg-orange-500" />
            <span className="text-gray-500">前置依赖</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 bg-blue-500" style={{ backgroundImage: "repeating-linear-gradient(90deg, #3b82f6 0, #3b82f6 5px, transparent 5px, transparent 10px)" }} />
            <span className="text-gray-500">相关知识</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 bg-green-500" />
            <span className="text-gray-500">深入拓展</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 bg-purple-500" style={{ backgroundImage: "repeating-linear-gradient(90deg, #a855f7 0, #a855f7 3px, transparent 3px, transparent 6px)" }} />
            <span className="text-gray-500">跨学科</span>
          </div>
        </div>
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
