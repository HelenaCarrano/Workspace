---
name: limpeza
description: Limpa o que a branch vai levar no push — remove testes, comentários, logs e mocks inúteis, junta arquivos novos aos existentes, enxuga docs, apaga código e arquivos mortos e sobras de investigação, consolida migrações. Use SEMPRE que a pessoa pedir para limpar, arrumar, revisar ou "fazer a limpeza" de uma tarefa, branch ou implementação, mesmo sem citar a skill, e SEMPRE antes de um push (ou quando a pessoa disser que vai dar push / abrir PR).
---

# Limpeza

Projetos crescem rápido quando um agente escreve código. Uma tarefa deixa só o que precisa: cada linha adicionada tem que se justificar.

## Escopo

Tudo o que o push vai levar:
- os commits da branch que ainda não estão no remoto (`git log @{u}..HEAD`, ou `origin/<branch principal>..HEAD` se a branch ainda não tem upstream; o diff é `git diff <base>...HEAD`);
- o que estiver sem commit (`git status --short`, `git diff HEAD`, incluindo não rastreados).

O que já está no remoto fica de fora. Limpe o que essas alterações adicionaram ou mudaram e o que elas deixaram sem uso em outro lugar. Código alheio à tarefa: não refatorar, só relatar (e anotar em "Pendências do projeto" da `task.md`, se o workspace usar a skill `/tarefa`).

Antes de começar, leia as regras do repo (`CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`, guia de testes): onde a lista abaixo diz "regras do projeto", são elas.

## A lista

1. **Sobras de investigação.** Apagar arquivos de saída e rascunho (dumps, `saida-*.txt`, prints), scripts avulsos de "só pra ver" e páginas de laboratório que a tarefa criou. Se aparecer no diff `.env`, credencial, dado de cliente ou dado pessoal, tirar do diff (não apagar o arquivo) e avisar.
2. **Logs e debug.** Remover `console.log`/`print`/`debugger` de depuração. Fica só log que ajuda a operar em produção (erro, início de rotina agendada).
3. **Testes.** Seguir o guia de testes do repo. Remover os que não protegem um comportamento observável (regra de negócio, cálculo, resposta de API) nem um bug corrigido, os que testam texto, cor ou contagem, os que só conferem o valor que receberam e os que repetem o que outro teste já prova. Caso novo vai no arquivo de teste existente do módulo; arquivo novo só para área sem nenhum.
4. **Mocks.** Remover mocks e dados falsos que a tarefa adicionou. Se um teste não roda sem ele, manter e dizer por quê.
5. **Comentários.** Remover comentário que repete o código. Fica só o PORQUÊ não óbvio.
6. **Arquivo existente primeiro.** Mover código para um arquivo existente do mesmo contexto em vez de criar um novo. Arquivo novo só fica por reuso real ou pela estrutura do projeto (uma rota por domínio, uma pasta por módulo etc.). Justificar cada um que ficar.
7. **Docs alterados.** Enxugar todo doc que a tarefa mexeu: direto, uma linha por regra. O arquivo de instruções do agente (`CLAUDE.md`/`AGENTS.md`) fica curto, com no máximo uma linha por módulo ou armadilha transversal; o detalhe vai para a doc do módulo; diário de investigação não fica no repo. Mover o que estiver no lugar errado.
8. **Docs novos.** Doc novo só se não couber, enxuto, na doc existente do módulo. Nunca um doc por tela, feature ou contrato de API: o código e os testes são o contrato. Plano ou proposta criado pela tarefa não fica no repo (vai para a pasta da tarefa no workspace).
9. **Código morto.** Apagar funções, arquivos, imports, rotas, assets, classes CSS, chaves de configuração e propriedades sem uso que a tarefa deixou.
10. **Regras do projeto no diff.** Corrigir no que a tarefa escreveu o que fere as regras do repo (ex.: cor literal em vez de token de tema, preferência guardada no lugar errado, valor calculado sendo persistido). Rode o lint barato do projeto, se houver.
11. **Migrações.** Se a tarefa criou mais de uma migração de banco, consolidar numa só com o schema final idêntico — **só migrações que não rodaram em banco nenhum**. Se o servidor local aplica migrações ao subir, elas podem já ter rodado: na dúvida, perguntar antes. Migração já aplicada nunca se edita nem se apaga. Conferir também que não entrou `DROP` de tabela de outra pessoa.

## Limites

- Só limpeza: o que a tarefa implementou continua funcionando exatamente igual.
- Rodar a suíte de testes e os builds completos é de quem fez a tarefa, não desta skill (exceto lint barato).
- A limpeza fica sem commit para a pessoa revisar e commitar (um commit `chore: limpeza` por cima, sem reescrever os commits já feitos). Não dar push, não fazer merge, não publicar nada.
- Na dúvida se algo é sobra ou é da pessoa, perguntar em vez de apagar.

## Resumo final

Terminar com um resumo curto, uma linha por item com a contagem:

```
Sobras apagadas: N
Logs removidos: N
Testes removidos: N
Mocks removidos: N
Comentários removidos: N
Arquivos unidos: N
Docs enxugados/movidos: N (−X linhas)
Docs removidos: N
Código morto removido: N (−X linhas)
Regras corrigidas: N
Migrações consolidadas: N → 1
Total: −X linhas
```

Depois, cada arquivo novo que ficou, uma linha com o motivo.
