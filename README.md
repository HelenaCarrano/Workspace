# Workspace organizado para trabalhar com agentes de IA

Um jeito de organizar a pasta onde ficam os seus repositórios para trabalhar com o **Claude Code** (ou outro agente de código) **sem perder contexto entre sessões, sem bagunçar os repos e gastando menos tokens**.

Serve para qualquer repositório e qualquer linguagem: o kit não mexe dentro dos repos. Ele organiza o que fica **em volta** deles: planos, diário do que foi feito, pendências, prints de evidência e o que vale guardar para sempre.

---

## O problema que isso resolve

Quem trabalha com agentes de IA em várias frentes ao mesmo tempo esbarra sempre nos mesmos problemas:

- **Cada sessão começa do zero.** O agente não sabe o que foi decidido ontem, o que já foi testado nem o que falta.
- **Os docs se espalham.** Planos, rascunhos de PR, prints e logs acabam soltos na raiz, dentro do repo ou perdidos na pasta temporária.
- **Pendências somem.** "Isso aqui está errado, mas não é desta tarefa" vira uma frase perdida no meio de um diário.
- **Ninguém sabe o que está aberto.** Com cinco branches e worktrees em paralelo, saber o que está ativo, em revisão ou esquecido exige abrir tudo.
- **Tokens desperdiçados.** O agente relê diários inteiros, planos antigos e regras duplicadas para se situar.

## A ideia

Ao lado dos repositórios existe uma pasta `work/`, com **uma pasta por tarefa**. Cada tarefa tem uma porta de entrada curta, a `task.md`, que diz em menos de 60 linhas:

- a **situação** (ativa, em revisão, mergeada, fechada);
- o **objetivo** e as **decisões** tomadas;
- o **estado** atual e o **próximo passo**;
- **pendências minhas** (o que só você pode fazer) e **pendências do projeto** (problemas achados no caminho que ficam para depois).

Hooks do Claude Code entregam essa `task.md` ao agente automaticamente, cobram o registro no fim da sessão e mantêm um **índice geral** de todas as tarefas.

```
meu-workspace/
├── AGENTS.md                    regras do workspace (lidas pelo agente)
├── app-web/                     um repositório
├── api/                         um repo com worktrees ao lado
│   ├── api/                     checkout principal
│   └── wt-login-social/         worktree da branch feature/login-social
├── work/
│   ├── INDEX.md                 visão geral, gerada sozinha
│   └── 2026-01-10-login-social/
│       ├── task.md              porta de entrada (curta, sempre atual)
│       ├── sessions.md          diário: o que foi feito em cada sessão
│       ├── plan.md              plano principal
│       ├── plans/               planos extras
│       ├── drafts/              descrição de PR, notas de release
│       ├── screenshots/         só prints de evidência
│       └── data/                o resto que vale guardar
└── history/                     o que se guarda para sempre
    ├── lab/README.md            como montar o ambiente de teste + armadilhas
    └── backlog/README.md        pendências que sobraram de tarefas fechadas
```

## Benefícios

### Organização
- **Uma pasta por tarefa**, com nome previsível (`<data>-<branch>`): você e o agente sempre sabem onde procurar.
- **Raiz limpa**: só repos, `work/`, `history/` e o `AGENTS.md`.
- **Repos intocados**: nada de plano, print ou diário entra num repositório. Quando a tarefa fecha, só as decisões que ainda valem viram documentação no repo, num commit normal.
- **Nomes padronizados** (`plan.md`, `test.md`, `study.md`...): sem `plano-final-v2-agora-vai.md`.

### Nada se perde
- **Registro obrigatório**: se a sessão mexeu em código e não registrou, o hook para o agente e pede o bloco no `sessions.md`. Uma vez por turno, sem laço.
- **Pendências na hora**: achou um bug fora do escopo? Vai para "Pendências do projeto" sem parar a tarefa. Ao fechar, o que sobrou vai para o backlog permanente.
- **Pendências suas em destaque**: push, publicar, testar na máquina real, avisar alguém. Tudo fica junto no `INDEX.md`.
- **Conhecimento acumulado**: armadilhas do ambiente de teste ficam em `history/lab/README.md`, e a próxima tarefa já começa sabendo.
- **Nada é apagado de verdade**: limpeza manda para a lixeira do sistema, nunca `rm`.

### Visão geral sem esforço
- **`work/INDEX.md` gerado sozinho** a cada turno: tabela com situação, branch, PR, número de pendências e última atividade de cada tarefa, mais a lista de pendências suas.
- **Worktrees esquecidos**: o índice aponta worktrees sem tarefa e worktrees perdidos fora do workspace (aquele laboratório que ninguém removeu).
- **Tarefas prontas para limpar** aparecem separadas.

