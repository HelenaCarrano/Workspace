// Hooks do workflow /tarefa. Uso: node tarefa.js start|prompt|stop  (JSON do hook no stdin)
// Configuração: tarefa.config.json ao lado deste arquivo ({ "workspace": "...", "branchesBase": [...] })
// ou a variável de ambiente TAREFA_WORKSPACE.
// start: injeta o AGENTS.md, a task.md da tarefa da branch atual e os avisos do índice (worktrees sem tarefa).
// prompt: a cada mensagem; se a sessão mudou de pasta (thread movida para um worktree), entrega a task.md dessa pasta.
// stop: regenera work/INDEX.md; se a sessão mexeu em código e o sessions.md não tem bloco de hoje, pede o registro (uma vez só).
// Fora do workspace não faz nada.
const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

function lerConfig() {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'tarefa.config.json'), 'utf8').replace(/^﻿/, '')) } catch { return {} }
}
const CONFIG = lerConfig()
const WORKSPACE = process.env.TAREFA_WORKSPACE || CONFIG.workspace
if (!WORKSPACE) process.exit(0) // sem workspace configurado: não faz nada
const WORK = path.join(WORKSPACE, 'work')
const BRANCHES_BASE = new Set(CONFIG.branchesBase || ['develop', 'master', 'main'])
const IGNORAR = new Set(['work', 'history', 'node_modules'])
const modo = process.argv[2]

