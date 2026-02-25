-- Criação da tabela professions
CREATE TABLE IF NOT EXISTS professions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
);

-- Inserção das profissões padrão
INSERT OR IGNORE INTO professions (name) VALUES
    ('Médico'),
    ('Enfermeiro'),
    ('Técnico de Enfermagem'),
    ('Fisioterapeuta'),
    ('Nutricionista'),
    ('Psicólogo'),
    ('Assistente Social');
