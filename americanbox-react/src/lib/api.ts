// src/lib/api.ts
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

type ApiOptions = RequestInit & {
  /** Si pasas json, se serializa y se envía con Content-Type: application/json */
  json?: unknown;
  /** Parámetros de query opcionales ?a=1&b=2 */
  query?: Record<string, any>;
};

function toQueryString(q?: Record<string, any>): string {
  if (!q) return "";
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      v.forEach((vv) => params.append(k, String(vv)));
    } else {
      params.append(k, String(v));
    }
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

export async function api<T = any>(path: string, opts: ApiOptions = {}) {
  const base = path.startsWith("http") ? path : `${API_URL}${path}`;
  const url = `${base}${toQueryString(opts.query)}`;

  // Usamos Headers para respetar mayúsculas/minúsculas y merges
  const headers = new Headers(opts.headers as HeadersInit);

  // Serialización de body/json
  let body: BodyInit | undefined = opts.body as any;

  if (opts.json !== undefined) {
    // Prioridad para 'json'
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(opts.json);
  } else if (
    body !== undefined &&
    body !== null &&
    typeof body === "object" &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof ArrayBuffer)
  ) {
    // Si body es un objeto plano, lo serializamos automáticamente
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(body);
  }

  const res = await fetch(url, {
    method: opts.method || "GET",
    headers,
    body,
    credentials: "include", // para cookies de sesión (express-session)
  });

  // Intentamos parsear según content-type
  const ctype = res.headers.get("content-type") || "";
  let data: any = null;

  try {
    if (ctype.includes("application/json")) {
      data = await res.json();
    } else {
      // Si no es JSON, devolvemos el texto para no perder información
      const text = await res.text();
      data = text ? { raw: text } : null;
    }
  } catch {
    data = { error: "Respuesta no válida del servidor." };
  }

  if (!res.ok) {
    // Normalizamos el error para que el caller pueda leer status y mensaje
    return {
      ok: false,
      status: res.status,
      statusText: res.statusText,
      ...(typeof data === "object" && data ? data : { error: data }),
    } as T;
  }

  return data as T;
}
