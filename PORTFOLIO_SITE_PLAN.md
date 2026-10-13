# Portfolio-Website — AI Content Production

**Projeto:** site de portfólio de Juscelio Santos para candidaturas em empresas alemãs (foco: Wiethe — *Creative Technologist / AI Engineer* e *AI Creative*)
**Versão do plano:** 1.0 — 13/10/2026
**Idiomas do site:** Alemão (padrão, `/de`) e Inglês (`/en`)
**Base técnica:** `COMFYUI_MODO_DEUS_v3.md` (manual v3.2) e `ai_pipeline_kit.zip`

> **Como usar este documento:** cada seção descreve uma parte do site: objetivo, conteúdo, textos prontos em alemão (DE) e inglês (EN) e o checklist do que precisa existir antes de publicar. Os textos em alemão são uma **base**. Antes de enviar, peça para um falante nativo revisar.

---

## 0. Princípios (o que o site precisa transmitir)

1. **Sachlich:** fatos, não adjetivos. Proibido: "revolucionário", "incrível", "o futuro". Descreva o que é, como funciona e o que foi medido.
2. **Strukturiert:** todos os projetos seguem **o mesmo esqueleto** (seção 5). O leitor alemão procura consistência.
3. **Belegbar:** toda afirmação tem número, imagem ou link ao lado. Números no formato alemão: `7,9 s`, `1 024 × 1 280 px`, `82 %`.
4. **Ehrlich:** cada projeto tem "Grenzen & Erkenntnisse". Nada de "em breve": o que não está pronto não aparece.
5. **Datenschutz:** sem rastreamento, sem fontes externas, sem cookies desnecessários, com Impressum e Datenschutzerklärung.
6. **Transparência de IA:** todo conteúdo gerado leva o selo **"KI-generiert"** ou **"KI-bearbeitet"**.
7. **Honestidade sobre idioma:** o site está em alemão, mas o currículo declara o nível real de alemão. A vaga pede inglês muito bom; não crie expectativa de fluência em alemão que não existe.

**Mensagem central (uma frase):**
- **DE:** *Ich entwickle stabile, messbare ComfyUI-Workflows für Bild und Video – von der Fotografie bis zur Auslieferung.*
- **EN:** *I build stable, measurable ComfyUI workflows for image and video – from photography to delivery.*

---

## 1. Público e objetivo

| Leitor | Tempo que dedica | O que precisa ver |
|---|---|---|
| Recrutador(a) / RH | 30–60 s | Quem é, função, 3 números, 2–3 projetos visuais, currículo em PDF, disponibilidade |
| Head of AI / líder técnico | 5–15 min | Arquitetura, workflows, nodes próprios, métricas, limitações, GitHub |
| Diretor(a) de arte / design | 2–5 min | Qualidade visual, consistência de produto, antes/depois, vídeo |

**Objetivo de conversão:** o leitor abre o currículo ou envia um e-mail. Todas as páginas terminam com os mesmos dois caminhos: *Lebenslauf (PDF)* · *Kontakt*.

---

## 2. Mapa do site

```text
/de (padrão)                         /en (espelho completo)
├── /                    Start
├── /projekte            Projektübersicht
│   ├── /ai-content-pipeline        01 — Projeto principal (sistema completo)
│   ├── /fashion-hintergrund        02 — Fashion: Hintergrund & Kampagne
│   ├── /motion-from-stills         03 — Video aus Fotos
│   ├── /cgi-ki-unreal              04 — CGI + KI (Unreal Engine)
│   └── /lora-training              05 — LoRA-Training & Datensätze
├── /galerie             Bilder · Videos · Vorher/Nachher
├── /workflows           Diagramas + downloads JSON
├── /monitoring          Monitoring & Performance
├── /arbeitsweise        Método + documentação técnica
├── /ueber-mich          Perfil + Lebenslauf
├── /kontakt             Contato
├── /impressum
└── /datenschutz
```

