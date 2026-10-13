# Portfolio – Juscelio Santos (HTML, CSS e JS puros)

Sem build e sem dependências. Abra `index.html` com duplo clique, ou suba a pasta inteira para qualquer hospedagem estática.

```
site/
  index.html            → redireciona para de/index.html
  de/  en/              → páginas (mesmos nomes de arquivo nas duas línguas)
    index.html  galerie.html  workflows.html  monitoring.html  arbeitsweise.html
    ueber-mich.html  kontakt.html  impressum.html  datenschutz.html
    projekte/index.html  projekte/<projeto>.html
  assets/css/style.css  → todo o visual (cores no topo, em :root)
  assets/js/main.js     → menu, animações, slider antes/depois, galeria, filtros
  assets/fonts/         → Archivo + JetBrains Mono (locais, sem Google Fonts)
  media/  downloads/  workflows/   → seus arquivos
```

## Antes de publicar

1. **Procure por `TODO`** em todos os `.html` (e-mail, endereço, anos de experiência, níveis de idioma, períodos, licenças, números). Tudo que tem `TODO` aparece listrado em laranja no site.
2. **Números com `class="todo"` e etiquetas "Platzhalter"** são exemplos do plano, não medições. Troque pelo valor medido e remova a classe `todo` e a etiqueta.
3. **Mídia:** coloque os arquivos em `media/` com o nome que aparece no quadro "Medium fehlt". Assim que o arquivo existir, o placeholder some sozinho.
4. **CV e downloads:** `downloads/lebenslauf-juscelio-santos-de.pdf`, `downloads/cv-juscelio-santos-en.pdf`, `downloads/ai-content-pipeline-documentation-en.pdf` e os `.json` em `workflows/`.
5. Páginas ou projetos ainda não prontos: tire do menu (bloco `<nav>`) ou apague o arquivo. O plano diz: o que não está pronto não aparece.

O cabeçalho e o rodapé estão repetidos em cada página. Se mudar o menu, mude em todos os arquivos (buscar e substituir no VS Code).
