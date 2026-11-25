---
name: tarefa
description: Organiza as tarefas no workspace (pasta work/ ao lado dos repositórios), fora dos repos — task.md, planos, diário de sessões, pendências e prints. Use para iniciar, retomar, registrar ou fechar uma tarefa: "nova tarefa", "onde paramos", "retomar", "registrar a sessão", "anotar pendência", "salvar print", "fechar a tarefa", "o que está pendente", e SEMPRE no fim de uma sessão de trabalho em código para registrar o que foi feito.
---

# Tarefa

As regras do workspace estão no `AGENTS.md` da raiz do workspace (estrutura, nomes, prints, limpeza). Leia antes, se ainda não estiver no contexto. As tarefas ficam em `work/<aaaa-mm-dd>-<slug>/`; a visão geral de todas está em `work/INDEX.md` (gerado pelo hook, não editar à mão).

Comandos: `/tarefa iniciar`, `/tarefa retomar`, `/tarefa registrar`, `/tarefa pendencia`, `/tarefa print`, `/tarefa fechar`, `/tarefa visao`. Sem comando: descubra pela branch atual qual é a tarefa e retome.

## iniciar
1. Procure em `work/` uma pasta do mesmo tema; continuação entra nela. Outra branch do mesmo tema: pasta nova com `**Relacionada:**` nas duas `task.md`.
2. Confirme nome, branch e objetivo (se a pessoa já disse, não pergunte de novo).
3. Crie `work/<aaaa-mm-dd>-<branch sem prefixo>/` com `screenshots/`, `data/`, `sessions.md` e a `task.md` do modelo (`templates/task.md` deste kit), preenchida com o que já foi combinado. Plano aprovado vai para `plan.md`; planos seguintes vão para `plans/`.

O hook lê os campos do cabeçalho (`**Situação:**`, `**Branch:**`, `**PR:**`) e os itens de primeiro nível (`- `) das duas listas de pendências. Mantenha esse formato.

## retomar
1. Ache a pasta pela branch atual (`git branch --show-current`): a `task.md` com essa branch no campo `**Branch:**`. Leia só a `task.md`.
2. Diga em poucas linhas: objetivo, estado, próximo passo e as **pendências minhas** em aberto. Confira o estado contra o git e avise se divergir.

## pendencia (a qualquer momento, sem parar o trabalho)
- Achou algo errado que não vai corrigir agora (bug fora do escopo, ambiente quebrado, item menor de review, dívida técnica): acrescente em **Pendências do projeto**, uma linha com `arquivo:linha` quando houver e o porquê. Não peça licença; siga a tarefa.
- Algo que só a pessoa pode fazer (push, publicar, testar na máquina real, liberar permissão, avisar alguém): acrescente em **Pendências minhas**.
- Resolvido: tire da lista (o registro fica no `sessions.md`).

## registrar (fim de sessão)
1. No topo de `sessions.md`: `## AAAA-MM-DD — <resumo>`, link da thread, o que foi feito, o que ficou pendente.
2. Reescreva "Estado" e "Próximo passo" da `task.md` (substituir, não acumular; a `task.md` inteira fica abaixo de 60 linhas, porque entra no contexto de toda sessão). Decisão nova vai em "Decisões". Atualize as duas listas de pendências e a `**Situação:**` (`ativa` → `em revisão` quando o PR abrir → `mergeada` quando entrar na branch principal).
3. Prints, sem pedir aprovação: escolha sozinho, entre os prints da pasta temporária, os que são evidência (feature pronta, bug antes/depois); copie para `screenshots/` com número e nome descritivo e cite em "Prints". Depois mande para a lixeira do sistema todo arquivo de `screenshots/` cujo nome não aparece na `task.md`.
   - Windows (PowerShell):
     ```powershell
     Add-Type -AssemblyName Microsoft.VisualBasic
     $t = Get-Content <pasta>\task.md -Raw -Encoding UTF8
     Get-ChildItem <pasta>\screenshots -File | ? { $t -notmatch "(?<![\w-])$([regex]::Escape($_.Name))" } | % { [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile($_.FullName,'OnlyErrorDialogs','SendToRecycleBin') }
     ```
   - macOS/Linux: `trash` (ou `gio trash`) em cada arquivo não citado.
4. Log bruto de servidor em `data/` (`*.log`, `*.err`): mande para a lixeira; o que importa já está no `sessions.md` ou num `data/lab-log.md`.
5. Achou armadilha nova do ambiente de teste: acrescente em `history/lab/README.md`.

## print
1. Durante o teste, salve na pasta temporária. Só a evidência vai para `screenshots/` (passo 3 do registrar), citada em "Prints" da `task.md`.
2. Dado real de cliente ou pessoal na tela: prefira o ambiente de teste com dado fictício.

## fechar (PR mesclado)
1. Leve para a documentação do repo, curto, o que está em "Ao fechar" e o que ainda vale em "Decisões". Essa mudança vai num commit normal da branch.
2. Pendências do projeto que ainda valem: acrescente em `history/backlog/README.md` (com a pasta de origem). Pendências minhas abertas: avise a pessoa.
3. Faça a limpeza de prints e logs (passos 3 e 4 do registrar).
4. Marque `**Situação:** fechada` e, no topo da `task.md`, `**Fechada em AAAA-MM-DD** — PR <link>`. A pasta fica em `work/` (limpeza só quando a pessoa pedir, pelas regras do `AGENTS.md`).

## visao ("o que está pendente", "como estão as tarefas")
Leia `work/INDEX.md` e resuma: tarefas por situação, pendências minhas, worktrees sem tarefa. Se parecer desatualizado, confira nas `task.md`.

## Limites
- Nada do workspace vai para um repo. Não commitar, não dar push de nada de `work/` ou `history/`.