**Navegação principal (DE):** Projekte · Galerie · Workflows · Monitoring · Arbeitsweise · Über mich · Kontakt · `DE | EN`
**Navegação principal (EN):** Projects · Gallery · Workflows · Monitoring · Approach · About · Contact · `DE | EN`

**Rodapé:** © 2026 Juscelio Santos · Impressum · Datenschutz · GitHub · LinkedIn · *Alle KI-generierten Inhalte sind gekennzeichnet.*

---

## 3. Sistema visual (sóbrio, cara de portfólio técnico)

### 3.1 Cores

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `--bg` | `#FAFAF8` | `#111213` | Fundo |
| `--surface` | `#FFFFFF` | `#1A1B1D` | Cards, fichas |
| `--text` | `#16171A` | `#ECECEA` | Texto principal |
| `--muted` | `#5F6368` | `#A0A3A8` | Legendas, fichas técnicas |
| `--line` | `#E3E3DF` | `#2A2C2F` | Bordas finas, divisórias |
| `--accent` | `#1F5F5B` (azul-petróleo) | `#5FB3AC` | Links, botão principal, destaques |
| `--ok` / `--warn` | `#2E7D4F` / `#A15C00` | `#6CC291` / `#E0A458` | Só em tabelas de métricas |

Regra: **uma** cor de destaque. Sem gradientes, sem sombras fortes, sem neon.

### 3.2 Tipografia (hospedada no próprio site, nunca via Google Fonts)

- **Texto e títulos:** Inter (ou IBM Plex Sans) com pesos 400 e 600.
- **Dados técnicos, fichas, código:** IBM Plex Mono (ou JetBrains Mono) com peso 400.
- Escala: 14 / 16 / 20 / 28 / 40 px; linha 1,5 no texto e 1,2 nos títulos.
- Largura máxima de texto: ~70 caracteres.

### 3.3 Layout

- Grid de 12 colunas, container máximo de 1 200 px, margem lateral de 24 px no desktop e 16 px no celular.
- Espaço generoso entre seções (96 px no desktop, 64 px no celular).
- Bordas de 1 px em `--line` e cantos com raio de 4 px.
- Mídia sempre em proporção fixa (16:9, 4:5, 1:1), sem cortes aleatórios.

### 3.4 Movimento

- Vídeos curtos em **loop, sem som**, com `poster`; nada toca som automaticamente.
- Transições só de 150–200 ms (hover, abertura de mídia).
- Respeitar `prefers-reduced-motion`: com essa configuração, os vídeos não tocam sozinhos.

### 3.5 Componentes

| Componente | Descrição |
|---|---|
| **Ficha técnica** (`MediaSpec`) | Linha em fonte mono abaixo de cada mídia (ver 3.6) |
| **Selo de IA** | `KI-generiert` / `KI-bearbeitet` / `Original-Foto`: pequeno, canto superior esquerdo |
| **Slider antes/depois** | Arrastar para comparar; rótulos `Original` · `Ergebnis` |
| **Zoom de detalhe** | Recorte 200 % do logo/costura, lado a lado |
| **Tabela de métricas** | Mediana, p95, IC95 %, VRAM, n, taxa de aprovação |
| **Diagrama** | SVG próprio, monocromático + cor de destaque |
| **Card de projeto** | Imagem, número, título, 1 linha, 3 tags de tecnologia |
| **Bloco "Anforderung → Umsetzung"** | Tabela que liga um requisito da vaga à prova no site |

### 3.6 Padrão da ficha técnica (sempre igual)

```text
Modell: FLUX.2 [klein] 4B · Workflow: wf01 v1.2 · 1 024 × 1 280 px · RTX 4080
Laufzeit: 7,9 s (Median, n = 15) · Produkt pixelgenau erhalten · KI-bearbeitet
```

EN: `Model · Workflow · resolution · GPU · Runtime (median, n) · Product pixel-accurate · AI-edited`

> Todos os números dos exemplos deste documento são **ilustrativos**. Publique só valores medidos por você.

---

## 4. Páginas

### 4.1 Start

**Objetivo:** em 30 segundos, o recrutador entende quem você é, o que faz e onde está a prova.

