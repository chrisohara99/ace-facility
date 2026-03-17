-- ============================================================
-- ACE FACILITY — SYNTHETIC TEST DATA
-- Run this in Supabase SQL Editor after schema.sql
-- ============================================================

-- Members (20 test members)
INSERT INTO members (full_name, email, plan, sessions_per_month, joined_at) VALUES
('Sarah Chen', 'sarah.chen@email.com', 'Gold', 12, '2024-06-15'),
('Marcus Johnson', 'marcus.j@email.com', 'Gold', 10, '2024-03-22'),
('Emily Rodriguez', 'emily.r@email.com', 'Silver', 8, '2024-08-10'),
('David Kim', 'david.kim@email.com', 'Gold', 15, '2023-11-05'),
('Jessica Taylor', 'jess.taylor@email.com', 'Silver', 6, '2024-09-18'),
('Michael Brown', 'm.brown@email.com', 'Bronze', 4, '2025-01-12'),
('Ashley Williams', 'ashley.w@email.com', 'Gold', 12, '2024-02-28'),
('Christopher Lee', 'chris.lee@email.com', 'Silver', 8, '2024-07-04'),
('Amanda Martinez', 'amanda.m@email.com', 'Bronze', 4, '2025-02-20'),
('Ryan Thompson', 'ryan.t@email.com', 'Gold', 10, '2024-04-15'),
('Nicole Garcia', 'nicole.g@email.com', 'Silver', 6, '2024-10-30'),
('Justin Davis', 'justin.d@email.com', 'Bronze', 4, '2025-03-01'),
('Stephanie Wilson', 'steph.w@email.com', 'Gold', 14, '2023-09-12'),
('Brandon Moore', 'brandon.m@email.com', 'Silver', 8, '2024-05-25'),
('Melissa Anderson', 'melissa.a@email.com', 'Bronze', 4, '2025-01-30'),
('Kevin Jackson', 'kevin.j@email.com', 'Gold', 12, '2024-01-18'),
('Rachel White', 'rachel.w@email.com', 'Silver', 6, '2024-11-08'),
('Daniel Harris', 'daniel.h@email.com', 'Bronze', 4, '2025-02-14'),
('Lauren Clark', 'lauren.c@email.com', 'Gold', 10, '2024-06-30'),
('Andrew Lewis', 'andrew.l@email.com', 'Silver', 8, '2024-08-22')
ON CONFLICT (email) DO NOTHING;

-- Bookings for today and upcoming days
INSERT INTO bookings (court_id, member_id, starts_at, duration_minutes, type, status, created_at)
SELECT 
  c.id,
  m.id,
  b.starts_at,
  60,
  b.type,
  b.status,
  b.starts_at - interval '2 days'
FROM (
  VALUES
    -- Today's bookings
    (CURRENT_DATE + TIME '08:00', 'Singles', 'confirmed', 1, 'Sarah Chen'),
    (CURRENT_DATE + TIME '09:00', 'Doubles', 'confirmed', 2, 'Marcus Johnson'),
    (CURRENT_DATE + TIME '10:00', 'Lesson', 'confirmed', 3, 'Emily Rodriguez'),
    (CURRENT_DATE + TIME '11:00', 'Singles', 'pending', 4, 'David Kim'),
    (CURRENT_DATE + TIME '14:00', 'Club session', 'confirmed', 1, 'Jessica Taylor'),
    (CURRENT_DATE + TIME '15:00', 'Doubles', 'confirmed', 2, 'Michael Brown'),
    (CURRENT_DATE + TIME '16:00', 'Singles', 'pending', 3, 'Ashley Williams'),
    (CURRENT_DATE + TIME '17:00', 'Lesson', 'confirmed', 4, 'Christopher Lee'),
    (CURRENT_DATE + TIME '18:00', 'Doubles', 'confirmed', 6, 'Amanda Martinez'),
    (CURRENT_DATE + TIME '19:00', 'Singles', 'confirmed', 1, 'Ryan Thompson'),
    -- Tomorrow
    (CURRENT_DATE + interval '1 day' + TIME '09:00', 'Singles', 'confirmed', 1, 'Nicole Garcia'),
    (CURRENT_DATE + interval '1 day' + TIME '10:00', 'Doubles', 'pending', 2, 'Justin Davis'),
    (CURRENT_DATE + interval '1 day' + TIME '11:00', 'Lesson', 'confirmed', 3, 'Stephanie Wilson'),
    (CURRENT_DATE + interval '1 day' + TIME '14:00', 'Singles', 'confirmed', 4, 'Brandon Moore'),
    (CURRENT_DATE + interval '1 day' + TIME '16:00', 'Club session', 'confirmed', 6, 'Melissa Anderson'),
    -- Day after tomorrow
    (CURRENT_DATE + interval '2 days' + TIME '08:00', 'Doubles', 'pending', 1, 'Kevin Jackson'),
    (CURRENT_DATE + interval '2 days' + TIME '10:00', 'Singles', 'confirmed', 2, 'Rachel White'),
    (CURRENT_DATE + interval '2 days' + TIME '15:00', 'Lesson', 'confirmed', 3, 'Daniel Harris'),
    (CURRENT_DATE + interval '2 days' + TIME '17:00', 'Doubles', 'confirmed', 4, 'Lauren Clark'),
    (CURRENT_DATE + interval '2 days' + TIME '19:00', 'Singles', 'pending', 6, 'Andrew Lewis')
) AS b(starts_at, type, status, court_num, member_name)
JOIN courts c ON c.id = b.court_num
JOIN members m ON m.full_name = b.member_name;