### Economia de tokens
- **O agente lê só a `task.md`** (até 60 linhas). Diário, planos e guias ficam para consulta, lidos só quando a tarefa pede.
- **`task.md` é reescrita, não acumulada**: o histórico vai para o `sessions.md`, que o agente não carrega.
- **Sem regras duplicadas**: o hook só injeta o `AGENTS.md` quando o Claude Code não o carrega sozinho (sessões abertas dentro de um worktree).
- **Índice montado por script**, não pelo modelo: zero tokens para manter a visão geral.
- **Lembrete preciso**: o hook compara o git do início da sessão com o do fim. Abrir uma sessão só para ler não gera registro desnecessário.
- **Prints automáticos**: o agente escolhe sozinho a evidência e descarta o resto, sem rodada de aprovação.

### Funciona com qualquer repositório
- Os repos são **descobertos sozinhos** (qualquer pasta com `.git` até dois níveis abaixo da raiz).
- A tarefa é ligada à branch pelo campo `**Branch:**` da `task.md` ou pelo nome da pasta.
- Branches principais configuráveis (`develop`, `main`, `master`...).

---

## O que tem neste repositório

| Arquivo | Para que serve | Onde instalar |
|---|---|---|
| `AGENTS.md` | Regras do workspace que o agente segue | raiz do seu workspace |
| `agents/hooks/tarefa.js` | Hooks: contexto na abertura, troca de pasta, índice e cobrança do registro | `~/.claude/hooks/` |
| `agents/hooks/tarefa.config.example.json` | Caminho do workspace e branches principais | `~/.claude/hooks/tarefa.config.json` |
| `agents/settings.example.json` | Registro dos três hooks no Claude Code | mesclar em `~/.claude/settings.json` |
| `agents/skills/tarefa/SKILL.md` | Skill `/tarefa` (iniciar, retomar, registrar, pendência, print, fechar, visão) | `~/.claude/skills/tarefa/` |
| `templates/task.md`, `templates/sessions.md` | Modelos de documento da tarefa | consulta (a skill usa o mesmo formato) |

## Instalação

Requisitos: [Claude Code](https://claude.com/claude-code), Node.js 18+ e git.

1. **Crie a estrutura** na pasta que guarda seus repos:
   ```bash
   cd /caminho/do/workspace
   mkdir -p work history/lab history/backlog
   cp <este-repo>/AGENTS.md .
   ```
   Ajuste a seção "Estrutura" do `AGENTS.md` aos seus repos.

2. **Instale o hook e a skill**:
   ```bash
   mkdir -p ~/.claude/hooks ~/.claude/skills/tarefa
   cp agents/hooks/tarefa.js ~/.claude/hooks/
   cp agents/hooks/tarefa.config.example.json ~/.claude/hooks/tarefa.config.json
   cp agents/skills/tarefa/SKILL.md ~/.claude/skills/tarefa/
   ```
   Edite `~/.claude/hooks/tarefa.config.json` com o caminho do seu workspace. Use barras normais, inclusive no Windows: `C:/Users/voce/Projetos`.

3. **Registre os hooks**: copie o bloco `hooks` de `agents/settings.example.json` para o seu `~/.claude/settings.json`, trocando `<HOME>` pelo caminho absoluto da sua pasta de usuário.

4. **Teste**: abra o Claude Code dentro do workspace e peça `/tarefa iniciar`. Depois de alguns turnos, abra `work/INDEX.md`.

Fora da pasta configurada, os hooks não fazem nada: outros projetos seus não são afetados.

## Como é o dia a dia

1. **Começar**: `/tarefa iniciar`. O agente cria a pasta, a `task.md` e o plano.
2. **Trabalhar**: a cada sessão nova na branch, o agente já recebe a `task.md` e sabe onde parou. Achou algo errado fora do escopo? Ele anota em "Pendências do projeto" e segue.
3. **Encerrar a sessão**: o hook cobra o registro. O agente escreve o bloco no `sessions.md`, atualiza estado, próximo passo e pendências e guarda só os prints de evidência.
4. **Ver tudo**: abra `work/INDEX.md` ou peça `/tarefa visao`.
5. **Fechar**: `/tarefa fechar` leva as decisões para a documentação do repo e as pendências restantes para o backlog. A pasta fica em `work/` até você pedir a limpeza.

## Como os hooks funcionam

| Momento | O que o hook faz | Custo |
|---|---|---|
| Abertura da sessão | Entrega a `task.md` da branch (e o `AGENTS.md`, se for um worktree), avisa sobre worktrees sem tarefa e guarda uma foto do git | ~0,3 s |
| Cada mensagem | Se a sessão mudou de pasta, entrega a `task.md` da pasta nova; senão, sai na hora | ~0,15 s |
| Fim de cada turno | Regenera o `INDEX.md`; se o código mudou nesta sessão e não há registro de hoje, pede o registro | ~0,3 s |

## Limites conhecidos

- A **Situação** da tarefa é atualizada pelo agente no registro. O hook não consulta o GitHub, porque isso deixaria cada turno lento e exigiria login.
- Trabalho feito direto na branch principal não fica ligado a nenhuma tarefa. Use sempre uma branch (de preferência num worktree) por tarefa.
- Os comandos de lixeira da skill têm versão para Windows (PowerShell) e uma sugestão para macOS/Linux (`trash`/`gio trash`).

## Licença

Uso livre. Adapte as regras ao seu jeito de trabalhar.