**Estrutura:**

1. **Hero**
   - Nome: **Juscelio Santos**
   - Função DE: **Creative Technologist für KI-gestützte Content-Produktion**
   - Função EN: **Creative Technologist for AI-driven content production**
   - Frase central (seção 0)
   - Vídeo em loop de 15 s: foto original → novo cenário → vídeo
   - Botões DE: `Projekte ansehen` · `Lebenslauf (PDF)` / EN: `View projects` · `CV (PDF)`

2. **Três números medidos** (exemplo de rótulos):
   - DE: `0 px Abweichung im geschützten Produktbereich` · `7,9 s pro Bild (Median, RTX 4080)` · `82 % Freigabequote im Golden Dataset`
   - EN: `0 px deviation in protected product area` · `7.9 s per image (median, RTX 4080)` · `82 % approval rate on golden dataset`

3. **Ausgewählte Projekte / Selected projects:** 3 cards (01, 02, 03).

4. **Was ich mache / What I do:** três colunas.

   | DE | EN |
   |---|---|
   | **Workflows** — Bild- und Video-Workflows in ComfyUI entwickeln, versionieren und optimieren. | **Workflows** — Build, version and optimise image and video workflows in ComfyUI. |
   | **Engineering** — Eigene Nodes in Python, API-Anbindung über FastAPI, Oberflächen für Kreativteams. | **Engineering** — Custom Python nodes, FastAPI integration, interfaces for creative teams. |
   | **Betrieb** — Monitoring, Profiling und Qualitätssicherung für eine stabile Produktion. | **Operations** — Monitoring, profiling and quality assurance for stable production. |

5. **Hintergrund / Background:** uma frase.
   - DE: *Über X Jahre Erfahrung in CGI, Unreal Engine und visueller Produktion (Automotive, Architekturvisualisierung) – heute verbinde ich klassische 3D-Pipelines mit generativer KI.*
   - EN: *X+ years in CGI, Unreal Engine and visual production (automotive, architectural visualisation) – now combining classic 3D pipelines with generative AI.*

6. **Rodapé de conversão:** `Lebenslauf (PDF)` · `Kontakt`.

**Checklist:**
- [ ] Vídeo do hero com material próprio/autorizado (< 8 MB, loop, sem som, com poster)
- [ ] Três números reais, com link para a página onde foram medidos
- [ ] Anos de experiência corretos

---

### 4.2 Projektübersicht

- Título DE: **Projekte** · Intro: *Fünf Projekte, jeweils mit gleichem Aufbau: Ausgangslage, Vorgehen, Ergebnisse, Messwerte und Grenzen.*
- Título EN: **Projects** · Intro: *Five projects, each with the same structure: context, approach, results, metrics and limitations.*
- Grade de cards com o número, o título, uma linha de descrição e as tags de tecnologia.
- Filtro opcional: `Bild` · `Video` · `Engineering` · `CGI`.

---

### 4.3 Template de projeto (obrigatório em todos)

| Bloco | DE | EN | Conteúdo |
|---|---|---|---|
| Cabeçalho | — | — | Número, título, frase-resumo, tags, ficha (Zeitraum, Rolle, Werkzeuge) |
| 1 | **Ausgangslage** | Context | O problema em 2–3 frases |
| 2 | **Ziel** | Goal | Critério de sucesso mensurável |
| 3 | **Vorgehen** | Approach | Passos e decisões, com a alternativa descartada e o motivo |
| 4 | **Technischer Aufbau** | Technical setup | Diagrama, nodes, modelos, **licenças** |
| 5 | **Ergebnisse** | Results | Slider antes/depois, vídeos, zoom de detalhe |
| 6 | **Messwerte** | Metrics | Tabela de métricas + método (n, aquecimento, GPU) |
| 7 | **Grenzen & Erkenntnisse** | Limitations & learnings | O que falhou e por quê |
| 8 | **Nächste Schritte** | Next steps | 2–3 melhorias planejadas |
| Rodapé | — | — | Links: GitHub, Workflow-Download, próximo projeto, CV |

