-- Corrige valores de specialty em cooperados que não existem em professions
-- Neutraliza para NULL (ou pode ajustar para um valor padrão existente)

UPDATE cooperados
SET specialty = NULL
WHERE specialty IS NOT NULL
  AND specialty NOT IN (SELECT name FROM professions);

-- Para visualizar quais seriam afetados:
-- SELECT DISTINCT specialty FROM cooperados WHERE specialty IS NOT NULL AND specialty NOT IN (SELECT name FROM professions);
