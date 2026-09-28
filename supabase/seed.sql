-- Local-only fictional fixtures. Never use these credentials or identities in a deployed environment.
-- Supabase runs this after migrations on local db reset. All IDs and domains are synthetic.
insert into auth.users
  (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
   confirmation_token, recovery_token, email_change, email_change_token_new,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'deniz@kapsam.invalid',
   extensions.crypt('YerelTest2026!', extensions.gen_salt('bf')), now(), '', '', '', '',
   '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'ece@kapsam.invalid',
   extensions.crypt('YerelTest2026!', extensions.gen_salt('bf')), now(), '', '', '', '',
   '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into auth.identities (user_id, provider_id, identity_data, provider, created_at, updated_at)
values
  ('11111111-1111-4111-8111-111111111111', 'deniz@kapsam.invalid',
   '{"sub":"11111111-1111-4111-8111-111111111111","email":"deniz@kapsam.invalid","email_verified":true}',
   'email', now(), now()),
  ('22222222-2222-4222-8222-222222222222', 'ece@kapsam.invalid',
   '{"sub":"22222222-2222-4222-8222-222222222222","email":"ece@kapsam.invalid","email_verified":true}',
   'email', now(), now());

insert into public.profiles (id, full_name, profession, default_currency, onboarding_completed_at)
values
  ('11111111-1111-4111-8111-111111111111', 'Deniz Kaya', 'Arayüz tasarımcısı', 'TRY', now()),
  ('22222222-2222-4222-8222-222222222222', 'Ece Arslan', 'Yazılım geliştirici', 'EUR', now());

insert into public.clients (id, user_id, name, company_name)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'Pelin Er', 'Kuzey Stüdyo'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '22222222-2222-4222-8222-222222222222', 'Mert Güneş', 'Mavi Atölye');

insert into public.proposals
  (id, user_id, client_id, client_name, client_company, project_name, currency, tax_mode, duration_text)
values
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '11111111-1111-4111-8111-111111111111',
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Pelin Er', 'Kuzey Stüdyo',
   'Kurgusal web arayüzü tasarımı', 'TRY', 'excluded', '3 hafta'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', '22222222-2222-4222-8222-222222222222',
   'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Mert Güneş', 'Mavi Atölye',
   'Kurgusal rezervasyon prototipi', 'EUR', 'included', '2 hafta');

insert into public.proposal_sections (proposal_id, section_key, title, content, sort_order)
values
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'scope', 'Kapsam', 'Üç kurgusal ekranın görsel tasarımı.', 0),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'deliverables', 'Teslimler', 'Çalışan prototip ve kaynak kod.', 0);

insert into public.proposal_items (proposal_id, description, quantity, unit_label, unit_price, sort_order)
values
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Arayüz tasarımı', 3, 'ekran', 1250.00, 0),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Prototip geliştirme', 1, 'proje', 850.00, 0);