**Ficha do cabeçalho (exemplo):**

```text
Zeitraum: 10/2026 – 12/2026 · Rolle: Konzeption, Entwicklung, Evaluation (Einzelprojekt)
Werkzeuge: ComfyUI, FLUX.2 [klein] 4B, Python, PyTorch, FastAPI, React, Prometheus, Grafana
```

**Texto padrão de transparência** (em todo projeto):
- DE: *Eigenes Projekt mit eigenen bzw. lizenzierten Aufnahmen. Keine Kundenarbeit. KI-generierte Inhalte sind gekennzeichnet.*
- EN: *Personal project using own or licensed footage. Not client work. AI-generated content is labelled.*

---

### 4.4 Projeto 01 — AI Content Production Pipeline (principal)

- **DE-Titel:** *AI Content Production Pipeline – vom Foto zum freigegebenen Bild und Video*
- **EN title:** *AI Content Production Pipeline – from photo to approved image and video*
- **Resumo DE:** *Ein internes Produktionssystem: Kreative laden ein Foto hoch, wählen ein Preset, prüfen die Ergebnisse und erzeugen daraus Videos – ohne direkten Zugriff auf ComfyUI.*

**Conteúdo específico:**
- Diagrama de arquitetura: `React/Gradio → FastAPI → Queue → GPU-Worker (RTX 3090 Video / RTX 4080 Bild) → ComfyUI → QA → Storage` + `Prometheus/Grafana`
- Screen recording da interface do operador (60–90 s)
- Decisões-chave: allowlist de workflows, idempotência, reconciliação após falha, uma GPU por tipo de tarefa
- Link para a documentação técnica (Arbeitsweise)

**Bloco "Anforderung → Umsetzung"** (copia os requisitos do anúncio e aponta a prova):

| Anforderung (Stellenanzeige) | Umsetzung in diesem Projekt | Nachweis |
|---|---|---|
| Entwicklung und Optimierung von Workflows | Versionierte Bild-/Video-Workflows, Optimierungen mit Benchmark belegt | Workflows, Monitoring |
| Entwicklung eigener Nodes | Validierung, Maskenprüfung, pixelgenaue Produktkomposition (Python/PyTorch) | GitHub |
| Technischer Support und Schulung | Bedienanleitungen je Preset, Schulungsunterlagen | Arbeitsweise |
| Integration visueller Gestaltung | Bedienoberfläche, Presets für Art Direction, Vorher/Nachher-Prüfung | Galerie |
| Monitoring und Performance-Analyse | Laufzeit pro Node, VRAM, p95, Alarme, Lasttest | Monitoring |

---

### 4.5 Projeto 02 — Fashion: Hintergrund & Kampagne

- **DE-Titel:** *Neuer Hintergrund, unverändertes Produkt*
- **EN title:** *New background, unchanged product*
- **Ausgangslage DE:** *Generative Bildbearbeitung verändert oft Logos, Nähte und Stoffstrukturen. Für E-Commerce ist das nicht akzeptabel.*
- **Vorgehen (resumo):** edição por referência (FLUX.2 [klein] 4B) → máscara (BiRefNet/SAM 3, revisada) → recomposição dos pixels originais → harmonização de luz/sombra → QA com zoom 200 %
- **Ergebnisse:** 5 cenários × slider antes/depois + zoom no logo
- **Messwerte:** diff de pixels na região protegida, tempo (mediana/p95), taxa de aprovação
- **Grenzen DE (exemplo):** *Die erhaltene Person behält ihre ursprüngliche Lichtsituation; bei stark abweichendem Szenenlicht ist eine zusätzliche Lichtanpassung nötig.*
- **Extra:** comparação **Kontext (nicht kommerziell)** × **FLUX.2 [klein] 4B (Apache 2.0)**, com uma frase sobre por que a licença decidiu a escolha.

---

### 4.6 Projeto 03 — Motion from Stills

