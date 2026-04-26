import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./auth";

export type WorkspaceMode = "demo" | "user";

export type OpenMetadataConfig = {
  url: string;
  token: string;
  connectedAt: string;
};

export type WorkspaceState = {
  mode: WorkspaceMode | null;
  openMetadata: OpenMetadataConfig | null;
};

type WorkspaceContextValue = {
  ready: boolean;
  mode: WorkspaceMode | null;
  openMetadata: OpenMetadataConfig | null;
  setMode: (mode: WorkspaceMode) => void;
  connectOpenMetadata: (cfg: { url: string; token: string }) => void;
  disconnectOpenMetadata: () => void;
  resetWorkspace: () => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function storageKey(userId: string) {
  return `trustlayer:workspace:${userId}`;
}

function loadState(userId: string): WorkspaceState {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return { mode: null, openMetadata: null };
    const parsed = JSON.parse(raw) as Partial<WorkspaceState>;
    const mode =
      parsed.mode === "demo" || parsed.mode === "user" ? parsed.mode : null;
    const openMetadata =
      parsed.openMetadata && parsed.openMetadata.url && parsed.openMetadata.token
        ? {
            url: String(parsed.openMetadata.url),
            token: String(parsed.openMetadata.token),
            connectedAt: String(parsed.openMetadata.connectedAt || ""),
          }
        : null;
    return { mode, openMetadata };
  } catch {
    return { mode: null, openMetadata: null };
  }
}

function saveState(userId: string, state: WorkspaceState) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(state));
  } catch {
    // ignore quota / privacy errors
  }
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.$id ?? null;
  const [state, setState] = useState<WorkspaceState>({
    mode: null,
    openMetadata: null,
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!userId) {
      setState({ mode: null, openMetadata: null });
      setReady(false);
      return;
    }
    setState(loadState(userId));
    setReady(true);
  }, [userId]);

  const persist = useCallback(
    (next: WorkspaceState) => {
      setState(next);
      if (userId) saveState(userId, next);
    },
    [userId],
  );

  const setMode = useCallback(
    (mode: WorkspaceMode) => {
      persist({ ...state, mode });
    },
    [persist, state],
  );

  const connectOpenMetadata = useCallback(
    (cfg: { url: string; token: string }) => {
      persist({
        mode: "user",
        openMetadata: {
          url: cfg.url.trim().replace(/\/$/, ""),
          token: cfg.token.trim(),
          connectedAt: new Date().toISOString(),
        },
      });
    },
    [persist],
  );

  const disconnectOpenMetadata = useCallback(() => {
    persist({ ...state, openMetadata: null });
  }, [persist, state]);

  const resetWorkspace = useCallback(() => {
    persist({ mode: null, openMetadata: null });
  }, [persist]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      ready,
      mode: state.mode,
      openMetadata: state.openMetadata,
      setMode,
      connectOpenMetadata,
      disconnectOpenMetadata,
      resetWorkspace,
    }),
    [
      ready,
      state.mode,
      state.openMetadata,
      setMode,
      connectOpenMetadata,
      disconnectOpenMetadata,
      resetWorkspace,
    ],
  );

  return (
    <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}
