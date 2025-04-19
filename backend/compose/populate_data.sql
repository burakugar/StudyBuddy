-- Clear existing data (if needed)
TRUNCATE TABLE users, courses, interests, user_interests, user_courses, matches, chats, messages CASCADE;

-- Reset sequences
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE courses_id_seq RESTART WITH 1;
ALTER SEQUENCE interests_id_seq RESTART WITH 1;
ALTER SEQUENCE chats_id_seq RESTART WITH 1;
ALTER SEQUENCE messages_id_seq RESTART WITH 1;

-- Insert Users with bcrypt hash of "admin" for all users
INSERT INTO users (email, full_name, password_hash, university, major, academic_year, study_style, preferred_environment, bio, profile_picture_url, created_at, updated_at)
VALUES
    ('john.doe@university.edu', 'John Doe', '$2y$10$pHEpRoUjaxUxfWrU2D/EIeGRJNUdAYe6ONLwAlewTO433bx.Bn/bS', 'State University', 'Computer Science', 'SOPHOMORE', 'VISUAL', 'LIBRARY', 'CS major looking for study partners for algorithm courses', 'https://randomuser.me/api/portraits/men/1.jpg', NOW(), NOW()),
    ('jane.smith@university.edu', 'Jane Smith', '$2y$10$pHEpRoUjaxUxfWrU2D/EIeGRJNUdAYe6ONLwAlewTO433bx.Bn/bS', 'State University', 'Biology', 'JUNIOR', 'AUDITORY', 'CAFE', 'Pre-med student interested in group study sessions', 'https://randomuser.me/api/portraits/women/2.jpg', NOW(), NOW()),
    ('alex.johnson@university.edu', 'Alex Johnson', '$2y$10$pHEpRoUjaxUxfWrU2D/EIeGRJNUdAYe6ONLwAlewTO433bx.Bn/bS', 'State University', 'Mathematics', 'SENIOR', 'KINESTHETIC', 'OUTDOORS', 'Math tutor available for calculus help', 'https://randomuser.me/api/portraits/men/3.jpg', NOW(), NOW()),
    ('emily.wilson@university.edu', 'Emily Wilson', '$2y$10$pHEpRoUjaxUxfWrU2D/EIeGRJNUdAYe6ONLwAlewTO433bx.Bn/bS', 'State University', 'Psychology', 'FRESHMAN', 'READING_WRITING', 'DORM', 'First-year psych student looking to form study groups', 'https://randomuser.me/api/portraits/women/4.jpg', NOW(), NOW()),
    ('michael.brown@university.edu', 'Michael Brown', '$2y$10$pHEpRoUjaxUxfWrU2D/EIeGRJNUdAYe6ONLwAlewTO433bx.Bn/bS', 'State University', 'Engineering', 'GRADUATE', 'VISUAL', 'LIBRARY', 'Grad student in mechanical engineering', 'https://randomuser.me/api/portraits/men/5.jpg', NOW(), NOW());
-- passwords adminadmin
-- Insert Courses
INSERT INTO courses (course_code, name)
VALUES
    ('CS101', 'Introduction to Computer Science'),
    ('BIO201', 'Molecular Biology'),
    ('MATH301', 'Advanced Calculus'),
    ('PSYCH101', 'Introduction to Psychology'),
    ('ENG220', 'Technical Writing'),
    ('PHYS205', 'Quantum Mechanics'),
    ('CHEM101', 'General Chemistry'),
    ('ECON200', 'Microeconomics');

-- Insert Interests
INSERT INTO interests (name)
VALUES
    ('Programming'),
    ('Machine Learning'),
    ('Biology Research'),
    ('Mathematics'),
    ('Psychology'),
    ('Writing'),
    ('Physics'),
    ('Chemistry'),
    ('Economics'),
    ('Music'),
    ('Sports'),
    ('Art'),
    ('Photography'),
    ('Gaming'),
    ('Hiking');

