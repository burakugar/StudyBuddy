-- Clear existing data (ORDER MATTERS due to Foreign Keys)
TRUNCATE TABLE messages CASCADE;
TRUNCATE TABLE chats CASCADE;
TRUNCATE TABLE matches CASCADE;
TRUNCATE TABLE user_courses CASCADE;
TRUNCATE TABLE user_interests CASCADE;
TRUNCATE TABLE courses CASCADE;
TRUNCATE TABLE interests CASCADE;
TRUNCATE TABLE users CASCADE;


ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE courses_id_seq RESTART WITH 1;
ALTER SEQUENCE interests_id_seq RESTART WITH 1;
ALTER SEQUENCE chats_id_seq RESTART WITH 1;
ALTER SEQUENCE messages_id_seq RESTART WITH 1;

-- Insert Users (Password for all is "adminadmin")
INSERT INTO users (email, full_name, password_hash, academic_year, major, university, study_style, preferred_environment, bio, profile_picture_url, latitude, longitude, created_at, updated_at)
VALUES
    ('john.doe@university.edu', 'John Doe', '$2y$10$pHEpRoUjaxUxfWrU2D/EIeGRJNUdAYe6ONLwAlewTO433bx.Bn/bS', 'SOPHOMORE', 'Computer Science', 'State University', 'VISUAL', 'LIBRARY', 'CS major focused on algorithms.', 'https://randomuser.me/api/portraits/men/1.jpg', 50.0880, 14.4208, NOW(), NOW()), -- Prague Center
    ('jane.smith@university.edu', 'Jane Smith', '$2y$10$pHEpRoUjaxUxfWrU2D/EIeGRJNUdAYe6ONLwAlewTO433bx.Bn/bS', 'JUNIOR', 'Biology', 'State University', 'AUDITORY', 'CAFE', 'Pre-med student, likes discussing concepts.', 'https://randomuser.me/api/portraits/women/2.jpg', 50.0755, 14.4378, NOW(), NOW()), -- Near Wenceslas Square
    ('alex.johnson@university.edu', 'Alex Johnson', '$2y$10$pHEpRoUjaxUxfWrU2D/EIeGRJNUdAYe6ONLwAlewTO433bx.Bn/bS', 'SENIOR', 'Mathematics', 'City College', 'KINESTHETIC', 'OUTDOORS', 'Math tutor, enjoys whiteboard problems.', 'https://randomuser.me/api/portraits/men/3.jpg', 50.0910, 14.4050, NOW(), NOW()), -- Near Castle
    ('emily.wilson@university.edu', 'Emily Wilson', '$2y$10$pHEpRoUjaxUxfWrU2D/EIeGRJNUdAYe6ONLwAlewTO433bx.Bn/bS', 'FRESHMAN', 'Psychology', 'State University', 'READING_WRITING', 'LIBRARY', 'First-year psych student, prefers notes.', 'https://randomuser.me/api/portraits/women/4.jpg', 50.1075, 14.4214, NOW(), NOW()), -- Letna area
    ('michael.brown@university.edu', 'Michael Brown', '$2y$10$pHEpRoUjaxUxfWrU2D/EIeGRJNUdAYe6ONLwAlewTO433bx.Bn/bS', 'GRADUATE', 'Engineering', 'Tech Institute', 'VISUAL', 'LAB', 'Grad student focused on simulations.', 'https://randomuser.me/api/portraits/men/5.jpg', 50.0800, 14.4500, NOW(), NOW()), -- Zizkov area
    ('sarah.lee@university.edu', 'Sarah Lee', '$2y$10$pHEpRoUjaxUxfWrU2D/EIeGRJNUdAYe6ONLwAlewTO433bx.Bn/bS', 'JUNIOR', 'Computer Science', 'State University', 'COLLABORATIVE', 'COMMON_ROOM', 'Enjoys pair programming.', 'https://randomuser.me/api/portraits/women/6.jpg', 50.0850, 14.4150, NOW(), NOW()); -- Mala Strana area


-- Insert Courses (Assuming IDs 1-10)
INSERT INTO courses (course_code, name) VALUES
                                            ('CS101', 'Introduction to Programming'), ('CS305', 'Algorithms'),
                                            ('BIO201', 'Molecular Biology'), ('MATH301', 'Advanced Calculus'),
                                            ('PSYCH101', 'Introduction to Psychology'), ('ENG220', 'Technical Writing'),
                                            ('PHYS205', 'Quantum Mechanics'), ('CHEM101', 'General Chemistry'),
                                            ('ECON200', 'Microeconomics'), ('CS210', 'Data Structures');

