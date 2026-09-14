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
const SUPABASE_URL = "https://SEU-PROJETO.supabase.co";
const SUPABASE_ANON_KEY = "SUA-ANON-KEY-AQUI";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ------------------------------------------------------------------ */
/*  Utilidades                                                         */
/* ------------------------------------------------------------------ */

const AREAS = [
  "Ator / Atriz",
  "Cantor(a)",
  "Dançarino(a)",
  "Modelo",
  "Fotógrafo(a)",
  "Ilustrador(a) / Artista visual",
  "Músico(a) / Instrumentista",
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
    return "Já existe uma conta com esse e-mail.";
  }
  if (m.includes("Invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (m.includes("Password should be")) {
    return "A senha precisa ter pelo menos 6 caracteres.";
  }
  return m || "Algo deu errado. Tente novamente.";
}

/* Carrega o perfil (artista ou empresa) associado a um usuário autenticado */
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

    /* ---------- seções gerais ---------- */
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

    /* ---------- diretório ---------- */
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

  // Mantém a sessão ao recarregar a página e reage a login/logout
  useEffect(() => {
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
    await supabase.auth.signOut();
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
          <p>ATERRO usa Supabase para autenticação e armazenamento dos dados. Nenhuma senha é guardada em texto puro — isso é feito pelo Supabase Auth.</p>
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
          <button className={`navbtn ${view === "diretorio" ? "active" : ""}`} onClick={() => irPara("diretorio")}>Diretório</button>
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
  { top: "6%", left: "46%", rot: "4deg", nome: "Dandara S.", papel: "DANÇA" },
  { top: "40%", left: "2%", rot: "3deg", nome: "Kaique R.", papel: "MÚSICA" },
  { top: "46%", left: "44%", rot: "-4deg", nome: "Ìyá B.", papel: "ARTES VISUAIS" },
  { top: "26%", left: "70%", rot: "-3deg", nome: "Preto N.", papel: "ATUAÇÃO" },
];

function Home({ irPara, artistas }) {
  const destaques = artistas.slice(0, 4);

  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <span className="eyebrow">Vitrine de talentos negros e periféricos</span>
            <h1>Talento que já existe. Visibilidade que faltava.</h1>
            <p className="lead">
              Um espaço para artistas negros e periféricos publicarem portfólio, trajetória
              e contatos — e para marcas e agências encontrarem quem procuram, com filtros
              diretos e sem intermediário.
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
                style={{ top: p.top, left: p.left, transform:
