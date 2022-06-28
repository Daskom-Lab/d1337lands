SET check_function_bodies = false;
INSERT INTO public.title_codes (id, title, description) VALUES (1, 'god among men', 'the first to finish every single quest in daskom1337 lands');
INSERT INTO public.title_codes (id, title, description) VALUES (2, 'bug hunter', 'first to found a bug in daskom1337 lands');
INSERT INTO public.title_codes (id, title, description) VALUES (3, 'winner of 2022', 'winner of welcoming party 2022');
INSERT INTO public.title_codes (id, title, description) VALUES (4, 'adventurer', 'first to found easter egg (area 51)');
SELECT pg_catalog.setval('public.title_codes_id_seq', 4, true);
