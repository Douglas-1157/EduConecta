-- Estrutura-base do ENEM: áreas, disciplinas e competências. Execute uma vez, antes de tudo.

insert into disciplinas (nome, area, ordem) values
 ('História','humanas',1),('Geografia','humanas',2),('Filosofia','humanas',3),('Sociologia','humanas',4),
 ('Português','linguagens',5),('Literatura','linguagens',6),('Inglês','linguagens',7),('Espanhol','linguagens',8),
 ('Artes e Educação Física','linguagens',9),
 ('Matemática','matematica',10),
 ('Biologia','natureza',11),('Química','natureza',12),('Física','natureza',13),
 ('Redação','redacao',14)
on conflict (nome) do nothing;

-- Competências usadas na nota do simulado (peso relativo). A gestão pode editar.
insert into competencias (area, codigo, nome, peso) values
 ('humanas','A','Historicidade e processos sociais',0.40),
 ('humanas','B','Território, trabalho e sociedade',0.35),
 ('humanas','C','Pensamento crítico e cidadania',0.25),
 ('linguagens','A','Interpretação e linguagens',1),
 ('matematica','A','Raciocínio matemático',1),
 ('natureza','A','Ciências da natureza',1)
on conflict (area, codigo) do nothing;
