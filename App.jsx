import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

/* ------------------------------------------------------------------ */
/*  Supabase                                                            */
/* ------------------------------------------------------------------ */
/*
  Crie o projeto em https://supabase.com, pegue a "Project URL" e a
  "anon public key" em Project Settings > API, e cole abaixo.
  Depois rode o SQL do arquivo schema.sql (enviado junto) no SQL Editor
  do Supabase antes de usar este app.
*/
const SUPABASE_URL = import.meta.env.SUPABASE_URL ;
const SUPABASE_ANON_KEY = import.meta.env.SUPABASE_ANON_KEY ;

const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

function supabaseIndisponivel() {
  return new Error(
    "Supabase não configurado. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas variáveis de ambiente da Vercel."
  );
}

/* ------------------------------------------------------------------ */
/*  Utilidades                                                         */
/* ------------------------------------------------------------------ */

const AREAS = [
  "Ator / Atriz",
  "Cantor(a)",
  "DanÃ§arino(a)",
  "Modelo",
  "FotÃ³grafo(a)",
  "Ilustrador(a) / Artista visual",
  "MÃºsico(a) / Instrumentista",
  "Diretor(a)",
  "Produtor(a)",
  "Grafiteiro(a) / Muralista",
  "Maquiador(a) / Beleza",
  "Outro",
];