- **DE-Titel:** *Vom freigegebenen Foto zum Produktvideo*
- **EN title:** *From approved still to product video*
- Conteúdo: 3 vídeos (moda, produto, CGI) de 3–5 s; quadros início/meio/fim; comparação I2V × movimento guiado (pose/depth)
- **Messwerte:** tempo por shot, VRAM, taxa de aprovação, defeitos temporais encontrados (Flimmern, Identitätsdrift)
- **Grenzen DE (exemplo):** *Bei schnellen Bewegungen verformen sich kleine Logos; diese Shots werden verworfen oder mit dem Originalfoto nachbearbeitet.*

---

### 4.7 Projeto 04 — CGI + KI (Unreal Engine)

- **DE-Titel:** *Unreal-Renderings mit KI-generierter Umgebung – Produktgeometrie bleibt unverändert*
- **EN title:** *Unreal renders with AI-generated environments – product geometry stays unchanged*
- Conteúdo: beauty, depth e ID pass → ambiente gerado guiado por depth → recomposição; vídeo com câmera da Unreal usada como controle
- **Messwerte:** pixel diff = 0 na região do produto; tempo por variação
- Este é o seu **diferencial**: deixe isso explícito na frase-resumo.

---

### 4.8 Projeto 05 — LoRA-Training & Datensätze

- **DE-Titel:** *LoRA-Training mit dokumentierten, lizenzierten Datensätzen*
- **EN title:** *LoRA training with documented, licensed datasets*
- Conteúdo: dataset (real + sintético da Unreal), captions, configuração, comparação cega v1 × v2 × baseline, model card
- **Grenzen:** overfitting observado, o que foi descartado e por quê

---

### 4.9 Galerie

- Título DE: **Galerie** · Intro: *Ausgewählte Ergebnisse. Jede Aufnahme mit technischen Angaben und Kennzeichnung.*
- Filtros: `Alle` · `Bild` · `Video` · `Vorher/Nachher` · `CGI`
- Grade uniforme (4:5 ou 1:1); clique abre a visualização ampliada com mídia grande, ficha técnica, selo de IA e link "Zum Projekt"
- **Sempre em pares:** original → resultado

---

### 4.10 Workflows

- Título DE: **Workflows** · Intro: *Aufbau, Parameter und Download der eingesetzten ComfyUI-Workflows.*
- Para cada workflow:
  - Diagrama redesenhado (SVG) + print real do ComfyUI
  - Tabela de blocos: `Block · Funktion · Nodes · Parameter, die angepasst werden dürfen`
  - Requisitos: modelos e arquivos, VRAM medida, licença
  - Downloads: `.ui.json`, `.api.json`, `README`
  - Limitações conhecidas
- Workflows previstos: `wf01` Hintergrund · `wf02` Kampagnenvarianten · `wf03` Bild-zu-Video · `wf04` Upscale & Finishing

---

### 4.11 Monitoring (a tecnologia de acompanhamento)

- **DE-Titel:** *Monitoring & Performance*
- **Intro DE:** *Wie ich Laufzeiten, Speicherverbrauch und Fehler messe, Engpässe finde und Optimierungen belege.*
- **EN title / intro:** *Monitoring & Performance — How I measure runtime, memory and errors, find bottlenecks and prove optimisations.*

**Blocos:**
1. **Architektur:** diagrama Gateway → Queue → Worker → ComfyUI → `/metrics` → Prometheus → Grafana → Alarme
2. **Dashboard:** 3–4 prints do Grafana (p50/p95 por workflow, top nodes, taxa de erro, VRAM por GPU), cada um com legenda explicando o que mostra
3. **Fallstudie: Engpass:** *Engpass gefunden → Messung → Maßnahme → Ergebnis* (ex.: VAE em 4K → VAE Tiled → tempo e VRAM antes/depois)
4. **Benchmark:** tabela de `analyze_bench.py` (mediana, IC95 %, p95, VRAM) + frase sobre o método
5. **Lasttest:** gráfico de 200 jobs (VRAM e tempo ao longo do teste)
6. **Alarme:** lista das 5 regras e por que existem
7. **Método:** *Messen → Lokalisieren → eine Änderung → erneut messen → Qualität prüfen → entscheiden*