-- Insert Interests (Assuming IDs 1-18)
INSERT INTO interests (name) VALUES
                                 ('Programming'), ('Machine Learning'), ('Biology Research'), ('Mathematics'),
                                 ('Psychology'), ('Writing'), ('Physics'), ('Chemistry'), ('Economics'),
                                 ('Music'), ('Sports'), ('Art'), ('Photography'), ('Gaming'), ('Hiking'),
                                 ('Web Development'), ('Artificial Intelligence'), ('Neuroscience');

-- Insert User Courses
INSERT INTO user_courses (user_id, course_id) VALUES
                                                  (1, 1), (1, 2), (1, 4), (2, 3), (2, 8), (3, 4), (3, 7),
                                                  (4, 5), (4, 6), (5, 7), (6, 1), (6, 10);

-- Insert User Interests
INSERT INTO user_interests (user_id, interest_id) VALUES
                                                      (1, 1), (1, 2), (1, 14), (2, 3), (2, 8), (2, 10), (3, 4), (3, 7), (3, 11),
                                                      (4, 5), (4, 6), (4, 12), (5, 7), (5, 15), (6, 1), (6, 16), (6, 17);

-- Insert Matches
INSERT INTO matches (user_one_id, user_two_id, user_one_status, user_two_status, status, created_at, updated_at) VALUES
                                                                                                                     (1, 3, 'ACCEPTED', 'ACCEPTED', 'MATCHED', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'), -- John & Alex (Matched)
                                                                                                                     (1, 5, 'ACCEPTED', 'ACCEPTED', 'MATCHED', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'), -- John & Michael (Matched)
                                                                                                                     (2, 4, 'ACCEPTED', 'PENDING', 'PENDING', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'), -- Jane & Emily (Pending)
                                                                                                                     (3, 5, 'REJECTED', 'PENDING', 'REJECTED', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days'), -- Alex & Michael (Rejected by Alex)
                                                                                                                     (2, 6, 'ACCEPTED', 'ACCEPTED', 'MATCHED', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'); -- Jane & Sarah (Matched)

INSERT INTO chats (match_user_one_id, match_user_two_id, created_at)
SELECT user_one_id, user_two_id, updated_at
FROM matches
WHERE status = 'MATCHED';

INSERT INTO messages (chat_id, sender_id, content, timestamp) VALUES
                                                                  (1, 1, 'Hey Alex, study session for MATH301 this week?', NOW() - INTERVAL '4 days'),
                                                                  (1, 3, 'Yeah definitely, I need help with series convergence. Library thursday?', NOW() - INTERVAL '4 days' + INTERVAL '5 minutes'),
                                                                  (1, 1, 'Sounds good, 2 PM?', NOW() - INTERVAL '4 days' + INTERVAL '10 minutes'),
                                                                  (1, 3, 'Perfect.', NOW() - INTERVAL '4 days' + INTERVAL '11 minutes'),
                                                                  (2, 1, 'Michael, saw you liked gaming too. What do you play?', NOW() - INTERVAL '3 days'),
                                                                  (2, 5, 'Hey John! Mostly strategy games, sometimes FPS. You?', NOW() - INTERVAL '3 days' + INTERVAL '2 minutes'),
                                                                  (2, 1, 'Cool, mostly RPGs here. We should game sometime.', NOW() - INTERVAL '3 days' + INTERVAL '5 minutes'),
                                                                  (3, 2, 'Hi Sarah, saw we matched! Need a partner for the CS101 project?', NOW() - INTERVAL '1 day'),
                                                                  (3, 6, 'Hi Jane! Yes, that would be great! I was just about to look for someone.', NOW() - INTERVAL '1 day' + INTERVAL '1 minute'),
                                                                  (3, 2, 'Awesome! Want to meet tomorrow after class to discuss?', NOW() - INTERVAL '1 day' + INTERVAL '3 minutes'),
                                                                  (3, 6, 'Sure, sounds like a plan!', NOW() - INTERVAL '1 day' + INTERVAL '4 minutes');
