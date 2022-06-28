SET check_function_bodies = false;
INSERT INTO public.achievement_codes (id, achievement, description) VALUES (1, 'master of algoisland', 'finished all and every single quest in algoisland');
INSERT INTO public.achievement_codes (id, achievement, description) VALUES (2, 'master of codeisland', 'finished all and every single quest in codeisland');
INSERT INTO public.achievement_codes (id, achievement, description) VALUES (3, 'master of hackisland', 'finished all and every single quest in hackisland');
INSERT INTO public.achievement_codes (id, achievement, description) VALUES (4, 'master of netisland', 'finished all and every single quest in netisland');
INSERT INTO public.achievement_codes (id, achievement, description) VALUES (5, 'master of dataisland', 'finished all and every single quest in dataisland');
INSERT INTO public.achievement_codes (id, achievement, description) VALUES (7, 'the completer', 'finish every single quest in daskom1337 lands');
SELECT pg_catalog.setval('public.achievement_codes_id_seq', 10, true);