**Regra:** nada ao vivo exposto na internet. Somente prints, dados exportados e gráficos estáticos.

---

### 4.12 Arbeitsweise (método + "toda a nossa conversa")

O conteúdo da conversa e do manual entra aqui **como método e documentação**, não como chat.

- **DE-Titel:** *Arbeitsweise*
- **Intro DE:** *So gehe ich bei neuen Modellen, Workflows und Problemen vor.*

**Blocos:**
1. **Sechs Schritte:** *Ausführen → Erklären → Verändern → Diagnostizieren → Automatisieren → Schulen* (uma frase cada)
2. **Grundsätze:**
   - *Erst messen, dann optimieren.*
   - *Eine Änderung pro Test.*
   - *Qualität vor Geschwindigkeit: Jede Optimierung besteht den Golden-Dataset-Test.*
   - *Lizenzen und Bildrechte werden vor dem Einsatz geprüft und dokumentiert.*
   - *Kein direkter Zugriff auf ComfyUI aus dem Browser – nur über eine geprüfte API.*
3. **Lernpfad:** linha do tempo das fases que você realmente concluiu (baseada na trilha mestre do manual)
4. **Schulung & Support:** amostra de um guia de 1 página por preset (SOP) e índice do material de treinamento
5. **Dokumentation (Download):** versão resumida do manual em **inglês** (PDF, 15–25 páginas) com arquitetura, workflows, nodes, monitoramento e QA. O manual completo em português fica fora do site ou no GitHub.

---

### 4.13 Über mich

- **Perfil DE (exemplo para adaptar):** *Ich komme aus der 3D-Visualisierung und Echtzeit-Produktion mit Unreal Engine. Heute entwickle ich Pipelines, die generative KI kontrollierbar und messbar machen – mit Fokus auf Produkttreue, Stabilität und guter Zusammenarbeit mit Kreativteams.*
- **Kompetenzen** (tabela, sem barras de "nível"):

  | Bereich | Werkzeuge |
  |---|---|
  | Generative KI | ComfyUI, FLUX.2, Qwen-Image-Edit, Wan 2.2, LoRA (AI-Toolkit) |
  | Engineering | Python, PyTorch, FastAPI, React, Docker, Linux |
  | Betrieb | Prometheus, Grafana, Profiling (py-spy, PyTorch Profiler, Nsight) |
  | 3D/CGI | Unreal Engine, Rendering, Compositing, Farbmanagement |

- **Sprachen** com o nível **real**: `Portugiesisch – Muttersprache` · `Englisch – [Niveau]` · `Deutsch – [Niveau]`
- **Verfügbarkeit**, só se for verdade. Exemplo: *Bereit zum Umzug nach Bremen/Hamburg; hybrides Arbeiten mit mindestens drei Tagen pro Woche vor Ort möglich.*
- **Lebenslauf (PDF):** formato *tabellarischer Lebenslauf*, cronologia reversa, 2 páginas, em DE e EN

---

### 4.14 Kontakt

- DE: *Ich freue mich über Ihre Nachricht.* + e-mail no domínio próprio + LinkedIn + GitHub
- EN: *I look forward to hearing from you.*
- **Sem formulário** (menos dados pessoais, Datenschutz mais simples)
- Use "Sie" em todo o site (forma formal)

---

### 4.15 Impressum e Datenschutz

- **Impressum:** nome, endereço para contato, e-mail. Confirme com fonte jurídica se é obrigatório no seu caso (site pessoal mirando empresas alemãs); na dúvida, inclua.
- **Datenschutzerklärung:** hospedagem, logs do servidor, ausência de cookies/rastreamento, vídeos hospedados no próprio site, contato por e-mail, direitos do titular (GDPR).
- Use um gerador de Datenschutzerklärung confiável como base e revise.
- **Isto não é aconselhamento jurídico.**

---