-- Invoices (mix of paid, outstanding, overdue)
INSERT INTO invoices (member_id, description, amount_cents, status, due_at, created_at)
SELECT 
  m.id,
  i.description,
  i.amount_cents,
  i.status,
  i.due_at,
  i.created_at
FROM (
  VALUES
    -- Paid invoices (last 30 days)
    ('Sarah Chen', 'Monthly membership · March 2026', 15000, 'paid', CURRENT_DATE - interval '5 days', CURRENT_DATE - interval '35 days'),
    ('Marcus Johnson', 'Monthly membership · March 2026', 15000, 'paid', CURRENT_DATE - interval '3 days', CURRENT_DATE - interval '33 days'),
    ('David Kim', 'Monthly membership · March 2026', 15000, 'paid', CURRENT_DATE - interval '10 days', CURRENT_DATE - interval '40 days'),
    ('Ashley Williams', 'Monthly membership · March 2026', 15000, 'paid', CURRENT_DATE - interval '7 days', CURRENT_DATE - interval '37 days'),
    ('Ryan Thompson', 'Monthly membership · March 2026', 15000, 'paid', CURRENT_DATE - interval '2 days', CURRENT_DATE - interval '32 days'),
    ('Stephanie Wilson', 'Monthly membership · March 2026', 15000, 'paid', CURRENT_DATE - interval '12 days', CURRENT_DATE - interval '42 days'),
    ('Kevin Jackson', 'Monthly membership · March 2026', 15000, 'paid', CURRENT_DATE - interval '8 days', CURRENT_DATE - interval '38 days'),
    ('Lauren Clark', 'Monthly membership · March 2026', 15000, 'paid', CURRENT_DATE - interval '4 days', CURRENT_DATE - interval '34 days'),
    ('Emily Rodriguez', 'Monthly membership · March 2026', 9500, 'paid', CURRENT_DATE - interval '6 days', CURRENT_DATE - interval '36 days'),
    ('Christopher Lee', 'Monthly membership · March 2026', 9500, 'paid', CURRENT_DATE - interval '9 days', CURRENT_DATE - interval '39 days'),
    -- Outstanding invoices
    ('Jessica Taylor', 'Monthly membership · March 2026', 9500, 'outstanding', CURRENT_DATE + interval '5 days', CURRENT_DATE - interval '25 days'),
    ('Nicole Garcia', 'Monthly membership · March 2026', 9500, 'outstanding', CURRENT_DATE + interval '7 days', CURRENT_DATE - interval '23 days'),
    ('Brandon Moore', 'Monthly membership · March 2026', 9500, 'outstanding', CURRENT_DATE + interval '10 days', CURRENT_DATE - interval '20 days'),
    ('Rachel White', 'Monthly membership · March 2026', 9500, 'outstanding', CURRENT_DATE + interval '3 days', CURRENT_DATE - interval '27 days'),
    -- Overdue invoices
    ('Michael Brown', 'Monthly membership · February 2026', 5500, 'overdue', CURRENT_DATE - interval '15 days', CURRENT_DATE - interval '45 days'),
    ('Amanda Martinez', 'Monthly membership · February 2026', 5500, 'overdue', CURRENT_DATE - interval '20 days', CURRENT_DATE - interval '50 days'),
    ('Justin Davis', 'Monthly membership · February 2026', 5500, 'overdue', CURRENT_DATE - interval '18 days', CURRENT_DATE - interval '48 days'),
    ('Melissa Anderson', 'Monthly membership · March 2026', 5500, 'overdue', CURRENT_DATE - interval '5 days', CURRENT_DATE - interval '35 days'),
    ('Daniel Harris', 'Monthly membership · March 2026', 5500, 'overdue', CURRENT_DATE - interval '8 days', CURRENT_DATE - interval '38 days'),
    ('Andrew Lewis', 'Monthly membership · March 2026', 9500, 'outstanding', CURRENT_DATE + interval '12 days', CURRENT_DATE - interval '18 days'),
    -- Private lessons
    ('Sarah Chen', 'Private lesson package (4 sessions)', 32000, 'paid', CURRENT_DATE - interval '20 days', CURRENT_DATE - interval '50 days'),
    ('David Kim', 'Private lesson package (4 sessions)', 32000, 'paid', CURRENT_DATE - interval '15 days', CURRENT_DATE - interval '45 days'),
    ('Stephanie Wilson', 'Court rental · Tournament prep', 12000, 'paid', CURRENT_DATE - interval '3 days', CURRENT_DATE - interval '10 days'),
    ('Marcus Johnson', 'Guest fees · March 2026', 4500, 'outstanding', CURRENT_DATE + interval '14 days', CURRENT_DATE - interval '5 days')
) AS i(member_name, description, amount_cents, status, due_at, created_at)
JOIN members m ON m.full_name = i.member_name;

-- Update some courts to different statuses for visual variety
UPDATE courts SET status = 'booked' WHERE id IN (1, 3, 6);
UPDATE courts SET status = 'available' WHERE id IN (2, 4);
UPDATE courts SET status = 'maintenance' WHERE id = 5;