-- Insert User Interests
INSERT INTO user_interests (user_id, interest_id)
VALUES
    (1, 1), -- John - Programming
    (1, 2), -- John - Machine Learning
    (1, 14), -- John - Gaming
    (2, 3), -- Jane - Biology Research
    (2, 8), -- Jane - Chemistry
    (2, 10), -- Jane - Music
    (3, 4), -- Alex - Mathematics
    (3, 7), -- Alex - Physics
    (3, 11), -- Alex - Sports
    (4, 5), -- Emily - Psychology
    (4, 6), -- Emily - Writing
    (4, 12), -- Emily - Art
    (5, 1), -- Michael - Programming
    (5, 7), -- Michael - Physics
    (5, 15); -- Michael - Hiking

-- Insert User Courses
INSERT INTO user_courses (user_id, course_id)
VALUES
    (1, 1), -- John - CS101
    (1, 3), -- John - MATH301
    (2, 2), -- Jane - BIO201
    (2, 7), -- Jane - CHEM101
    (3, 3), -- Alex - MATH301
    (3, 6), -- Alex - PHYS205
    (4, 4), -- Emily - PSYCH101
    (4, 5), -- Emily - ENG220
    (5, 1), -- Michael - CS101
    (5, 6); -- Michael - PHYS205

-- Insert Matches (with different statuses)
INSERT INTO matches (user_one_id, user_two_id, status, user_one_status, user_two_status, created_at, updated_at)
VALUES
    (1, 3, 'MATCHED', 'ACCEPTED', 'ACCEPTED', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'),
    (1, 5, 'MATCHED', 'ACCEPTED', 'ACCEPTED', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
    (2, 4, 'PENDING', 'ACCEPTED', 'PENDING', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
    (3, 5, 'REJECTED', 'REJECTED', 'ACCEPTED', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days'),
    (2, 5, 'MATCHED', 'ACCEPTED', 'ACCEPTED', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- Insert Chats for matched users
INSERT INTO chats (id, match_user_one_id, match_user_two_id, created_at)
VALUES
    (1, 1, 3, NOW() - INTERVAL '4 days'),
    (2, 1, 5, NOW() - INTERVAL '3 days'),
    (3, 2, 5, NOW() - INTERVAL '1 day');

INSERT INTO messages (chat_id, sender_id, content, timestamp)
VALUES
-- Chat between John and Alex
(1, 1, 'Hey Alex, would you like to study for the calculus exam together?', NOW() - INTERVAL '4 days'),
(1, 3, 'Sure, John! When were you thinking?', NOW() - INTERVAL '4 days'),
(1, 1, 'How about tomorrow at the library around 3pm?', NOW() - INTERVAL '4 days'),
(1, 3, 'That works for me. See you then!', NOW() - INTERVAL '4 days'),
(1, 1, 'Great! I will bring my notes from last lecture.', NOW() - INTERVAL '3 days'),

-- Chat between John and Michael
(2, 1, 'Hi Michael, I saw we are both in CS101. Want to work on the programming assignment?', NOW() - INTERVAL '3 days'),
(2, 5, 'Hey John, definitely! I am stuck on problem 3.', NOW() - INTERVAL '3 days'),
(2, 1, 'I figured that one out. Let us meet at the computer lab tomorrow?', NOW() - INTERVAL '2 days'),
(2, 5, 'Perfect. 2pm work for you?', NOW() - INTERVAL '2 days'),
(2, 1, 'Yes, see you then!', NOW() - INTERVAL '2 days'),

-- Chat between Jane and Michael
(3, 2, 'Hello Michael, I noticed you are interested in chemistry. I could use some help with my chem homework.', NOW() - INTERVAL '1 day'),
(3, 5, 'Hi Jane! I took that course last year. Happy to help!', NOW() - INTERVAL '1 day'),
(3, 2, 'That would be great! When are you free this week?', NOW() - INTERVAL '1 day'),
(3, 5, 'How about Wednesday afternoon?', NOW() - INTERVAL '12 hours'),
(3, 2, 'Wednesday works for me. Let us meet at the science building.', NOW() - INTERVAL '6 hours');
