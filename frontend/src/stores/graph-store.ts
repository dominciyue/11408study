import { create } from "zustand";
import type { KnowledgeNode, KnowledgeEdge, GraphFilter } from "@/types";
import { knowledgeApi } from "@/lib/api";

interface GraphState {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  selectedNode: KnowledgeNode | null;
  searchQuery: string;
  filters: GraphFilter;
  isLoading: boolean;
}

interface GraphActions {
  fetchGraphData: (filters?: GraphFilter) => Promise<void>;
  selectNode: (node: KnowledgeNode | null) => void;
  clearSelection: () => void;
  setFilters: (filters: Partial<GraphFilter>) => void;
  setSearchQuery: (query: string) => void;
  searchNodes: (query: string) => KnowledgeNode[];
}

export const useGraphStore = create<GraphState & GraphActions>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  searchQuery: "",
  filters: {},
  isLoading: false,

  fetchGraphData: async (filters) => {
    set({ isLoading: true });
    try {
      const params = filters || get().filters;
      // getGraphData 现在要求 subjectId 必填（后端是 path param）。
      // 没有 subjectId 时直接清空图，不做请求。
      if (typeof params.subjectId !== "number") {
        set({ nodes: [], edges: [], isLoading: false });
        return;
      }
      const res = await knowledgeApi.getGraphData({
        subjectId: params.subjectId,
        topicId: params.topicId,
      });
      set({ nodes: res.data.nodes, edges: res.data.edges, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  selectNode: (node) => set({ selectedNode: node }),

  clearSelection: () => set({ selectedNode: null }),

  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),

  setSearchQuery: (query) => set({ searchQuery: query }),

  searchNodes: (query) => {
    const { nodes } = get();
    if (!query.trim()) return nodes;
    const q = query.toLowerCase();
    return nodes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.summary.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q))
    );
  },
}));
