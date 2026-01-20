-- Seed data for prospects table
-- This creates 15 realistic prospects with varying health statuses to showcase the AI briefing features

-- Clear existing test data (optional - comment out if you want to keep existing data)
-- DELETE FROM prospects WHERE company LIKE 'Test%' OR company IN ('SportVision Media', 'Arena Analytics', 'FitTrack Pro', 'MediaHub Solutions', 'GameDay Publishing', 'ClubConnect', 'SportsNews Network', 'TeamSync Platform', 'FanEngage Tech', 'MatchDay Media', 'Athletic Insights', 'Championship Broadcasting', 'League Manager Pro', 'Victory Digital', 'PlayBook Analytics');

-- Active prospects (0-7 days since contact)
INSERT INTO prospects (company, contact_person, email, telephone, website, product_type, prospect_type, country, status, owner, deal_value, next_action, last_contact_date, days_since_contact)
VALUES
  ('SportVision Media', 'Ana Petrović', 'ana.petrovic@sportvision.rs', '+381 11 123 4567', 'https://sportvision.rs', 'Mobile app', 'Media', 'Serbia', 'Hot', 'Aleksandar', 45000, 'Demo scheduled for next week', CURRENT_DATE - INTERVAL '3 days', 3),
  ('Arena Analytics', 'Marko Jovanović', 'marko@arena-analytics.com', '+385 1 456 7890', 'https://arena-analytics.hr', 'Website/CMS', 'Media', 'Croatia', 'Hot', 'Aleksandar', 35000, 'Follow up on proposal', CURRENT_DATE - INTERVAL '5 days', 5),
  ('FitTrack Pro', 'Elena Kovač', 'elena@fittrack.hr', '+385 21 234 5678', 'https://fittrack.hr', 'Mobile app', 'Sports Club', 'Croatia', 'Warm', 'Aleksandar', 25000, 'Waiting for budget approval', CURRENT_DATE - INTERVAL '7 days', 7);

-- Cooling prospects (8-14 days since contact)
INSERT INTO prospects (company, contact_person, email, telephone, website, product_type, prospect_type, country, status, owner, deal_value, next_action, last_contact_date, days_since_contact)
VALUES
  ('MediaHub Solutions', 'Nikola Stojanović', 'nikola@mediahub.rs', '+381 21 345 6789', 'https://mediahub.rs', 'CMS', 'Media', 'Serbia', 'Warm', 'Aleksandar', 55000, 'Schedule follow-up call', CURRENT_DATE - INTERVAL '9 days', 9),
  ('GameDay Publishing', 'Sara Horvat', 'sara@gameday.hr', '+385 1 567 8901', 'https://gameday.hr', 'Website/CMS', 'Media', 'Croatia', 'Warm', 'Aleksandar', 40000, 'Re-send proposal with pricing options', CURRENT_DATE - INTERVAL '11 days', 11),
  ('ClubConnect', 'Ivan Popović', 'ivan@clubconnect.rs', '+381 11 678 9012', 'https://clubconnect.rs', 'Mobile app', 'Sports Club', 'Serbia', 'Hot', 'Aleksandar', 30000, 'Check if they reviewed demo', CURRENT_DATE - INTERVAL '13 days', 13);

-- Cold prospects (15-60 days since contact)
INSERT INTO prospects (company, contact_person, email, telephone, website, product_type, prospect_type, country, status, owner, deal_value, next_action, last_contact_date, days_since_contact)
VALUES
  ('SportsNews Network', 'Maja Nikolić', 'maja@sportsnews.rs', '+381 11 789 0123', 'https://sportsnews.rs', 'LitteraWorks', 'Media', 'Serbia', 'Cold', 'Aleksandar', 65000, 'Re-introduction email needed', CURRENT_DATE - INTERVAL '21 days', 21),
  ('TeamSync Platform', 'Petra Babić', 'petra@teamsync.hr', '+385 1 890 1234', 'https://teamsync.hr', 'Mobile app', 'Sports League', 'Croatia', 'Warm', 'Aleksandar', 75000, 'Send case studies', CURRENT_DATE - INTERVAL '28 days', 28),
  ('FanEngage Tech', 'Luka Đorđević', 'luka@fanengage.rs', '+381 21 901 2345', 'https://fanengage.rs', 'Website/CMS', 'Sports Club', 'Serbia', 'Cold', 'Aleksandar', 20000, 'Try different contact person', CURRENT_DATE - INTERVAL '35 days', 35),
  ('MatchDay Media', 'Ana Marić', 'ana@matchday.hr', '+385 21 012 3456', 'https://matchday.hr', 'Mobile app', 'Media', 'Croatia', 'Warm', 'Aleksandar', 50000, 'Follow up on technical questions', CURRENT_DATE - INTERVAL '42 days', 42);

-- Frozen prospects (60+ days since contact)
INSERT INTO prospects (company, contact_person, email, telephone, website, product_type, prospect_type, country, status, owner, deal_value, next_action, last_contact_date, days_since_contact)
VALUES
  ('Athletic Insights', 'Milan Stanković', 'milan@athletic-insights.rs', '+381 11 234 5678', 'https://athletic-insights.rs', 'Other', 'Sports League', 'Serbia', 'Lost', 'Aleksandar', 85000, 'Archive or new angle needed', CURRENT_DATE - INTERVAL '65 days', 65),
  ('Championship Broadcasting', 'Ivana Pavlović', 'ivana@championship.hr', '+385 1 345 6789', 'https://championship.hr', 'CMS', 'Media', 'Croatia', 'Cold', 'Aleksandar', 95000, 'Major re-engagement effort', CURRENT_DATE - INTERVAL '72 days', 72),
  ('League Manager Pro', 'Stefan Ilić', 'stefan@leaguemanager.rs', '+381 21 456 7890', 'https://leaguemanager.rs', 'Website/CMS', 'Sports League', 'Serbia', 'Lost', 'Aleksandar', 60000, 'Consider archiving', CURRENT_DATE - INTERVAL '90 days', 90);

-- Some prospects with no next action (to test edge cases)
INSERT INTO prospects (company, contact_person, email, telephone, website, product_type, prospect_type, country, status, owner, deal_value, last_contact_date, days_since_contact)
VALUES
  ('Victory Digital', 'Marija Simić', 'marija@victory.hr', '+385 21 567 8901', 'https://victory.hr', 'Mobile app', 'Media', 'Croatia', 'Warm', 'Aleksandar', 32000, CURRENT_DATE - INTERVAL '18 days', 18),
  ('PlayBook Analytics', 'Dejan Kostić', 'dejan@playbook.rs', '+381 11 678 9012', 'https://playbook.rs', 'LitteraWorks', 'Sports Club', 'Serbia', 'Hot', 'Aleksandar', 48000, CURRENT_DATE - INTERVAL '4 days', 4);

-- Update the statistics
-- The trigger should automatically update days_since_contact, but we're setting it explicitly for testing
-- In production, only last_contact_date would be set and the trigger would calculate days_since_contact
