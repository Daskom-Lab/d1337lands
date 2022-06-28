SET check_function_bodies = false;
INSERT INTO public.potion_codes (id, code, description, price) VALUES (1, 'HINT-KEY', 'can be use to open 1 paid hint', 203);
INSERT INTO public.potion_codes (id, code, description, price) VALUES (2, 'MULP-001', 'can be use to multiply leetcoin by 0.5 times when redeeming accepted submission', 413);
INSERT INTO public.potion_codes (id, code, description, price) VALUES (3, 'MULP-002', 'can be use to multiply leetcoin by 1 times when redeeming accepted submission', 831);
INSERT INTO public.potion_codes (id, code, description, price) VALUES (4, 'MULP-003', 'can be use to multiply leetcoin by 2 times when redeeming accepted submission', 1337);
INSERT INTO public.potion_codes (id, code, description, price) VALUES (5, 'COLOR-UNAME', 'can be use to change your in game nickname color', 1618);
SELECT pg_catalog.setval('public.potions_id_seq', 5, true);
