# ReConecta

Plataforma frontend para visualização e coordenação da capacidade de uma rede de saúde.

O ReConecta apresenta uma visão compartilhada de leitos, profissionais, mobilidade, transferências e sinais operacionais. O projeto é um protótipo funcional desenvolvido com HTML, CSS e JavaScript puro.

## Visão do produto

O produto está organizado em quatro pilares:

- **Capacidade:** leitos, setores, hospitais, profissionais e equipamentos.
- **Mobilidade:** macas, ambulâncias e equipes disponíveis para deslocamento.
- **Transferências:** solicitações, destinos, compatibilidade e status.
- **Inteligência:** gargalos, previsão de saturação e recuperação da rede.

## Funcionalidades

- Landing page com busca de especialidades e acesso à plataforma.
- Navegação pública entre as páginas institucionais e operacionais.
- Sugestões de busca com suporte a mouse e teclado.
- Filtros por texto, cidade e tipo de recurso.
- Contadores animados e componentes de status da rede.
- Dashboard com visão geral, capacidade, leitos, profissionais, mobilidade, transferências, alertas, inteligência, relatórios e configurações.
- Menu responsivo para a área pública.
- Sidebar responsiva e off-canvas no dashboard.
- Formulário de contato com campos dinâmicos conforme o tipo de cadastro.
- Feedback visual de ações por meio de toasts.

## Tecnologias

- HTML5 sem framework.
- CSS3 com Grid, Flexbox, variáveis CSS e media queries.
- JavaScript vanilla, sem dependências de runtime.
- Python `http.server` para desenvolvimento local.
- Google Fonts: Sora, Inter e JetBrains Mono.


## Como acessar

### Pré-requisito

Instale o Python 3. O projeto não possui backend nem etapa de instalação de pacotes.

### Pelo terminal

Na raiz do repositório, execute:

```powershell
Set-Location .\ReConecta
python -m http.server 8080 --bind 127.0.0.1
```

Depois, abra:

```text
http://127.0.0.1:8080/
```

Rotas principais:

- Página inicial: `http://127.0.0.1:8080/`
- Capacidade: `http://127.0.0.1:8080/pages/capacidade.html`
- Transferências: `http://127.0.0.1:8080/pages/transferencias.html`
- Dashboard: `http://127.0.0.1:8080/dashboard/`

### Pelo VS Code

1. Abra a pasta `ReConecta-Reconstrucao-Profissional-v3` no VS Code.
2. Pressione `F5` ou acesse **Run and Debug**.
3. Selecione **Launch Chrome against localhost**.

O VS Code executa a tarefa `Serve ReConecta`, inicia o servidor Python na porta `8080` e abre o Chrome em `127.0.0.1`.


## Dados e limitações

Este é um protótipo frontend. Os nomes, números, hospitais, status e indicadores exibidos são dados demonstrativos.

- Não há API ou banco de dados conectado.
- Formulários exibem confirmação, mas não persistem dados.
- A geração de relatórios é simulada.
- A fonte do Google Fonts depende de conexão externa; sem ela, entram as fontes alternativas definidas no CSS.

## Validação

As verificações realizadas no projeto incluem:

```powershell
node --check .\ReConecta\assets\js\app.js
```

Também foram conferidos os caminhos locais entre páginas e assets, a estrutura do CSS, a configuração do VS Code e os fluxos de busca e filtros no navegador.

## Próximos passos

- Substituir os dados demonstrativos por uma API real.
- Adicionar autenticação e perfis de acesso.
- Persistir formulários e ações operacionais.
- Criar testes automatizados de interface.
- Integrar mapas, notificações e relatórios reais.

## Licença

Este repositório é um protótipo de produto. Adicione a licença adequada antes de publicar ou redistribuir o projeto.
