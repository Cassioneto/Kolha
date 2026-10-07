-- Seed demo: 5 agregadoras + 3 camionistas + 20 ofertas (timestamps recentes p/ demo)
INSERT OR IGNORE INTO users (id, telefone, nome, tipo, rota, created_at) VALUES
('u-esperanca','923000001','Tia Esperança','agregadora','Caxito-Talatona',1791320000),
('u-fatima','923000002','Tia Fátima','agregadora','Caxito-Talatona',1791320000),
('u-joao','923000003','Tio João','agregadora','Caxito-Talatona',1791320000),
('u-luisa','923000004','Tia Luísa','agregadora','Caxito-30',1791320000),
('u-maria','923000005','Tia Maria','agregadora','Caxito-Talatona',1791320000),
('u-domingos','923000100','Tio Domingos','camionista','Caxito-Talatona',1791320000),
('u-pedro','923000101','Tio Pedro','camionista','Caxito-30',1791320000),
('u-carlos','923000102','Tio Carlos','camionista','Caxito-Talatona',1791320000);

INSERT OR IGNORE INTO ofertas (id, produto, qtd, rota, grupo, agregadora_id, status, created_at) VALUES
('o-001','tomate',800,'Caxito-Talatona','A','u-esperanca','agregada',1791320100),
('o-002','cebola',1200,'Caxito-Talatona','A','u-fatima','agregada',1791321000),
('o-003','batata',900,'Caxito-Talatona','A','u-joao','agregada',1791321900),
('o-004','repolho',600,'Caxito-Talatona','A','u-maria','agregada',1791322800),
('o-005','cenoura',500,'Caxito-Talatona','A','u-esperanca','agregada',1791323700),
('o-006','tomate',700,'Caxito-Talatona','A','u-fatima','agregada',1791324600),
('o-007','banana',800,'Caxito-Talatona','B','u-esperanca','agregada',1791325500),
('o-008','manga',600,'Caxito-Talatona','B','u-fatima','agregada',1791326400),
('o-009','abacate',500,'Caxito-Talatona','B','u-joao','agregada',1791327300),
('o-010','tomate',1000,'Caxito-30','A','u-luisa','agregada',1791328200),
('o-011','cebola',800,'Caxito-30','A','u-luisa','agregada',1791329100),
('o-012','batata',750,'Caxito-Talatona','A','u-maria','agregada',1791330000),
('o-013','pimento',400,'Caxito-Talatona','A','u-esperanca','agregada',1791330900),
('o-014','tomate',950,'Caxito-Talatona','A','u-joao','agregada',1791331800),
('o-015','cenoura',550,'Caxito-30','A','u-luisa','agregada',1791332700),
('o-016','mamao',650,'Caxito-Talatona','B','u-maria','agregada',1791333600),
('o-017','ananas',450,'Caxito-Talatona','B','u-esperanca','agregada',1791334500),
('o-018','tomate',1100,'Caxito-Talatona','A','u-fatima','agregada',1791335400),
('o-019','repolho',700,'Caxito-Kikolo','A','u-maria','agregada',1791336300),
('o-020','cebola',850,'Caxito-Kikolo','A','u-joao','agregada',1791337200);
