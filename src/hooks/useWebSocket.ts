/**
 * ⚡ useWebSocket - Type-safe WebSocket Hook per il Bridge IPC di JLauncherOS.
 * Gestisce l'handshake di sessione automatico, il calcolo RTT, il bus pub/sub e il backoff esponenziale.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type {
  JsonRpcNotification,
  HandshakeResult,
  FocusMode
} from "../types/ipc_schema";

export type WebSocketStatus =
  | "DISCONNECTED"
  | "CONNECTING"
  | "CONNECTED"
  | "AUTHENTICATED"
  | "ERROR";

interface PendingRequest {
  resolve: (value: { result: any; rttMs: number }) => void;
  reject: (reason: any) => void;
  startTime: number;
}

export interface UseWebSocketReturn {
  status: WebSocketStatus;
  lastRttMs: number | null;
  focusMode: FocusMode;
  error: string | null;
  call: <TResult = unknown>(method: string, params?: unknown) => Promise<{ result: TResult; rttMs: number }>;
  subscribe: (eventMethod: string, callback: (params: any) => void) => () => void;
  reconnect: () => void;
}

const MIN_BACKOFF_MS = 200;
const MAX_BACKOFF_MS = 2000;
const BACKOFF_MULTIPLIER = 1.5;

export const useWebSocket = (url: string = "ws://127.0.0.1:8765/ws"): UseWebSocketReturn => {
  const [status, setStatus] = useState<WebSocketStatus>("DISCONNECTED");
  const [lastRttMs, setLastRttMs] = useState<number | null>(null);
  const [focusMode, setFocusMode] = useState<FocusMode>("NORMAL");
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const nextIdRef = useRef<number>(1);
  const pendingRequestsRef = useRef<Map<string | number, PendingRequest>>(new Map());
  const subscribersRef = useRef<Map<string, Set<(params: any) => void>>>(new Map());
  const backoffDelayRef = useRef<number>(MIN_BACKOFF_MS);
  const reconnectTimeoutRef = useRef<any>(null);
  const isMountedRef = useRef<boolean>(true);

  // Metodo per invocare procedure remote (RPC) con misurazione RTT in ms
  const call = useCallback(<TResult = unknown>(
    method: string,
    params?: unknown
  ): Promise<{ result: TResult; rttMs: number }> => {
    return new Promise((resolve, reject) => {
      const socket = socketRef.current;
      if (!socket) {
        return reject(new Error("WebSocket non inizializzato"));
      }

      const executeSend = () => {
        const id = nextIdRef.current++;
        const startTime = performance.now();

        pendingRequestsRef.current.set(id, {
          resolve: (val) => resolve(val as { result: TResult; rttMs: number }),
          reject,
          startTime,
        });

        const payload = JSON.stringify({
          jsonrpc: "2.0",
          id,
          method,
          params: params || {},
        });

        try {
          socket.send(payload);
        } catch (sendErr) {
          pendingRequestsRef.current.delete(id);
          reject(sendErr);
        }
      };

      if (socket.readyState === WebSocket.OPEN) {
        executeSend();
      } else if (socket.readyState === WebSocket.CONNECTING) {
        const onOpen = () => {
          socket.removeEventListener("open", onOpen);
          executeSend();
        };
        socket.addEventListener("open", onOpen);
      } else {
        return reject(new Error(`WebSocket non aperto (stato attuale: ${socket.readyState})`));
      }
    });
  }, []);

  // Metodo per sottoscrivere eventi push asincroni (senza id)
  const subscribe = useCallback((
    eventMethod: string,
    callback: (params: any) => void
  ): (() => void) => {
    if (!subscribersRef.current.has(eventMethod)) {
      subscribersRef.current.set(eventMethod, new Set());
    }
    const set = subscribersRef.current.get(eventMethod)!;
    set.add(callback);

    return () => {
      set.delete(callback);
      if (set.size === 0) {
        subscribersRef.current.delete(eventMethod);
      }
    };
  }, []);

  const connect = useCallback(async () => {
    if (!isMountedRef.current) return;

    if (socketRef.current) {
      if (
        socketRef.current.readyState === WebSocket.OPEN ||
        socketRef.current.readyState === WebSocket.CONNECTING
      ) {
        return;
      }
      try {
        socketRef.current.close();
      } catch {
        // Ignora chiusure precedenti
      }
      socketRef.current = null;
    }

    setStatus("CONNECTING");
    setError(null);

    // 1. Recupera il secret effimero da Rust
    let authToken = "";
    try {
      authToken = await invoke<string>("get_ipc_secret");
    } catch (e: any) {
      console.warn("[useWebSocket] get_ipc_secret non disponibile via Tauri (ambiente web):", e);
    }

    try {
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = async () => {
        if (!isMountedRef.current) return;
        setStatus("CONNECTED");
        backoffDelayRef.current = MIN_BACKOFF_MS; // reset backoff

        // 2. Esegue immediatamente l'handshake di sicurezza
        try {
          const { result, rttMs } = await call<HandshakeResult>("system.handshake", {
            auth_token: authToken,
            client_version: "1.0.0",
          });

          if (result.status === "authenticated") {
            setStatus("AUTHENTICATED");
            setError(null);
            setLastRttMs(rttMs);
            if (result.system_mode) {
              setFocusMode(result.system_mode);
            }
          }
        } catch (handshakeErr: any) {
          console.error("[useWebSocket] Errore durante l'handshake:", handshakeErr);
          setStatus("ERROR");
          setError(handshakeErr.message || "Handshake fallito");
        }
      };

      ws.onmessage = (event: MessageEvent) => {
        if (!isMountedRef.current) return;

        try {
          const data = JSON.parse(event.data);

          // Gestione risposta a richiesta RPC (contiene campo id)
          if (data && data.id !== undefined && data.id !== null) {
            const pending = pendingRequestsRef.current.get(data.id);
            if (pending) {
              pendingRequestsRef.current.delete(data.id);
              const rttMs = Math.round((performance.now() - pending.startTime) * 100) / 100;
              setLastRttMs(rttMs);

              if (data.error) {
                pending.reject(data.error);
              } else {
                pending.resolve({ result: data.result, rttMs });
              }
            }
          }
          // Gestione notifica push (senza campo id, contiene method)
          else if (data && data.method) {
            const notif = data as JsonRpcNotification;
            const handlers = subscribersRef.current.get(notif.method);
            if (handlers) {
              handlers.forEach((fn) => {
                try {
                  fn(notif.params);
                } catch (subErr) {
                  console.error(`[useWebSocket] Errore nel subscriber di ${notif.method}:`, subErr);
                }
              });
            }
          }
        } catch (parseErr) {
          console.error("[useWebSocket] Errore nel parsing del messaggio in arrivo:", parseErr);
        }
      };

      ws.onerror = (evt: Event) => {
        if (!isMountedRef.current) return;
        console.warn("[useWebSocket] Errore socket intercettato:", evt);
        setStatus("ERROR");
      };

      ws.onclose = () => {
        if (!isMountedRef.current) return;
        setStatus("DISCONNECTED");

        // Rifiuto di tutte le richieste pendenti rimaste aperte
        pendingRequestsRef.current.forEach(({ reject }) => {
          reject(new Error("Connessione WebSocket chiusa prima di ricevere la risposta"));
        });
        pendingRequestsRef.current.clear();

        // Pianifica riconnessione con backoff esponenziale
        const delay = backoffDelayRef.current;
        backoffDelayRef.current = Math.min(delay * BACKOFF_MULTIPLIER, MAX_BACKOFF_MS);

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            connect();
          }
        }, delay);
      };
    } catch (createErr: any) {
      if (!isMountedRef.current) return;
      setStatus("ERROR");
      setError(createErr.message || "Impossibile aprire il socket");
    }
  }, [url, call]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
      pendingRequestsRef.current.forEach(({ reject }) => {
        reject(new Error("Componente smontato"));
      });
      pendingRequestsRef.current.clear();
      subscribersRef.current.clear();
    };
  }, [connect]);

  return {
    status,
    lastRttMs,
    focusMode,
    error,
    call,
    subscribe,
    reconnect: connect,
  };
};

export default useWebSocket;
