# AGENTS.md — Regras do workspace

> Copie este arquivo para a **raiz do seu workspace** (a pasta que guarda seus repositórios) e ajuste a seção "Estrutura" aos seus repos.

Esta pasta guarda os repositórios e os documentos de trabalho (planos, estudos, resultados, capturas). Toda entrega fora dos repos segue as regras abaixo. **Dentro de um repo, valem as regras dele** (`CLAUDE.md`/`AGENTS.md` do próprio repo).

## Estrutura

```
<workspace>/
├── AGENTS.md                     este guia
├── <repo-a>/                     repositórios (não mover, não renomear)
├── <projeto>/                    um repo com seus worktrees ao lado
│   ├── <projeto>/                checkout principal
│   └── wt-<nome>/                um worktree por branch em andamento
├── work/
│   ├── INDEX.md                  visão geral de todas as tarefas (gerado pelo hook, não editar)
│   └── <aaaa-mm-dd>-<slug>/      uma pasta por tarefa
│       ├── task.md               ponto de entrada: situação, objetivo, decisões, estado, próximo passo, pendências
│       ├── sessions.md           diário de sessões, a mais nova no topo
│       ├── plan.md               o plano principal
│       ├── <tipo>.md             outros docs da tarefa (study, test, guide, result...)
│       ├── plans/                planos extras: por assunto (<assunto>-plan.md) e versões (plan-2.md)
│       ├── drafts/               textos para colar fora: descrição de PR, notas de release, mensagens
│       ├── screenshots/          capturas (só evidência)
│       └── data/                 todo o resto
└── history/<tema>/               o que se guarda para sempre
```

## Regras

1. **Nada solto na raiz.**
   - Na raiz ficam só os repos, `work/`, `history/` e `AGENTS.md`. Em `work/`, só as pastas de tarefa e o `INDEX.md`.
   - As regras do workspace ficam só neste arquivo (não crie `CLAUDE.md` na raiz).
2. **Nomes em inglês**, kebab-case, sem acento e sem espaço. O conteúdo dos docs pode ser no seu idioma.
3. **Uma pasta por tarefa:** `work/<aaaa-mm-dd>-<slug>/`.
   - A data é a do início. Tarefa de código: o slug é a branch sem o prefixo (`feature/login-social` → `2026-01-10-login-social`). Estudo sem branch: slug curto e descritivo.
   - Antes de criar, procure em `work/` uma pasta do mesmo tema: continuação entra na pasta existente.
   - Tarefa nova do mesmo tema de outra: pasta própria, com `**Relacionada:**` no cabeçalho das duas `task.md`.
4. **Como o agente se localiza.**
   - Ao começar numa branch, ache a pasta cuja `task.md` tem essa branch no campo `**Branch:**` (ou que termina com o nome dela) e leia **só a `task.md`**. O resto é consulta.
   - A `task.md` tem no cabeçalho `**Situação:**` (`ativa`, `em revisão`, `mergeada` ou `fechada`) e duas listas sempre atuais:
     - **Pendências minhas:** o que só a pessoa pode fazer (push, publicar, testar na máquina real, liberar permissão, avisar alguém).
     - **Pendências do projeto:** problema achado no meio do trabalho que não vai ser corrigido agora. Anote na hora, sem parar a tarefa. Resolvido sai da lista; ao fechar, o que ainda vale vai para `history/backlog/README.md`.
   - Não achou a pasta: pergunte se é tarefa nova antes de criar.
   - `task.md` é curta (até 60 linhas) e sempre atual: é reescrita, não acumulada. O histórico vai para `sessions.md`.
   - No fim de uma sessão que mexeu em código: bloco no topo de `sessions.md` e "Estado"/"Próximo passo" da `task.md` atualizados. A skill `/tarefa` faz isso.
   - Os hooks (`~/.claude/hooks/tarefa.js`) fazem as pontas sozinhos:
     - ao abrir uma sessão, a `task.md` da branch entra no contexto (e este `AGENTS.md`, quando a sessão abre num worktree), com o aviso de worktrees sem tarefa;
     - se a sessão muda de pasta no meio, a `task.md` da pasta nova entra na mensagem seguinte;
     - a cada fim de turno, o `work/INDEX.md` é regenerado;
     - ao terminar um turno com código alterado na sessão e sem bloco de hoje no `sessions.md`, o agente é parado para registrar (uma vez por turno).
5. **Docs com o nome do tipo, sem data** (a data já está na pasta).
   - Tipos: `task.md`, `sessions.md`, `plan.md`, `spec.md`, `study.md`, `analysis.md`, `result.md`, `review.md`, `test.md`, `guide.md`.
   - Plano extra (`plan-2.md`, `<assunto>-plan.md`) vai para `plans/`. Assunto à parte: `<assunto>-<tipo>.md`.
   - Texto para colar fora (descrição de PR, notas de release, mensagem) vai para `drafts/`.
6. **Capturas em `screenshots/`**, numeradas e descritas (`01-visao-geral.png`).
   - Só evidência: a feature pronta e cada bug, antes e depois. Nunca print de teste intermediário.
   - Automático, sem pedir aprovação: durante o teste, os prints vão para uma pasta temporária; o agente escolhe os de evidência, copia para `screenshots/` e cita em "Prints" da `task.md`.
   - No registro e no fechamento, print não citado na `task.md` vai para a lixeira do sistema.
   - Tela com dado real de cliente ou pessoal: prefira um ambiente de teste com dado fictício.
7. **O resto em `data/`:** saídas de teste que valem guardar, protótipos, exports, briefs para agentes. Log bruto de servidor não: vai para a pasta temporária. Ao delegar para outro agente, passe o caminho da pasta da tarefa, nunca a raiz.
8. **Nada do workspace vai para um repo.** Plano, print e diário ficam aqui. Quando a tarefa fecha, decisões e armadilhas que ainda valem são reescritas, curtas, na documentação do repo, num commit normal.
9. **Temporários fora daqui.** Scripts e saídas intermediárias vão para uma pasta temporária da sessão. Só entra no workspace o que alguém vai ler ou o que precisa sobreviver à sessão.
10. **`history/` não se apaga.** Guarda o que vale para sempre e não pertence a um repo. Cada tema tem um `README.md` consolidado e `data/<aaaa-mm-dd>-<nome>/` por rodada. Sugestões:
    - `history/lab/README.md`: como montar o ambiente de teste e as armadilhas conhecidas;
    - `history/backlog/README.md`: pendências do projeto que sobraram de tarefas fechadas.
11. **Não limpe por conta própria.**
    - A limpeza só acontece quando a pessoa pede. Ao terminar, a pasta da tarefa fica em `work/`.
    - Na limpeza: confira no git o que já entrou na branch principal, passe para `history/` o que for histórico e mande a pasta para a lixeira do sistema, nunca `rm`.
    - Worktree se remove com `git worktree remove` (recusa se tiver alteração), depois de conferir que a branch já está no remoto.
12. **Ao mover ou renomear um doc, corrija as referências** nos outros docs de `work/` e `history/`.
