-- Repõe o estado demo: fila cheia, sem fretes nem logs (idempotente).
DELETE FROM matcher_logs;
DELETE FROM fretes;
DELETE FROM sms_logs;
UPDATE ofertas SET status = 'agregada';
