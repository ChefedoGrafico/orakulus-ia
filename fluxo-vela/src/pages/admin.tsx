import { useState, useEffect, useCallback } from "react";

const PASS = "171016LN";
const LS = "orakulus_admin_v2";

type User = {
  id: number;
  nome: string;
  email: string;
  id_corretora: string;
  status_deposito: string;
  plano: string;
  data_cadastro: string;
  data_expiracao: string | null;
  status_validacao: string;
  comprovante_deposito: string | null;
  observacao_admin: string | null;
  sinais_consumidos?: number;
  sinais_extras_liberados?: number;
};

function fmtDate(s: string | null | undefined) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  } catch {
    return s;
  }
}

function fmtDateBR(s: string | null | undefined): string {
  if (!s) return "—";
  try {
    const d = new Date(s);
    const day = String(d.getUTCDate()).padStart(2, "0");
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return s ?? "—";
  }
}

function isExpired(data_expiracao: string | null): boolean {
  if (!data_expiracao) return false;
  return new Date(data_expiracao) < new Date();
}

function validacaoBadge(sv: string) {
  if (sv === "APROVADO")
    return { label: "APROVADO", bg: "#064e3b", border: "#10b981", color: "#34d399" };
  if (sv === "RECUSADO")
    return { label: "RECUSADO", bg: "#3b0000", border: "#dc2626", color: "#f87171" };
  return { label: "PENDENTE", bg: "#1c1507", border: "#d97706", color: "#fbbf24" };
}

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwErr, setPwErr] = useState("");

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [listErr, setListErr] = useState("");
  const [acting, setActing] = useState("");
  const [msg, setMsg] = useState("");
  const [obsEdit, setObsEdit] = useState<Record<number, string>>({});

  useEffect(() => {
    try {
      if (localStorage.getItem(LS) === "1") setAuthed(true);
    } catch {
      /* ignore */
    }
  }, []);

  const login = () => {
    if (pw === PASS) {
      try { localStorage.setItem(LS, "1"); } catch { /* ignore */ }
      setAuthed(true);
    } else {
      setPwErr("Senha inválida");
    }
  };

  const logout = () => {
    try { localStorage.removeItem(LS); } catch { /* ignore */ }
    setAuthed(false);
    setPw("");
    setPwErr("");
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setListErr("");
    try {
      const r = await fetch("/api/users");
      if (!r.ok) throw new Error("HTTP " + r.status);
      const data = await r.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("[admin] loadUsers:", e);
      setListErr("Erro ao carregar usuários: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) loadUsers();
  }, [authed, loadUsers]);

  const setValidacao = async (email: string, status_validacao: string, observacao_admin?: string) => {
    setActing(email + status_validacao);
    setMsg("");
    try {
      const r = await fetch("/api/users/validate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, status_validacao, observacao_admin }),
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const icon = status_validacao === "APROVADO" ? "✅" : status_validacao === "RECUSADO" ? "❌" : "⏳";
      setMsg(`${icon} ${email} → ${status_validacao}`);
      await loadUsers();
    } catch (e) {
      console.error("[admin] setValidacao:", e);
      setMsg("❌ Erro: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setActing("");
    }
  };

  const promote = async (email: string) => {
    setActing(email + "PREMIUM");
    setMsg("");
    try {
      const r = await fetch("/api/users/plan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, plano: "PREMIUM" }),
      });
      if (!r.ok) {
        const j = await r.json() as { error?: string };
        throw new Error(j.error ?? "HTTP " + r.status);
      }
      setMsg("✅ " + email + " atualizado para PREMIUM");
      await loadUsers();
    } catch (e) {
      console.error("[admin] promote:", e);
      setMsg("❌ Erro: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setActing("");
    }
  };

  const demote = async (email: string) => {
    setActing(email + "FREE");
    setMsg("");
    try {
      const r = await fetch("/api/users/plan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, plano: "FREE" }),
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      setMsg("⚠️ " + email + " revertido para FREE");
      await loadUsers();
    } catch (e) {
      console.error("[admin] demote:", e);
      setMsg("❌ Erro: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setActing("");
    }
  };

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
        <div style={{ background: "#111", border: "1px solid #333", borderRadius: "1rem", padding: "2rem", width: "100%", maxWidth: "360px" }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: "1.2rem", marginBottom: "1.5rem" }}>
            🔐 Painel Admin ORAKULUS IA
          </div>
          <div style={{ marginBottom: "0.5rem", color: "#aaa", fontSize: "0.875rem" }}>Senha de acesso</div>
          <input
            type="password"
            value={pw}
            onChange={e => { setPw(e.target.value); setPwErr(""); }}
            onKeyDown={e => { if (e.key === "Enter") login(); }}
            placeholder="••••••••"
            style={{ width: "100%", background: "#000", border: "1px solid #444", borderRadius: "0.5rem", padding: "0.75rem 1rem", color: "#fff", fontSize: "1rem", boxSizing: "border-box", marginBottom: "0.5rem" }}
          />
          {pwErr && <div style={{ color: "#f87171", fontSize: "0.875rem", marginBottom: "0.75rem" }}>{pwErr}</div>}
          <button
            onClick={login}
            style={{ width: "100%", background: "#10b981", color: "#000", fontWeight: 700, border: "none", borderRadius: "0.5rem", padding: "0.75rem", fontSize: "0.9rem", cursor: "pointer", marginTop: "0.5rem" }}
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }

  const pendentes = users.filter(u => u.status_validacao === "PENDENTE");
  const outros = users.filter(u => u.status_validacao !== "PENDENTE");

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", padding: "1.5rem" }}>
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", background: "#111", border: "1px solid #333", borderRadius: "0.75rem", padding: "1rem 1.25rem" }}>
          <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>🛠️ Painel Admin ORAKULUS IA</div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", color: "#888" }}>
              {pendentes.length > 0 && <span style={{ color: "#fbbf24", fontWeight: 700 }}>⏳ {pendentes.length} pendente{pendentes.length > 1 ? "s" : ""}</span>}
            </span>
            <button
              onClick={logout}
              style={{ background: "transparent", border: "1px solid #555", color: "#aaa", borderRadius: "0.5rem", padding: "0.4rem 0.9rem", cursor: "pointer", fontSize: "0.85rem" }}
            >
              Sair
            </button>
          </div>
        </div>

        {/* Feedback */}
        {msg && (
          <div style={{ background: msg.startsWith("✅") ? "#052e16" : msg.startsWith("⚠️") ? "#1c1507" : "#3b0000", border: "1px solid " + (msg.startsWith("✅") ? "#16a34a" : msg.startsWith("⚠️") ? "#d97706" : "#dc2626"), borderRadius: "0.5rem", padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.875rem" }}>
            {msg}
          </div>
        )}

        {/* User list */}
        <div style={{ background: "#111", border: "1px solid #333", borderRadius: "0.75rem", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", borderBottom: "1px solid #333" }}>
            <div style={{ fontWeight: 600 }}>
              👥 Gestão de Usuários{" "}
              {users.length > 0 && <span style={{ color: "#888", fontSize: "0.8rem", marginLeft: "0.5rem" }}>({users.length})</span>}
            </div>
            <button
              onClick={loadUsers}
              disabled={loading}
              style={{ background: "transparent", border: "1px solid #444", color: "#ccc", borderRadius: "0.5rem", padding: "0.4rem 0.9rem", cursor: loading ? "not-allowed" : "pointer", fontSize: "0.85rem", opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Carregando..." : "Atualizar lista"}
            </button>
          </div>

          <div style={{ padding: "1rem 1.25rem" }}>
            {listErr ? (
              <div style={{ color: "#f87171", fontSize: "0.875rem", padding: "1rem 0" }}>{listErr}</div>
            ) : loading ? (
              <div style={{ color: "#666", fontSize: "0.875rem", padding: "1rem 0" }}>Carregando usuários...</div>
            ) : users.length === 0 ? (
              <div style={{ color: "#666", fontSize: "0.875rem", textAlign: "center", padding: "2rem 0" }}>
                Nenhum usuário cadastrado ainda.
              </div>
            ) : (
              <div>
                {/* Pendentes first */}
                {pendentes.length > 0 && (
                  <div style={{ marginBottom: "0.5rem", fontSize: "0.7rem", fontWeight: 700, color: "#fbbf24", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                    ⏳ Aguardando validação ({pendentes.length})
                  </div>
                )}
                {[...pendentes, ...outros].map(u => {
                  const sv = u.status_validacao ?? "PENDENTE";
                  const vbadge = validacaoBadge(sv);
                  const isPremiumActive = u.plano === "PREMIUM" && !isExpired(u.data_expiracao);
                  const isPremiumExpired = u.plano === "PREMIUM" && isExpired(u.data_expiracao);
                  const isBusy = acting.startsWith(u.email);
                  const obs = obsEdit[u.id] ?? u.observacao_admin ?? "";

                  return (
                    <div
                      key={u.id}
                      style={{
                        border: "1px solid " + (sv === "PENDENTE" ? "#92400e" : sv === "APROVADO" ? (isPremiumActive ? "#065f46" : "#2d4a3e") : "#4a1919"),
                        background: sv === "PENDENTE" ? "#0f0b02" : sv === "APROVADO" ? (isPremiumActive ? "#022c22" : "#091a14") : "#100808",
                        borderRadius: "0.6rem",
                        padding: "1rem",
                        marginBottom: "0.75rem",
                      }}
                    >
                      {/* Top row: name + badges + plano */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                        <span style={{ fontWeight: 700, fontSize: "0.92rem" }}>{u.nome || "—"}</span>
                        {/* Validacao badge */}
                        <span style={{ background: vbadge.bg, border: "1px solid " + vbadge.border, color: vbadge.color, fontSize: "0.62rem", fontWeight: 700, padding: "0.1rem 0.55rem", borderRadius: "999px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                          {vbadge.label}
                        </span>
                        {/* Plan badge */}
                        {isPremiumActive ? (
                          <span style={{ background: "#064e3b", border: "1px solid #10b981", color: "#34d399", fontSize: "0.62rem", fontWeight: 700, padding: "0.1rem 0.55rem", borderRadius: "999px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                            PREMIUM
                          </span>
                        ) : isPremiumExpired ? (
                          <span style={{ background: "#3b0000", border: "1px solid #dc2626", color: "#f87171", fontSize: "0.62rem", fontWeight: 700, padding: "0.1rem 0.55rem", borderRadius: "999px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                            VENCIDO
                          </span>
                        ) : (
                          <span style={{ background: "#1c1c1c", border: "1px solid #444", color: "#888", fontSize: "0.62rem", fontWeight: 700, padding: "0.1rem 0.55rem", borderRadius: "999px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                            FREE
                          </span>
                        )}
                      </div>

                      {/* User details */}
                      <div style={{ fontSize: "0.73rem", color: "#888", fontFamily: "monospace", lineHeight: "1.7", marginBottom: "0.6rem" }}>
                        <div><span style={{ color: "#555" }}>email: </span>{u.email || "—"}</div>
                        <div><span style={{ color: "#555" }}>corretora: </span>{u.id_corretora || "—"}</div>
                        <div><span style={{ color: "#555" }}>depósito: </span>{u.status_deposito || "—"}</div>
                        <div><span style={{ color: "#555" }}>sinais usados: </span><span style={{ color: "#e5e7eb" }}>{u.sinais_consumidos ?? 0}</span></div>
                        <div><span style={{ color: "#555" }}>sinais extras: </span><span style={{ color: u.sinais_extras_liberados ? "#34d399" : "#888" }}>{u.sinais_extras_liberados ?? 0}</span></div>
                        <div><span style={{ color: "#555" }}>cadastro: </span>{fmtDate(u.data_cadastro)}</div>
                        {u.comprovante_deposito && (
                          <div>
                            <span style={{ color: "#555" }}>comprovante: </span>
                            {u.comprovante_deposito.startsWith("http") ? (
                              <a href={u.comprovante_deposito} target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", textDecoration: "underline" }}>
                                {u.comprovante_deposito.length > 60 ? u.comprovante_deposito.slice(0, 60) + "…" : u.comprovante_deposito}
                              </a>
                            ) : (
                              <span style={{ color: "#ccc" }}>{u.comprovante_deposito}</span>
                            )}
                          </div>
                        )}
                        {isPremiumActive && u.data_expiracao && (
                          <div><span style={{ color: "#555" }}>expira: </span><span style={{ color: "#fbbf24" }}>{fmtDateBR(u.data_expiracao)}</span></div>
                        )}
                        {isPremiumExpired && (
                          <div><span style={{ color: "#f87171", fontWeight: 700 }}>🔴 Plano vencido em {fmtDateBR(u.data_expiracao)}</span></div>
                        )}
                        {u.observacao_admin && (
                          <div><span style={{ color: "#555" }}>obs admin: </span><span style={{ color: "#e5e7eb" }}>{u.observacao_admin}</span></div>
                        )}
                      </div>

                      {/* Observação admin input */}
                      <div style={{ marginBottom: "0.75rem" }}>
                        <input
                          type="text"
                          placeholder="Observação interna (opcional)"
                          value={obs}
                          onChange={e => setObsEdit(prev => ({ ...prev, [u.id]: e.target.value }))}
                          style={{ width: "100%", background: "#000", border: "1px solid #333", borderRadius: "0.4rem", padding: "0.4rem 0.7rem", color: "#ccc", fontSize: "0.78rem", boxSizing: "border-box", fontFamily: "monospace" }}
                        />
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
                        {/* Validation actions */}
                        {sv !== "APROVADO" && (
                          <button
                            disabled={isBusy}
                            onClick={() => setValidacao(u.email, "APROVADO", obs || undefined)}
                            style={{ background: "#10b981", color: "#000", border: "none", borderRadius: "0.4rem", padding: "0.4rem 0.9rem", fontWeight: 700, fontSize: "0.76rem", cursor: isBusy ? "not-allowed" : "pointer", opacity: isBusy ? 0.6 : 1 }}
                          >
                            ✅ Aprovar acesso
                          </button>
                        )}
                        {sv !== "RECUSADO" && (
                          <button
                            disabled={isBusy}
                            onClick={() => setValidacao(u.email, "RECUSADO", obs || undefined)}
                            style={{ background: "transparent", color: "#f87171", border: "1px solid #f87171", borderRadius: "0.4rem", padding: "0.4rem 0.9rem", fontWeight: 700, fontSize: "0.76rem", cursor: isBusy ? "not-allowed" : "pointer", opacity: isBusy ? 0.6 : 1 }}
                          >
                            ❌ Recusar acesso
                          </button>
                        )}
                        {sv === "APROVADO" && (
                          <button
                            disabled={isBusy}
                            onClick={() => setValidacao(u.email, "PENDENTE", obs || undefined)}
                            style={{ background: "transparent", color: "#fbbf24", border: "1px solid #d97706", borderRadius: "0.4rem", padding: "0.4rem 0.9rem", fontWeight: 700, fontSize: "0.76rem", cursor: isBusy ? "not-allowed" : "pointer", opacity: isBusy ? 0.6 : 1 }}
                          >
                            ⏳ Reverter para Pendente
                          </button>
                        )}

                        {/* Separator */}
                        <span style={{ color: "#444", fontSize: "0.75rem" }}>|</span>

                        {/* Plan actions — only if APROVADO */}
                        {sv === "APROVADO" && (
                          isPremiumActive ? (
                            <button
                              disabled={isBusy}
                              onClick={() => demote(u.email)}
                              style={{ background: "transparent", color: "#f87171", border: "1px solid #f87171", borderRadius: "0.4rem", padding: "0.4rem 0.9rem", fontWeight: 700, fontSize: "0.76rem", cursor: isBusy ? "not-allowed" : "pointer", opacity: isBusy ? 0.6 : 1 }}
                            >
                              {isBusy ? "..." : "✖ Remover Premium"}
                            </button>
                          ) : (
                            <button
                              disabled={isBusy}
                              onClick={() => promote(u.email)}
                              style={{ background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "0.4rem", padding: "0.4rem 0.9rem", fontWeight: 700, fontSize: "0.76rem", cursor: isBusy ? "not-allowed" : "pointer", opacity: isBusy ? 0.6 : 1 }}
                            >
                              {isBusy ? "..." : "⭐ Ativar Premium"}
                            </button>
                          )
                        )}
                        {sv !== "APROVADO" && (
                          <span style={{ fontSize: "0.72rem", color: "#666", fontStyle: "italic" }}>
                            Aprove primeiro para ativar Premium
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
