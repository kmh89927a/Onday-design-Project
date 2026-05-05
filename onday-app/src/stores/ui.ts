import { create } from "zustand";

// UI 임시 상태 — toasts + 단일 modal open ID
// persist 안 함 (세션 단위 휘발 — 새로고침 시 초기화 의도)

export type ToastVariant = "default" | "ok" | "warning" | "danger";

export interface Toast {
  id: string;
  variant: ToastVariant;
  message: string;
}

interface UIState {
  toasts: Toast[];
  /** id 자동 생성, 컴포넌트는 dismiss 자동/수동 트리거 */
  pushToast: (toast: Omit<Toast, "id">) => string;
  dismissToast: (id: string) => void;
  /** 동시에 한 모달만 열림 — id 충돌 방지 */
  openModalId: string | null;
  openModal: (id: string) => void;
  closeModal: () => void;
  isModalOpen: (id: string) => boolean;
}

const initialState = {
  toasts: [] as Toast[],
  openModalId: null as string | null,
};

export const useUIStore = create<UIState>((set, get) => ({
  ...initialState,

  pushToast: (toast) => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    return id;
  },

  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  openModal: (id) => set({ openModalId: id }),
  closeModal: () => set({ openModalId: null }),
  isModalOpen: (id) => get().openModalId === id,
}));