function mensagemErroSupabase(erro) {
  if (!erro) return "Algo deu errado. Tente novamente.";
  const m = erro.message || "";
  if (m.includes("already registered") || m.includes("already exists")) {
    return "JÃ¡ existe uma conta com esse e-mail.";
  }
  if (m.includes("Invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (m.includes("Password should be")) {
    return "A senha precisa ter pelo menos 6 caracteres.";
  }
  return m || "Algo deu errado. Tente novamente.";
}

/* Carrega o perfil (artista ou empresa) associado a um usuÃ¡rio autenticado */
async function carregarPerfilDoUsuario(user) {
  if (!user) return null;

  const { data: artista } = await supabase
    .from("artistas")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (artista) return { tipo: "artista", ...artista };

  const { data: empresa } = await supabase
    .from("empresas")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (empresa) return { tipo: "empresa", ...empresa };

  return null;
}

/* ------------------------------------------------------------------ */
/*  Estilo global                                                      */
/* ------------------------------------------------------------------ */

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Sora:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap');

    :root{
      --terra:#3C2A1E;
      --coffee:#6B4A34;
      --terracotta:#C1652F;
      --terracotta-deep:#A6501F;
      --ochre:#C68A2E;
      --blush:#E9D6C8;
      --cream:#F7EEE4;
      --cream-2:#FBF6F0;
      --ink:#2A1D15;
      --line: rgba(60,42,30,0.18);
    }
    *{box-sizing:border-box;}
    body,html{margin:0;padding:0;}
    .app{
      font-family:'Sora',sans-serif;
      background:var(--cream);
      color:var(--ink);
      min-height:100vh;
      line-height:1.5;
    }
    .wrap{max-width:1120px;margin:0 auto;padding:0 24px;}
    .eyebrow{
      font-family:'IBM Plex Mono',monospace;
      font-size:11px;
      letter-spacing:0.14em;
      text-transform:uppercase;
      color:var(--terracotta-deep);
      font-weight:500;
    }
    h1,h2,h3,.serif{font-family:'Fraunces',serif;}
    a{color:inherit;}
    button{font-family:'Sora',sans-serif;cursor:pointer;}

    /* ---------- header ---------- */
    .header{
      position:sticky;top:0;z-index:40;
      background:rgba(247,238,228,0.92);
      backdrop-filter:blur(6px);
      border-bottom:1px solid var(--line);
    }
    .header-inner{display:flex;align-items:center;justify-content:space-between;height:72px;}
    .logo{
      font-family:'Fraunces',serif;font-style:italic;font-weight:600;
      font-size:22px;color:var(--terra);letter-spacing:-0.01em;
      display:flex;align-items:center;gap:8px;
    }
    .logo .dot{width:9px;height:9px;border-radius:50%;background:var(--terracotta);display:inline-block;}
    .nav{display:flex;align-items:center;gap:4px;}
    .navbtn{
      background:transparent;border:none;padding:9px 16px;border-radius:999px;
      font-size:14px;font-weight:600;color:var(--coffee);
    }
    .navbtn:hover{background:var(--blush);}
    .navbtn.active{background:var(--terra);color:var(--cream-2);}
    .btn-primary{
      background:var(--terracotta);color:#fff;border:none;padding:11px 20px;
      border-radius:999px;font-weight:700;font-size:14px;
    }
    .btn-primary:hover{background:var(--terracotta-deep);}
    .btn-primary:disabled{opacity:0.55;cursor:default;}
    .btn-ghost{
      background:transparent;border:1.5px solid var(--terra);color:var(--terra);
      padding:9.5px 18px;border-radius:999px;font-weight:700;font-size:14px;
    }
    .btn-ghost:hover{background:var(--terra);color:var(--cream-2);}
    .btn-link{background:none;border:none;color:var(--terracotta-deep);font-weight:700;font-size:14px;padding:0;text-decoration:underline;text-underline-offset:3px;}

    /* ---------- hero ---------- */
    .hero{padding:76px 0 88px;}
    .hero-grid{display:grid;grid-template-columns:1.05fr 0.95fr;gap:56px;align-items:center;}
    .hero h1{font-size:48px;line-height:1.06;font-weight:600;color:var(--terra);margin:14px 0 20px;letter-spacing:-0.01em;}
    .hero p.lead{font-size:17px;color:var(--coffee);max-width:460px;margin-bottom:30px;}
    .hero-ctas{display:flex;gap:12px;flex-wrap:wrap;}

    .mural{position:relative;height:420px;}
    .pin{
      position:absolute;border-radius:14px;padding:16px;
      box-shadow:0 14px 30px -12px rgba(42,29,21,0.35);
      color:#fff;width:168px;
    }
    .pin .num{font-family:'IBM Plex Mono',monospace;font-size:10px;opacity:0.75;letter-spacing:0.08em;}
    .pin .name{font-family:'Fraunces',serif;font-size:20px;margin-top:20px;line-height:1.1;}
    .pin .role{font-size:11px;margin-top:6px;opacity:0.85;font-family:'IBM Plex Mono',monospace;}

    /* ---------- seÃ§Ãµes gerais ---------- */
    .section{padding:64px 0;}
    .section.alt{background:var(--blush);}
    .valueprops{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;margin-top:34px;}
    .vp{border-top:2px solid var(--terra);padding-top:16px;}
    .vp h3{font-size:19px;margin:10px 0 8px;color:var(--terra);}
    .vp p{color:var(--coffee);font-size:14.5px;margin:0;}

    /* ---------- forms ---------- */
    .card{
      background:var(--cream-2);border:1px solid var(--line);border-radius:18px;
      padding:36px;
    }
    .formgrid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
    .field{display:flex;flex-direction:column;gap:6px;margin-bottom:16px;}
    .field label{font-size:12.5px;font-weight:700;color:var(--terra);}
    .field input,.field select,.field textarea{
      font-family:'Sora',sans-serif;font-size:14.5px;padding:11px 13px;
      border:1.5px solid var(--line);border-radius:10px;background:#fff;color:var(--ink);
    }
    .field input:focus,.field select:focus,.field textarea:focus,button:focus-visible{
      outline:2.5px solid var(--terracotta);outline-offset:1px;
    }
    .field textarea{resize:vertical;min-height:80px;}
    .hint{font-size:12px;color:var(--coffee);opacity:0.85;}
    .portfolio-draft-item{
      display:grid;grid-template-columns:1fr 1fr auto;gap:10px;align-items:end;
      background:var(--cream);border:1px dashed var(--line);border-radius:10px;padding:12px;margin-bottom:10px;
    }
    .iconbtn{background:none;border:none;color:var(--terracotta-deep);font-weight:700;font-size:13px;}
    .errorbox{background:#fbe7e0;border:1px solid var(--terracotta);color:var(--terracotta-deep);padding:10px 14px;border-radius:10px;font-size:13.5px;margin-bottom:16px;}
    .okbox{background:#e9f2e6;border:1px solid #6b8f5c;color:#3d5c33;padding:10px 14px;border-radius:10px;font-size:13.5px;margin-bottom:16px;}

    /* ---------- diretÃ³rio ---------- */
    .dir-layout{display:grid;grid-template-columns:250px 1fr;gap:36px;align-items:start;}
    .filters{position:sticky;top:96px;background:var(--cream-2);border:1px solid var(--line);border-radius:16px;padding:22px;}
    .filters h4{margin:0 0 14px;font-size:13px;text-transform:uppercase;letter-spacing:0.08em;color:var(--terra);font-family:'IBM Plex Mono',monospace;}
    .grid-artists{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;}
    .ficha{
      background:var(--cream-2);border:1px solid var(--line);border-radius:16px;padding:22px;
      position:relative;cursor:pointer;transition:box-shadow .15s, transform .15s;
    }
    .ficha:hover{box-shadow:0 12px 26px -14px rgba(42,29,21,0.35);transform:translateY(-2px);}
    .ficha .tag{position:absolute;top:18px;right:18px;font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--terracotta-deep);border:1px solid var(--terracotta);border-radius:6px;padding:2px 6px;}
    .ficha .name{font-family:'Fraunces',serif;font-size:22px;color:var(--terra);margin:0 0 4px;padding-right:60px;}
    .ficha .meta{font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--coffee);letter-spacing:0.02em;}
    .ficha hr{border:none;border-top:1px solid var(--line);margin:14px 0;}
    .ficha .bio{font-size:13.5px;color:var(--coffee);margin:0;}
    .empty{padding:50px 0;text-align:center;color:var(--coffee);}

    /* ---------- perfil ---------- */
    .profile-top{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;flex-wrap:wrap;}
    .profile-top .name{font-size:40px;margin:6px 0 8px;color:var(--terra);}
    .profile-meta{font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:var(--coffee);letter-spacing:0.03em;}
    .contact-box{background:var(--blush);border-radius:14px;padding:18px 20px;margin-top:22px;}
    .contact-box h4{margin:0 0 10px;font-size:12.5px;text-transform:uppercase;letter-spacing:0.08em;color:var(--terra);font-family:'IBM Plex Mono',monospace;}
    .contact-row{display:flex;gap:8px;font-size:14px;margin-bottom:6px;}
    .contact-row .k{font-weight:700;color:var(--terra);min-width:100px;}
    .portfolio-strip{display:flex;gap:16px;overflow-x:auto;padding:6px 2px 14px;margin-top:14px;}
    .pf-card{min-width:220px;background:var(--cream-2);border:1px solid var(--line);border-radius:14px;padding:16px;flex-shrink:0;}
    .pf-card .pnum{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--terracotta-deep);}
    .pf-card h5{margin:8px 0 6px;font-family:'Fraunces',serif;font-size:17px;color:var(--terra);}
    .pf-card p{font-size:13px;color:var(--coffee);margin:0 0 8px;}

    /* ---------- vagas ---------- */
    .job-card{background:var(--cream-2);border:1px solid var(--line);border-radius:16px;padding:22px;margin-bottom:16px;}
    .job-card .top{display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;}
    .job-card h3{margin:0;font-size:20px;color:var(--terra);}
    .job-card .company{font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--terracotta-deep);}
    .job-card .req{font-size:13.5px;color:var(--coffee);white-space:pre-wrap;margin-top:10px;}
    .pill{display:inline-block;background:var(--blush);color:var(--terra);font-size:11.5px;font-weight:700;padding:3px 10px;border-radius:999px;margin-right:6px;}

    .footer{border-top:1px solid var(--line);padding:26px 0;margin-top:40px;}
    .footer p{font-size:12px;color:var(--coffee);margin:0;}

    .loading{padding:60px 0;text-align:center;color:var(--coffee);font-family:'IBM Plex Mono',monospace;font-size:13px;}

    @media (max-width:840px){
      .hero-grid{grid-template-columns:1fr;}
      .mural{display:none;}
      .valueprops{grid-template-columns:1fr;}
      .dir-layout{grid-template-columns:1fr;}
      .filters{position:static;}
      .grid-artists{grid-template-columns:1fr;}
      .formgrid{grid-template-columns:1fr;}
      .hero h1{font-size:34px;}
    }
    @media (prefers-reduced-motion: reduce){
      .ficha{transition:none;}
    }
  `}</style>
);

/* ------------------------------------------------------------------ */
/*  App                                                                 */
/* ------------------------------------------------------------------ */

export default function App() {
  const [view, setView] = useState("home");
  const [carregando, setCarregando] = useState(true);
  const [artistas, setArtistas] = useState([]);
  const [vagas, setVagas] = useState([]);
  const [usuario, setUsuario] = useState(null); // {tipo:'artista'|'empresa', ...dados}
  const [perfilAberto, setPerfilAberto] = useState(null);
  const [msg, setMsg] = useState(null);
  const [sessaoCarregada, setSessaoCarregada] = useState(false);

  const carregarTudo = useCallback(async () => {
    if (!supabase) {
      setCarregando(false);
      return;
    }
    setCarregando(true);
    const [{ data: a }, { data: v }] = await Promise.all([
      supabase.from("artistas").select("*").order("criado_em", { ascending: false }),
      supabase.from("vagas").select("*").order("criado_em", { ascending: false }),
    ]);
    setArtistas(a || []);
    setVagas(v || []);
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregarTudo();
  }, [carregarTudo]);

  // MantÃ©m a sessÃ£o ao recarregar a pÃ¡gina e reage a login/logout
  useEffect(() => {
    if (!supabase) {
      setSessaoCarregada(true);
      return;
    }
    let ativo = true;

    supabase.auth.getSession().then(async ({ data }) => {
      const perfil = await carregarPerfilDoUsuario(data.session?.user);
      if (ativo) {
        setUsuario(perfil);
        setSessaoCarregada(true);
      }
    });

    const { data: assinatura } = supabase.auth.onAuthStateChange(async (_evento, session) => {
      const perfil = await carregarPerfilDoUsuario(session?.user);
      if (ativo) setUsuario(perfil);
    });

    return () => {
      ativo = false;
      assinatura.subscription.unsubscribe();
    };
  }, []);

  const irPara = (v) => {
    setMsg(null);
    setView(v);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sair = async () => {
    if (supabase) await supabase.auth.signOut();
    setUsuario(null);
    irPara("home");
  };

  return (
    <div className="app">
      <GlobalStyle />
      <Header view={view} irPara={irPara} usuario={usuario} onSair={sair} />

      {view === "home" && <Home irPara={irPara} artistas={artistas} />}

      {view === "diretorio" && (
        <Directory
          carregando={carregando}
          artistas={artistas}
          onAbrirPerfil={(a) => { setPerfilAberto(a); irPara("perfil"); }}
        />
      )}

      {view === "perfil" && perfilAberto && (
        <PerfilArtista artista={perfilAberto} onVoltar={() => irPara("diretorio")} />
      )}

      {view === "vagas" && (
        <Vagas carregando={carregando} vagas={vagas} />
      )}

      {view === "escolhaCadastro" && <EscolhaCadastro irPara={irPara} />}

      {view === "cadastroArtista" && (
        <CadastroArtista
          irPara={irPara}
          onCadastrado={async (perfil) => {
            setUsuario(perfil);
            await carregarTudo();
            irPara("meuPerfil");
          }}
        />
      )}

      {view === "cadastroEmpresa" && (
        <CadastroEmpresa
          irPara={irPara}
          onCadastrado={(perfil) => { setUsuario(perfil); irPara("painelEmpresa"); }}
        />
      )}

      {view === "login" && (
        <Login
          irPara={irPara}
          onLogin={async (perfil) => {
            setUsuario(perfil);
            await carregarTudo();
            irPara(perfil.tipo === "empresa" ? "painelEmpresa" : "meuPerfil");
          }}
        />
      )}

      {view === "meuPerfil" && usuario && usuario.tipo === "artista" && (
        <PerfilArtista artista={usuario} onVoltar={() => irPara("home")} dono />
      )}

      {view === "painelEmpresa" && usuario && usuario.tipo === "empresa" && (
        <PainelEmpresa
          usuario={usuario}
          vagas={vagas.filter((v) => v.empresa_email === usuario.email)}
          onPublicada={carregarTudo}
        />
      )}

      <footer className="footer">
        <div className="wrap">
          <p>ATERRO usa Supabase para autenticaÃ§Ã£o e armazenamento dos dados. Nenhuma senha Ã© guardada em texto puro â€” isso Ã© feito pelo Supabase Auth.</p>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Header                                                              */
/* ------------------------------------------------------------------ */

function Header({ view, irPara, usuario, onSair }) {
  return (
    <header className="header">
      <div className="wrap header-inner">
        <div className="logo" onClick={() => irPara("home")} style={{ cursor: "pointer" }}>
          <span className="dot" />ATERRO
        </div>
        <nav className="nav">
          <button className={`navbtn ${view === "diretorio" ? "active" : ""}`} onClick={() => irPara("diretorio")}>DiretÃ³rio</button>
          <button className={`navbtn ${view === "vagas" ? "active" : ""}`} onClick={() => irPara("vagas")}>Vagas</button>
          {!usuario && (
            <>
              <button className="navbtn" onClick={() => irPara("login")}>Entrar</button>
              <button className="btn-primary" style={{ marginLeft: 6 }} onClick={() => irPara("escolhaCadastro")}>Cadastrar</button>
            </>
          )}
          {usuario && usuario.tipo === "artista" && (
            <>
              <button className="navbtn" onClick={() => irPara("meuPerfil")}>Meu perfil</button>
              <button className="btn-ghost" style={{ marginLeft: 6 }} onClick={onSair}>Sair</button>
            </>
          )}
          {usuario && usuario.tipo === "empresa" && (
            <>
              <button className="navbtn" onClick={() => irPara("painelEmpresa")}>Painel da empresa</button>
              <button className="btn-ghost" style={{ marginLeft: 6 }} onClick={onSair}>Sair</button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Home                                                                */
/* ------------------------------------------------------------------ */

const CORES_PIN = ["var(--terracotta)", "var(--coffee)", "var(--ochre)", "var(--terra)"];
const PINS = [
  { top: "0%", left: "6%", rot: "-6deg", nome: "Ayo M.", papel: "FOTOGRAFIA" },
  { top: "6%", left: "46%", rot: "4deg", nome: "Dandara S.", papel: "DANÃ‡A" },
  { top: "40%", left: "2%", rot: "3deg", nome: "Kaique R.", papel: "MÃšSICA" },
  { top: "46%", left: "44%", rot: "-4deg", nome: "ÃŒyÃ¡ B.", papel: "ARTES VISUAIS" },
  { top: "26%", left: "70%", rot: "-3deg", nome: "Preto N.", papel: "ATUAÃ‡ÃƒO" },
];

function Home({ irPara, artistas }) {
  const destaques = artistas.slice(0, 4);

  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <span className="eyebrow">Vitrine de talentos negros e perifÃ©ricos</span>
            <h1>Talento que jÃ¡ existe. Visibilidade que faltava.</h1>
            <p className="lead">
              Um espaÃ§o para artistas negros e perifÃ©ricos publicarem portfÃ³lio, trajetÃ³ria
              e contatos â€” e para marcas e agÃªncias encontrarem quem procuram, com filtros
              diretos e sem intermediÃ¡rio.
            </p>
            <div className="hero-ctas">
              <button className="btn-primary" onClick={() => irPara("diretorio")}>Ver artistas</button>
              <button className="btn-ghost" onClick={() => irPara("escolhaCadastro")}>Quero me cadastrar</button>
            </div>
          </div>
          <div className="mural" aria-hidden="true">
            {PINS.map((p, i) => (
              <div
                key={p.nome}
                className="pin"
                style={{
                  top: p.top,
                  left: p.left,
                  transform: `rotate(${p.rot})`,
                  background: CORES_PIN[i % CORES_PIN.length],
                }}
              >
                <div className="num">{String(i + 1).padStart(2, "0")}</div>
                <div className="name">{p.nome}</div>
                <div className="role">{p.papel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <span className="eyebrow">Como funciona</span>
          <div className="valueprops">
            <div className="vp">
              <h3>Publique seu trabalho</h3>
              <p>Monte um perfil com sua Ã¡rea, sua trajetÃ³ria e as peÃ§as que representam melhor o seu trabalho â€” sem precisar de site prÃ³prio.</p>
            </div>
            <div className="vp">
              <h3>Seja encontrado direto</h3>
              <p>Marcas e produtoras filtram por Ã¡rea e cidade e chegam atÃ© seu contato sem passar por agÃªncia ou intermediÃ¡rio.</p>
            </div>
            <div className="vp">
              <h3>Veja as vagas abertas</h3>
              <p>Empresas publicam oportunidades reais â€” casting, ilustraÃ§Ã£o, trilha, produÃ§Ã£o â€” com o que esperam de quem vai topar o trabalho.</p>
            </div>
          </div>
        </div>
      </section>

      {destaques.length > 0 && (
        <section className="section alt">
          <div className="wrap">
            <span className="eyebrow">Quem estÃ¡ no ATERRO</span>
            <div className="grid-artists" style={{ marginTop: 28 }}>
              {destaques.map((a) => (
                <div key={a.id} className="ficha" onClick={() => irPara("diretorio")}>
                  <span className="tag">{a.area}</span>
                  <h3 className="name">{a.nome}</h3>
                  <div className="meta">{a.cidade || "LocalizaÃ§Ã£o nÃ£o informada"}</div>
                  <hr />
                  <p className="bio">{a.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  DiretÃ³rio                                                           */
/* ------------------------------------------------------------------ */

function Directory({ carregando, artistas, onAbrirPerfil }) {
  const [busca, setBusca] = useState("");
  const [area, setArea] = useState("");
  const [cidade, setCidade] = useState("");

  const cidades = useMemo(() => {
    const s = new Set(artistas.map((a) => a.cidade).filter(Boolean));
    return Array.from(s).sort();
  }, [artistas]);

  const filtrados = useMemo(() => {
    return artistas.filter((a) => {
      if (busca && !a.nome?.toLowerCase().includes(busca.toLowerCase())) return false;
      if (area && a.area !== area) return false;
      if (cidade && a.cidade !== cidade) return false;
      return true;
    });
  }, [artistas, busca, area, cidade]);

  return (
    <section className="section">
      <div className="wrap">
        <span className="eyebrow">DiretÃ³rio</span>
        <h2 style={{ margin: "10px 0 28px", color: "var(--terra)" }}>Encontre quem procura</h2>

        <div className="dir-layout">
          <aside className="filters">
            <h4>Nome</h4>
            <input
              placeholder="Buscar por nome"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: "1.5px solid var(--line)", marginBottom: 20, fontFamily: "Sora, sans-serif" }}
            />
            <h4>Ãrea</h4>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: "1.5px solid var(--line)", marginBottom: 20, fontFamily: "Sora, sans-serif" }}
            >
              <option value="">Todas</option>
              {AREAS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <h4>Cidade</h4>
            <select
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: "1.5px solid var(--line)", fontFamily: "Sora, sans-serif" }}
            >
              <option value="">Todas</option>
              {cidades.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </aside>

          <div>
            {carregando && artistas.length === 0 && <div className="loading">Carregando artistasâ€¦</div>}

            {!carregando && filtrados.length === 0 && (
              <div className="empty">Nenhum artista encontrado com esses filtros.</div>
            )}

            <div className="grid-artists">
              {filtrados.map((a) => (
                <div key={a.id} className="ficha" onClick={() => onAbrirPerfil(a)}>
                  <span className="tag">{a.area}</span>
                  <h3 className="name">{a.nome}</h3>
                  <div className="meta">{a.cidade || "LocalizaÃ§Ã£o nÃ£o informada"}</div>
                  <hr />
                  <p className="bio">{a.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Perfil do artista                                                   */
/* ------------------------------------------------------------------ */

function PerfilArtista({ artista, onVoltar, dono }) {
  const portfolio = Array.isArray(artista.portfolio) ? artista.portfolio : [];

  return (
    <section className="section">
      <div className="wrap">
        <button className="btn-link" onClick={onVoltar}>â† Voltar</button>

        <div className="profile-top" style={{ marginTop: 20 }}>
          <div>
            <span className="eyebrow">{artista.area}</span>
            <h2 className="name serif">{artista.nome}</h2>
            <div className="profile-meta">{artista.cidade || "LocalizaÃ§Ã£o nÃ£o informada"}</div>
          </div>
        </div>

        <p style={{ maxWidth: 620, marginTop: 20, color: "var(--coffee)", fontSize: 15 }}>{artista.bio}</p>

        {dono && (
          <div className="okbox" style={{ maxWidth: 620 }}>
            Este Ã© o seu perfil pÃºblico. Ã‰ o que empresas veem quando encontram vocÃª no diretÃ³rio.
          </div>
        )}

        <div className="contact-box" style={{ maxWidth: 620 }}>
          <h4>Contato</h4>
          {artista.email && (
            <div className="contact-row"><span className="k">E-mail</span><span>{artista.email}</span></div>
          )}
          {artista.telefone && (
            <div className="contact-row"><span className="k">Telefone</span><span>{artista.telefone}</span></div>
          )}
          {artista.instagram && (
            <div className="contact-row"><span className="k">Instagram</span><span>{artista.instagram}</span></div>
          )}
          {!artista.email && !artista.telefone && !artista.instagram && (
            <div className="contact-row">Nenhum contato informado.</div>
          )}
        </div>

        {portfolio.length > 0 && (
          <>
            <h4 style={{ marginTop: 32, marginBottom: 4, color: "var(--terra)", fontFamily: "IBM Plex Mono, monospace", fontSize: 12.5, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              PortfÃ³lio
            </h4>
            <div className="portfolio-strip">
              {portfolio.map((p, i) => (
                <div key={i} className="pf-card">
                  <div className="pnum">{String(i + 1).padStart(2, "0")}</div>
                  <h5>{p.titulo}</h5>
                  <p>{p.descricao}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Vagas                                                                */
/* ------------------------------------------------------------------ */

function Vagas({ carregando, vagas }) {
  return (
    <section className="section">
      <div className="wrap">
        <span className="eyebrow">Oportunidades</span>
        <h2 style={{ margin: "10px 0 28px", color: "var(--terra)" }}>Vagas publicadas por empresas</h2>

        {carregando && vagas.length === 0 && <div className="loading">Carregando vagasâ€¦</div>}
        {!carregando && vagas.length === 0 && <div className="empty">Nenhuma vaga publicada por enquanto.</div>}

        {vagas.map((v) => (
          <div key={v.id} className="job-card">
            <div className="top">
              <div>
                <h3>{v.titulo}</h3>
                <div className="company">{v.empresa_nome}</div>
              </div>
              {v.empresa_email && (
                <a className="btn-ghost" href={`mailto:${v.empresa_email}?subject=${encodeURIComponent("Interesse na vaga: " + v.titulo)}`}>
                  Entrar em contato
                </a>
              )}
            </div>
            <div style={{ marginTop: 10 }}>
              {v.area && <span className="pill">{v.area}</span>}
              {v.cidade && <span className="pill">{v.cidade}</span>}
            </div>
            {v.descricao && <p className="req">{v.descricao}</p>}
            {v.requisitos && (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--terra)", marginTop: 12 }}>O que esperam de quem topar</div>
                <p className="req">{v.requisitos}</p>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Escolha de cadastro                                                  */
/* ------------------------------------------------------------------ */

function EscolhaCadastro({ irPara }) {
  return (
    <section className="section">
      <div className="wrap" style={{ maxWidth: 760 }}>
        <span className="eyebrow">Cadastro</span>
        <h2 style={{ margin: "10px 0 30px", color: "var(--terra)" }}>Como vocÃª quer entrar no ATERRO?</h2>

        <div className="formgrid">
          <div className="card">
            <h3 className="serif" style={{ margin: "0 0 8px", color: "var(--terra)" }}>Sou artista</h3>
            <p style={{ color: "var(--coffee)", fontSize: 14, marginBottom: 20 }}>
              Publique seu portfÃ³lio, sua Ã¡rea de atuaÃ§Ã£o e seus contatos para ser encontrado por empresas e produtoras.
            </p>
            <button className="btn-primary" onClick={() => irPara("cadastroArtista")}>Criar perfil de artista</button>
          </div>
          <div className="card">
            <h3 className="serif" style={{ margin: "0 0 8px", color: "var(--terra)" }}>Sou empresa ou marca</h3>
            <p style={{ color: "var(--coffee)", fontSize: 14, marginBottom: 20 }}>
              Publique vagas e busque artistas negros e perifÃ©ricos direto no diretÃ³rio, sem intermediÃ¡rio.
            </p>
            <button className="btn-primary" onClick={() => irPara("cadastroEmpresa")}>Criar conta de empresa</button>
          </div>
        </div>

        <p style={{ marginTop: 26, fontSize: 14, color: "var(--coffee)" }}>
          JÃ¡ tem conta? <button className="btn-link" onClick={() => irPara("login")}>Entrar</button>
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Cadastro de artista                                                  */
/* ------------------------------------------------------------------ */

function CadastroArtista({ irPara, onCadastrado }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [area, setArea] = useState(AREAS[0]);
  const [cidade, setCidade] = useState("");
  const [telefone, setTelefone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [bio, setBio] = useState("");
  const [portfolio, setPortfolio] = useState([{ titulo: "", descricao: "" }]);
  const [erro, setErro] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const atualizarPortfolio = (i, campo, valor) => {
    setPortfolio((atual) => atual.map((p, idx) => (idx === i ? { ...p, [campo]: valor } : p)));
  };

  const adicionarPortfolio = () => setPortfolio((atual) => [...atual, { titulo: "", descricao: "" }]);
  const removerPortfolio = (i) => setPortfolio((atual) => atual.filter((_, idx) => idx !== i));

  const enviar = async (e) => {
    e.preventDefault();
    setErro(null);
    setAviso(null);

    if (!nome || !email || !senha) {
      setErro("Preencha nome, e-mail e senha.");
      return;
    }

    if (!supabase) {
      setErro(supabaseIndisponivel().message);
      return;
    }

    if (!supabase) {
      setErro(supabaseIndisponivel().message);
      return;
    }

    if (!supabase) {
      setErro(supabaseIndisponivel().message);
      return;
    }

    setEnviando(true);
    const { data, error } = await supabase.auth.signUp({ email, password: senha });

    if (error) {
      setErro(mensagemErroSupabase(error));
      setEnviando(false);
      return;
    }

    const portfolioLimpo = portfolio.filter((p) => p.titulo.trim());

    const { data: artista, error: erroInsert } = await supabase
      .from("artistas")
      .insert({
        user_id: data.user.id,
        nome,
        email,
        area,
        cidade,
        telefone,
        instagram,
        bio,
        portfolio: portfolioLimpo,
      })
      .select()
      .single();

    setEnviando(false);

    if (erroInsert) {
      setErro(mensagemErroSupabase(erroInsert));
      return;
    }

    if (!data.session) {
      setAviso("Perfil criado! Confirme seu e-mail para poder entrar depois.");
      return;
    }

    onCadastrado({ tipo: "artista", ...artista });
  };

  return (
    <section className="section">
      <div className="wrap" style={{ maxWidth: 640 }}>
        <button className="btn-link" onClick={() => irPara("escolhaCadastro")}>â† Voltar</button>
        <h2 style={{ margin: "18px 0 24px", color: "var(--terra)" }}>Criar perfil de artista</h2>

        <div className="card">
          {erro && <div className="errorbox">{erro}</div>}
          {aviso && <div className="okbox">{aviso}</div>}

          <form onSubmit={enviar}>
            <div className="formgrid">
              <div className="field">
                <label>Nome</label>
                <input value={nome} onChange={(e) => setNome(e.target.value)} required />
              </div>
              <div className="field">
                <label>Ãrea</label>
                <select value={area} onChange={(e) => setArea(e.target.value)}>
                  {AREAS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="formgrid">
              <div className="field">
                <label>E-mail</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="field">
                <label>Senha</label>
                <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
                <span className="hint">Pelo menos 6 caracteres.</span>
              </div>
            </div>

            <div className="formgrid">
              <div className="field">
                <label>Cidade</label>
                <input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Ex.: Salvador, BA" />
              </div>
              <div className="field">
                <label>Telefone (opcional)</label>
                <input value={telefone} onChange={(e) => setTelefone(e.target.value)} />
              </div>
            </div>

            <div className="field">
              <label>Instagram (opcional)</label>
              <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@seuperfil" />
            </div>

            <div className="field">
              <label>Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Conte sua trajetÃ³ria em poucas linhas." />
            </div>

            <label style={{ fontSize: 12.5, fontWeight: 700, color: "var(--terra)" }}>PortfÃ³lio (opcional)</label>
            {portfolio.map((p, i) => (
              <div key={i} className="portfolio-draft-item">
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>TÃ­tulo</label>
                  <input value={p.titulo} onChange={(e) => atualizarPortfolio(i, "titulo", e.target.value)} />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>DescriÃ§Ã£o</label>
                  <input value={p.descricao} onChange={(e) => atualizarPortfolio(i, "descricao", e.target.value)} />
                </div>
                <button type="button" className="iconbtn" onClick={() => removerPortfolio(i)}>Remover</button>
              </div>
            ))}
            <button type="button" className="iconbtn" onClick={adicionarPortfolio} style={{ marginBottom: 20 }}>+ Adicionar item ao portfÃ³lio</button>

            <div>
              <button className="btn-primary" type="submit" disabled={enviando}>
                {enviando ? "Criandoâ€¦" : "Criar meu perfil"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Cadastro de empresa                                                  */
/* ------------------------------------------------------------------ */

function CadastroEmpresa({ irPara, onCadastrado }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [cidade, setCidade] = useState("");
  const [site, setSite] = useState("");
  const [sobre, setSobre] = useState("");
  const [erro, setErro] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setErro(null);
    setAviso(null);

    if (!nome || !email || !senha) {
      setErro("Preencha nome, e-mail e senha.");
      return;
    }

    if (!supabase) {
      setErro(supabaseIndisponivel().message);
      return;
    }

    if (!supabase) {
      setErro(supabaseIndisponivel().message);
      return;
    }

    setEnviando(true);
    const { data, error } = await supabase.auth.signUp({ email, password: senha });

    if (error) {
      setErro(mensagemErroSupabase(error));
      setEnviando(false);
      return;
    }

    const { data: empresa, error: erroInsert } = await supabase
      .from("empresas")
      .insert({ user_id: data.user.id, nome, email, cidade, site, sobre })
      .select()
      .single();

    setEnviando(false);

    if (erroInsert) {
      setErro(mensagemErroSupabase(erroInsert));
      return;
    }

    if (!data.session) {
      setAviso("Conta criada! Confirme seu e-mail para poder entrar depois.");
      return;
    }

    onCadastrado({ tipo: "empresa", ...empresa });
  };

  return (
    <section className="section">
      <div className="wrap" style={{ maxWidth: 560 }}>
        <button className="btn-link" onClick={() => irPara("escolhaCadastro")}>â† Voltar</button>
        <h2 style={{ margin: "18px 0 24px", color: "var(--terra)" }}>Criar conta de empresa</h2>

        <div className="card">
          {erro && <div className="errorbox">{erro}</div>}
          {aviso && <div className="okbox">{aviso}</div>}

          <form onSubmit={enviar}>
            <div className="field">
              <label>Nome da empresa ou marca</label>
              <input value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>

            <div className="formgrid">
              <div className="field">
                <label>E-mail</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="field">
                <label>Senha</label>
                <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
                <span className="hint">Pelo menos 6 caracteres.</span>
              </div>
            </div>

            <div className="formgrid">
              <div className="field">
                <label>Cidade</label>
                <input value={cidade} onChange={(e) => setCidade(e.target.value)} />
              </div>
              <div className="field">
                <label>Site ou Instagram (opcional)</label>
                <input value={site} onChange={(e) => setSite(e.target.value)} />
              </div>
            </div>

            <div className="field">
              <label>Sobre a empresa (opcional)</label>
              <textarea value={sobre} onChange={(e) => setSobre(e.target.value)} />
            </div>

            <button className="btn-primary" type="submit" disabled={enviando}>
              {enviando ? "Criandoâ€¦" : "Criar conta"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Login                                                                */
/* ------------------------------------------------------------------ */

function Login({ irPara, onLogin }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setErro(null);
    if (!supabase) {
      setErro(supabaseIndisponivel().message);
      return;
    }
    setEnviando(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });

    if (error) {
      setErro(mensagemErroSupabase(error));
      setEnviando(false);
      return;
    }

    const perfil = await carregarPerfilDoUsuario(data.user);
    setEnviando(false);

    if (!perfil) {
      setErro("NÃ£o encontramos um perfil de artista ou empresa para essa conta.");
      return;
    }

    onLogin(perfil);
  };

  return (
    <section className="section">
      <div className="wrap" style={{ maxWidth: 440 }}>
        <h2 style={{ margin: "0 0 24px", color: "var(--terra)" }}>Entrar</h2>

        <div className="card">
          {erro && <div className="errorbox">{erro}</div>}

          <form onSubmit={enviar}>
            <div className="field">
              <label>E-mail</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label>Senha</label>
              <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
            </div>
            <button className="btn-primary" type="submit" disabled={enviando}>
              {enviando ? "Entrandoâ€¦" : "Entrar"}
            </button>
          </form>
        </div>

        <p style={{ marginTop: 20, fontSize: 14, color: "var(--coffee)" }}>
          Ainda nÃ£o tem conta? <button className="btn-link" onClick={() => irPara("escolhaCadastro")}>Cadastre-se</button>
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Painel da empresa                                                    */
/* ------------------------------------------------------------------ */

function PainelEmpresa({ usuario, vagas, onPublicada }) {
  const [titulo, setTitulo] = useState("");
  const [area, setArea] = useState("");
  const [cidade, setCidade] = useState("");
  const [descricao, setDescricao] = useState("");
  const [requisitos, setRequisitos] = useState("");
  const [erro, setErro] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const publicar = async (e) => {
    e.preventDefault();
    setErro(null);
    setAviso(null);

    if (!titulo) {
      setErro("DÃª um tÃ­tulo para a vaga.");
      return;
    }

    if (!supabase) {
      setErro(supabaseIndisponivel().message);
      return;
    }
    setEnviando(true);
    const { error } = await supabase.from("vagas").insert({
      empresa_nome: usuario.nome,
      empresa_email: usuario.email,
      titulo,
      area,
      cidade,
      descricao,
      requisitos,
    });
    setEnviando(false);

    if (error) {
      setErro(mensagemErroSupabase(error));
      return;
    }

    setAviso("Vaga publicada!");
    setTitulo("");
    setArea("");
    setCidade("");
    setDescricao("");
    setRequisitos("");
    onPublicada();
  };

  return (
    <section className="section">
      <div className="wrap">
        <span className="eyebrow">Painel da empresa</span>
        <h2 style={{ margin: "10px 0 28px", color: "var(--terra)" }}>{usuario.nome}</h2>

        <div className="formgrid" style={{ alignItems: "start" }}>
          <div className="card">
            <h3 className="serif" style={{ margin: "0 0 16px", color: "var(--terra)" }}>Publicar vaga</h3>
            {erro && <div className="errorbox">{erro}</div>}
            {aviso && <div className="okbox">{aviso}</div>}
            <form onSubmit={publicar}>
              <div className="field">
                <label>TÃ­tulo da vaga</label>
                <input value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
              </div>
              <div className="formgrid">
                <div className="field">
                  <label>Ãrea</label>
                  <select value={area} onChange={(e) => setArea(e.target.value)}>
                    <option value="">Selecione</option>
                    {AREAS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Cidade</label>
                  <input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Remoto ou cidade" />
                </div>
              </div>
              <div className="field">
                <label>DescriÃ§Ã£o</label>
                <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} />
              </div>
              <div className="field">
                <label>O que vocÃªs esperam de quem topar</label>
                <textarea value={requisitos} onChange={(e) => setRequisitos(e.target.value)} />
              </div>
              <button className="btn-primary" type="submit" disabled={enviando}>
                {enviando ? "Publicandoâ€¦" : "Publicar vaga"}
              </button>
            </form>
          </div>

          <div>
            <h3 className="serif" style={{ margin: "0 0 16px", color: "var(--terra)" }}>Suas vagas publicadas</h3>
            {vagas.length === 0 && <div className="empty">VocÃª ainda nÃ£o publicou nenhuma vaga.</div>}
            {vagas.map((v) => (
              <div key={v.id} className="job-card">
                <div className="top">
                  <h3>{v.titulo}</h3>
                </div>
                <div style={{ marginTop: 10 }}>
                  {v.area && <span className="pill">{v.area}</span>}
                  {v.cidade && <span className="pill">{v.cidade}</span>}
                </div>
                {v.descricao && <p className="req">{v.descricao}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