## 5. Conteúdo e mídia

### 5.1 Especificações

| Tipo | Formato | Regras |
|---|---|---|
| Imagens | AVIF/WebP + JPEG de fallback | Lado maior ~2 400 px; `srcset`; lazy loading; perfil sRGB |
| Antes/depois | Mesma proporção e enquadramento | Rótulos `Original` / `Ergebnis` |
| Clipes curtos | MP4 (H.264) + WebM, 5–20 s, sem áudio | `poster`, < 8 MB, `muted loop playsinline` |
| Demo longa (3–5 min) | Hospedada no próprio site ou Vimeo sem cookies | Com legendas (DE/EN) |
| Diagramas | SVG | Legíveis no celular; texto em DE/EN |
| Prints do Grafana | PNG, tema claro | Dados reais, sem informação sensível |
| Downloads | `.json`, PDF | Nome de arquivo claro e versionado |

### 5.2 Direitos e transparência

- [ ] Só fotos próprias, de pessoas com **autorização escrita** ou licenciadas (arquivo `LICENSES.md` no repositório)
- [ ] Nenhum material de cliente ou de terceiros sem permissão
- [ ] Selo de IA em toda mídia gerada ou editada
- [ ] Licença de cada modelo usado citada na ficha do projeto

### 5.3 Inventário mínimo para publicar

| Item | Quantidade mínima |
|---|---|
| Pares antes/depois (Projeto 02) | 5 |
| Vídeos curtos (Projeto 03) | 3 |
| Render Unreal + variações (Projeto 04) | 1 render + 3 variações |
| Prints do Grafana | 3 |
| Tabela de benchmark real | 1 |
| Workflows para download | 2 |
| Demo em vídeo (Projeto 01) | 1 (3–5 min) |
| CV em PDF (DE + EN) | 2 |

---

## 6. Stack técnica

| Camada | Escolha | Motivo |
|---|---|---|
| Framework | **Astro** | Site de conteúdo, rápido, i18n nativo, Markdown/MDX |
| Interatividade | Componentes **React** (ilhas) | Slider antes/depois, galeria, tabelas filtráveis |
| Conteúdo | Coleções em Markdown/MDX (`/content/projekte/*.de.mdx`, `*.en.mdx`) | Mesmo esqueleto garantido por schema |
| Estilo | CSS com variáveis (tokens da seção 3) | Leve, sem dependência pesada |
| Fontes | Arquivos `.woff2` no próprio site | Datenschutz (sem Google Fonts externo) |
| Mídia | Otimização no build (Astro Image) | AVIF/WebP automático |
| Hospedagem | Estática, de preferência com servidores na UE | Datenschutz |
| Domínio | Próprio (ex.: `juscelio.de` ou `.com`) + e-mail no domínio | Profissionalismo |
| Analytics | Nenhum, ou solução sem cookies | Sem banner de cookies |
| Repositório | GitHub (site separado do repositório do pipeline) | Transparência |

**Estrutura de pastas sugerida:**

```text
portfolio/
  src/
    content/
      projekte/        01-ai-content-pipeline.de.mdx · .en.mdx · …
      workflows/       wf01.de.mdx · .en.mdx · …
    components/        MediaSpec · AiBadge · BeforeAfter · MetricsTable · ProjectCard · RequirementMap
    layouts/           BaseLayout · ProjectLayout
    pages/[lang]/      index · projekte · galerie · workflows · monitoring · arbeitsweise · ueber-mich · kontakt
    i18n/              de.json · en.json
    styles/            tokens.css · base.css
  public/
    fonts/  media/  downloads/
```

**Schema do projeto (garante a estrutura alemã):** campos obrigatórios `title`, `summary`, `period`, `role`, `tools[]`, `licenses[]`, `metrics[]`, `limitations[]`, `nextSteps[]`. Projeto sem `limitations` não compila.

---

## 7. Qualidade antes de enviar