function lerStdin() {
  try { return JSON.parse(fs.readFileSync(0, 'utf8').replace(/^﻿/, '') || '{}') } catch { return {} }
}
function git(cwd, args) {
  try { return execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000 }).trim() } catch { return '' }
}
function data(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const hoje = () => data(new Date())
const norm = p => path.resolve(p).toLowerCase().replace(/\\/g, '/').replace(/\/$/, '')
const slugDe = branch => branch.replace(/^[^/]+\//, '').replace(/\//g, '-')
const ler = arq => { try { return fs.readFileSync(arq, 'utf8') } catch { return '' } }

// --- leitura das tarefas -------------------------------------------------
function campo(texto, nome) {
  const m = texto.match(new RegExp(`\\*\\*${nome}:\\*\\*\\s*([^\\n·]*)`))
  return m ? m[1].trim() : ''
}
function secao(texto, titulo) {
  const linhas = texto.split(/\r?\n/)
  const i = linhas.findIndex(l => l.trim().toLowerCase() === `## ${titulo}`.toLowerCase())
  if (i < 0) return []
  const itens = []
  for (const l of linhas.slice(i + 1)) {
    if (l.startsWith('## ')) break
    if (/^- /.test(l) && !/^- \(nenhum/i.test(l)) itens.push(l.slice(2).trim())
  }
  return itens
}
function ultimaAtividade(pasta) {
  let max = 0
  const andar = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) andar(p); else max = Math.max(max, fs.statSync(p).mtimeMs) } }
  try { andar(pasta) } catch {}
  return max ? data(new Date(max)) : ''
}
function tarefas() {
  if (!fs.existsSync(WORK)) return []
  return fs.readdirSync(WORK).filter(n => /^\d{4}-\d{2}-\d{2}-/.test(n) && fs.statSync(path.join(WORK, n)).isDirectory()).sort().map(nome => {
    const pasta = path.join(WORK, nome)
    const texto = ler(path.join(pasta, 'task.md'))
    const branchCampo = campo(texto, 'Branch') || (texto.match(/Branch:\s*`([^`]+)`/) || [])[1] || ''
    const branch = (branchCampo.match(/`([^`]+)`/) || [null, branchCampo])[1] || ''
    const fechada = /\*\*Fechada em/.test(texto)
    return {
      nome, pasta, texto, branch,
      titulo: (texto.match(/^# (.+)$/m) || [null, nome])[1].trim(),
      situacao: fechada ? 'fechada' : (campo(texto, 'Situação') || '?'),
      worktree: (campo(texto, 'Worktree').match(/`([^`]+)`/) || [null, ''])[1],
      pr: (campo(texto, 'PR').match(/pull\/(\d+)/) || [null, ''])[1],
      minhas: secao(texto, 'Pendências minhas'),
      projeto: secao(texto, 'Pendências do projeto'),
      ultima: ultimaAtividade(pasta),
    }
  })
}
function tarefaDaBranch(lista, branch) {
  if (!branch) return null
  const achadas = lista.filter(t => t.branch === branch || t.nome.slice(11) === slugDe(branch))
  return achadas.length ? achadas[achadas.length - 1] : null
}
// Repos do workspace: pastas com .git (diretório) até 2 níveis abaixo da raiz (ex.: app/ ou cliente/app/).
function repos() {
  const achados = []
  const olhar = (dir, nivel) => {
    let itens = []
    try { itens = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const e of itens) {
      if (!e.isDirectory() || IGNORAR.has(e.name) || e.name.startsWith('.')) continue
      const p = path.join(dir, e.name)
      let ehRepo = false
      try { ehRepo = fs.statSync(path.join(p, '.git')).isDirectory() } catch {}
      if (ehRepo) achados.push(p)
      else if (nivel < 2) olhar(p, nivel + 1)
    }
  }
  olhar(WORKSPACE, 1)
  return achados
}
// Worktrees de todos os repos do workspace (sem repetir).
function worktrees() {
  const lista = []
  const vistos = new Set()
  for (const repo of repos()) {
    let atual = null
    for (const l of git(repo, ['worktree', 'list', '--porcelain']).split(/\r?\n/)) {
      if (l.startsWith('worktree ')) {
        const caminho = l.slice(9)
        atual = vistos.has(norm(caminho)) ? null : { caminho, branch: '' }
        if (atual) { vistos.add(norm(caminho)); lista.push(atual) }
      } else if (l.startsWith('branch ') && atual) atual.branch = l.slice(7).replace('refs/heads/', '')
    }
  }
  return lista
}

// --- índice -------------------------------------------------------------
function gerarIndice(lista) {
  const wts = worktrees()
  const dentroDoWorkspace = norm(WORKSPACE)
  const orfas = wts.filter(w => w.branch && !BRANCHES_BASE.has(w.branch) && norm(w.caminho).startsWith(dentroDoWorkspace) && !tarefaDaBranch(lista, w.branch))
  const esquecidas = wts.filter(w => !norm(w.caminho).startsWith(dentroDoWorkspace))
  const abertas = lista.filter(t => t.situacao !== 'fechada')
  const linhas = [
    '# Índice das tarefas',
    '',
    '> Gerado pelo hook `~/.claude/hooks/tarefa.js` a cada fim de turno. Não edite: mude a `task.md` da tarefa.',
    '',
    '| Tarefa | Situação | Branch | PR | Minhas | Projeto | Última atividade |',
    '|---|---|---|---|---|---|---|',
    ...lista.map(t => `| [${t.titulo}](${t.nome}/task.md) | ${t.situacao} | ${t.branch ? '`' + t.branch + '`' : '—'} | ${t.pr ? '#' + t.pr : '—'} | ${t.minhas.length || '—'} | ${t.projeto.length || '—'} | ${t.ultima} |`),
    '',
  ]
  const comMinhas = abertas.filter(t => t.minhas.length)
  if (comMinhas.length) {
    linhas.push('## Pendências minhas', '')
    for (const t of comMinhas) { linhas.push(`**${t.titulo}**`); for (const p of t.minhas) linhas.push(`- ${p}`); linhas.push('') }
  }
  const prontas = lista.filter(t => t.situacao === 'mergeada' || t.situacao === 'fechada')
  if (prontas.length) linhas.push('## Prontas para a limpeza (quando você pedir)', '', ...prontas.map(t => `- ${t.nome} (${t.situacao})`), '')
  if (orfas.length || esquecidas.length) {
    linhas.push('## Worktrees sem tarefa', '')
    for (const w of orfas) linhas.push(`- \`${path.basename(w.caminho)}\` (\`${w.branch}\`): sem pasta em \`work/\`. Criar a tarefa ou remover o worktree.`)
    for (const w of esquecidas) linhas.push(`- \`${w.caminho}\`: worktree fora do workspace (laboratório esquecido?). Remover com \`git worktree remove\`.`)
    linhas.push('')
  }
  const conteudo = linhas.join('\n')
  const arq = path.join(WORK, 'INDEX.md')
  if (ler(arq) !== conteudo) { try { fs.writeFileSync(arq, conteudo, 'utf8') } catch {} }
  return { orfas, esquecidas }
}

// --- principal ----------------------------------------------------------
const entrada = lerStdin()
const cwd = entrada.cwd || process.cwd()
if (!norm(cwd).startsWith(norm(WORKSPACE))) process.exit(0)

// Estado da sessão no temp do sistema: 1ª linha = pasta onde o contexto foi entregue; resto = foto do git (HEAD + status) naquele momento.
const LIMITE_TASK = 60
const arqBase = path.join(require('os').tmpdir(), `tarefa-hook-${String(entrada.session_id || 'sem-id').replace(/[^\w-]/g, '')}.txt`)
const base = fs.existsSync(arqBase) ? ler(arqBase).split('\n') : null
const baseCwd = base ? base[0] : null
const baseFoto = base ? base.slice(1).join('\n') : null

// prompt roda a cada mensagem: só trabalha quando a sessão mudou de pasta (thread do T3 que começou na raiz e foi para um worktree).
if (modo === 'prompt' && baseCwd === norm(cwd)) process.exit(0)

const lista = tarefas()
const branch = git(cwd, ['branch', '--show-current'])
const t = tarefaDaBranch(lista, branch)
function fotoGit() { return git(cwd, ['rev-parse', 'HEAD']) + '\n' + git(cwd, ['status', '--porcelain']) }
function salvarBase() { try { fs.writeFileSync(arqBase, norm(cwd) + '\n' + fotoGit(), 'utf8') } catch {} }

function contextoDaPasta() {
  const partes = []
  const guia = path.join(WORKSPACE, 'AGENTS.md')
  // Na raiz do workspace o Claude Code já carrega o AGENTS.md sozinho: injetar de novo só gasta tokens.
  if (norm(cwd) !== norm(WORKSPACE) && fs.existsSync(guia)) partes.push(`Regras do workspace (${guia}):\n\n${ler(guia)}`)
  if (t && t.texto) {
    const linhas = t.texto.split(/\r?\n/).length
    const aviso = linhas > LIMITE_TASK ? `\n\nA task.md tem ${linhas} linhas (limite ${LIMITE_TASK}): no próximo registro, enxugue (histórico vai para o sessions.md, detalhe para plans/ ou data/).` : ''
    partes.push(`Tarefa da branch \`${branch}\` (pasta: ${t.pasta}). Conteúdo atual da task.md:\n\n${t.texto}\n\nAo terminar uma sessão que mexer em código, registre com /tarefa registrar.${aviso}`)
  }
  else if (branch && !BRANCHES_BASE.has(branch)) partes.push(`A branch \`${branch}\` não tem pasta em work/. Se for uma tarefa nova, pergunte antes de criar (/tarefa iniciar).`)
  return partes
}

if (modo === 'prompt') {
  const partes = contextoDaPasta()
  salvarBase()
  if (partes.length) process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: `A sessão mudou para ${cwd}.\n\n` + partes.join('\n\n---\n\n') } }))
  process.exit(0)
}

