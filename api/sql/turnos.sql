-- Tabela: turnos_padroes
CREATE TABLE IF NOT EXISTS turnos_padroes (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  horario_inicio TEXT NOT NULL, -- formato HH:mm
  horario_fim TEXT NOT NULL,    -- formato HH:mm
  tolerancia_antes INTEGER DEFAULT 0, -- minutos
  tolerancia_depois INTEGER DEFAULT 0, -- minutos
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Tabela: turnos_unidade (valores por turno/unidade)
CREATE TABLE IF NOT EXISTS turnos_unidade (
  id TEXT PRIMARY KEY,
  hospital_id TEXT NOT NULL,
  turno_padrao_id TEXT NOT NULL,
  categoria_profissional TEXT NOT NULL,
  valor_hora REAL NOT NULL,
  tolerancia_antes INTEGER DEFAULT 0,
  tolerancia_depois INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(turno_padrao_id) REFERENCES turnos_padroes(id)
);