### 7.1 Técnica
- [ ] Lighthouse ≥ 90 em Performance, Acessibilidade e Boas práticas (desktop e celular)
- [ ] Funciona em 375 px de largura sem rolagem horizontal
- [ ] Contraste AA; textos alternativos em toda imagem; legendas nos vídeos
- [ ] Nenhuma requisição a domínios externos (verificar no DevTools → Network)
- [ ] Links quebrados: zero
- [ ] DE e EN completos e com o mesmo conteúdo

### 7.2 Conteúdo
- [ ] Todos os números são medidos e têm método (n, GPU, aquecimento)
- [ ] Todo projeto tem "Grenzen & Erkenntnisse"
- [ ] Nenhuma página "em breve"
- [ ] Textos em alemão revisados por um falante nativo
- [ ] Formato de números alemão na versão DE (`7,9 s`, `82 %`)
- [ ] Forma "Sie" consistente
- [ ] Selo de IA em toda mídia gerada

### 7.3 Candidatura
- [ ] E-mail de candidatura com link direto para o Projeto 01 e para o CV
- [ ] Início possível e pretensão salarial no e-mail (a vaga pede), não no site
- [ ] Disponibilidade para Bremen/Hamburgo declarada com honestidade

---

## 8. Roteiro de construção

### Fase 1 — Esqueleto (pode ir ao ar)
- [ ] Domínio, hospedagem, repositório
- [ ] Tokens visuais, tipografia local, layout base, DE/EN
- [ ] Start (sem números ainda), Über mich, Kontakt, Impressum, Datenschutz
- [ ] CV em PDF (DE/EN)

### Fase 2 — Primeiro projeto real
- [ ] Workflow 01 rodando de verdade (manual 7.6)
- [ ] Projeto 02 completo com 5 antes/depois, métricas e limitações
- [ ] Galerie com os pares do Projeto 02
- [ ] Página Workflows com `wf01`

### Fase 3 — Engenharia e monitoramento
- [ ] Gateway + Grafana rodando (manual 16, 19)
- [ ] Página Monitoring com prints reais, benchmark e estudo de caso de gargalo
- [ ] Projeto 01 com diagrama, demo em vídeo e o bloco "Anforderung → Umsetzung"

### Fase 4 — Vídeo e diferencial
- [ ] Projeto 03 (3 vídeos)
- [ ] Projeto 04 (Unreal + IA)

### Fase 5 — Profundidade e envio
- [ ] Projeto 05 (LoRA)
- [ ] Arbeitsweise + documentação técnica resumida em inglês (PDF)
- [ ] Revisão do alemão por nativo
- [ ] Checklist da seção 7 completo
- [ ] Envio da candidatura

> **Regra de envio:** é melhor enviar com **2 projetos sólidos** (01 + 02) do que com 5 incompletos. Os outros podem ser adicionados depois, e o site atualizado vira argumento num segundo contato.

---

## 9. Glossário de termos alemães usados no site

| Alemão | Português | Onde aparece |
|---|---|---|
| Ausgangslage | Situação inicial / contexto | Projetos |
| Vorgehen | Abordagem / método | Projetos |
| Technischer Aufbau | Estrutura técnica | Projetos |
| Ergebnisse | Resultados | Projetos |
| Messwerte | Valores medidos | Projetos |
| Grenzen & Erkenntnisse | Limitações e aprendizados | Projetos |
| Nächste Schritte | Próximos passos | Projetos |
| Anforderung → Umsetzung | Requisito → implementação | Projeto 01 |
| Engpass | Gargalo | Monitoring |
| Freigabequote | Taxa de aprovação | Métricas |
| Laufzeit | Tempo de execução | Fichas técnicas |
| Produkttreue | Fidelidade ao produto | Textos |
| KI-generiert / KI-bearbeitet | Gerado / editado por IA | Selos |
| Arbeitsweise | Forma de trabalhar | Página de método |
| Lebenslauf | Currículo | CV |
| Verfügbarkeit | Disponibilidade | Über mich |
| Impressum | Identificação legal do responsável pelo site | Rodapé |
| Datenschutzerklärung | Política de privacidade | Rodapé |