if (modo === 'start') {
  const partes = contextoDaPasta()
  salvarBase()
  const { orfas, esquecidas } = gerarIndice(lista)
  const avisos = [
    ...orfas.map(w => `worktree ${path.basename(w.caminho)} (${w.branch}) sem pasta em work/`),
    ...esquecidas.map(w => `worktree esquecido fora do workspace: ${w.caminho}`),
  ]
  partes.push(`Visão geral das tarefas: ${path.join(WORK, 'INDEX.md')}.` + (avisos.length ? ` Avise a pessoa usuária uma vez, no início, sem agir sozinho: ${avisos.join('; ')}.` : ''))
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: partes.join('\n\n---\n\n') } }))
  process.exit(0)
}

if (modo === 'stop') {
  gerarIndice(lista)
  if (!t || entrada.stop_hook_active) process.exit(0) // sem tarefa, ou já lembrou neste fim de turno
  // Com a foto da mesma pasta: só conta o que mudou NESTA sessão (alteração antiga parada no worktree não dispara).
  const alterado = baseCwd === norm(cwd) ? fotoGit() !== baseFoto : (git(cwd, ['status', '--porcelain']) !== '' || git(cwd, ['log', '--since=midnight', '--format=%h', '-1']) !== '')
  if (!alterado) process.exit(0)
  const sessoes = path.join(t.pasta, 'sessions.md')
  if (ler(sessoes).includes(`## ${hoje()}`)) process.exit(0)
  process.stdout.write(JSON.stringify({
    decision: 'block',
    reason: `Houve alteração de código hoje na branch ${branch} e ${sessoes} ainda não tem bloco de ${hoje()}. Registre a sessão agora (/tarefa registrar): bloco no topo do sessions.md, "Estado"/"Próximo passo"/pendências da task.md atualizados e prints não citados descartados. Depois pode encerrar.`,
  }))
  process.exit(0)
}
