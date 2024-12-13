-- Create the database and use it
DROP DATABASE IF EXISTS bettys_movies;
CREATE DATABASE IF NOT EXISTS bettys_movies;
USE bettys_movies;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS movies;
DROP TABLE IF EXISTS recommendations;
DROP TABLE IF EXISTS user_favorites;

-- Create 'movies' table
CREATE TABLE IF NOT EXISTS movies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    rating DECIMAL(4, 2) NOT NULL CHECK (rating >= 0 AND rating <= 10.1),
    release_date DATE,
    genres TEXT,
    tags TEXT,
    keywords TEXT
);

-- Create 'users' table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL CHECK (LENGTH(hashed_password) >= 8)
);

-- Create 'reviews' table
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    movie_id INT NOT NULL,
    user_id INT NOT NULL,
    rating DECIMAL(4, 2) NOT NULL CHECK (rating >= 0 AND rating <= 10.1),
    review_text TEXT,
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create 'user_favorites' table
CREATE TABLE IF NOT EXISTS user_favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    movie_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
);

-- Create 'recommendations' table
CREATE TABLE IF NOT EXISTS recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    movie_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    genres TEXT,
    release_date DATE,
    tags TEXT,
    keywords TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- Create a user for the application and grant necessary permissions
CREATE USER IF NOT EXISTS 'appuser'@'localhost' IDENTIFIED BY 'qwertyuiop';
GRANT ALL PRIVILEGES ON bettys_movies.* TO 'appuser'@'localhost';

-- Insert example data for testing

-- Insert movies
INSERT INTO movies (title, description, rating, release_date, genres, tags, keywords) VALUES
('Free Guy', 'A bank teller discovers he is a background character in an open world video game.', 7.6, '2021-08-13', 'Comedy', 'Comedy', 'Bank Teller, Comedy, Video Game'),
('Black Widow', 'Natasha Romanoff confronts the darker parts of her ledger.', 10.0, '2021-07-09', 'Action', 'Marvel, Superhero', 'Natasha Romanoff, Marvel, Superhero'),
('Shang-Chi and the Legend of the Ten Rings', 'Shang-Chi must confront the past he thought he left behind.', 7.9, '2021-09-03', 'Action, Adventure', 'Marvel, Superhero, Adventure', 'Shang-Chi, Marvel, Superhero, Adventure'),
('Eternals', 'The Eternals, an immortal alien race, emerge from hiding.', 9.8, '2021-11-05', 'Fantasy', 'Marvel, Superhero, Fantasy', 'Eternals, Marvel, Superhero, Fantasy'),
('Jungle Cruise', 'A riverboat captain and a scientist embark on a jungle adventure.', 6.6, '2021-07-30', 'Adventure', 'Adventure', 'Jungle, Adventure, Riverboat');

-- Insert users
INSERT INTO users (username, first_name, last_name, email, hashed_password) VALUES
('eve_adams', 'Eve', 'Adams', 'eve@example.com', 'hashedpassword5'),
('frank_harris', 'Frank', 'Harris', 'frank@example.com', 'hashedpassword6'),
('grace_lee', 'Grace', 'Lee', 'grace@example.com', 'hashedpassword7'),
('henry_thompson', 'Henry', 'Thompson', 'henry@example.com', 'hashedpassword8');

-- Insert reviews
INSERT INTO reviews (movie_id, user_id, rating, review_text) VALUES
(1, 1, 7.5, 'An exciting addition to the Marvel universe.'),
(2, 2, 8.3, 'A fresh and entertaining take on a superhero origin story.'),
(3, 3, 6.7, 'Visually stunning, but the story falls a bit flat.'),
(4, 4, 6.5, 'A fun adventure that is great for the whole family.'),
(5, 1, 7.4, 'A hilarious and heartfelt film with a unique premise.'),
(3, 4, 7.0, 'A decent film with some great moments but inconsistent storytelling.');

-- Example user favorites
INSERT INTO user_favorites (user_id, movie_id) VALUES
(1, 1), -- Eve favorites Black Widow
(1, 2), -- Eve favorites Shang-Chi
(2, 3), -- Frank favorites Eternals
(3, 4), -- Grace favorites Jungle Cruise
(4, 5); -- Henry favorites Free Guy

-- Example movie recommendations (you can adjust the movie recommendations as needed)
INSERT INTO recommendations (user_id, recommended_movies) VALUES
(1, '1, 2, 5'),  -- Eve's recommendations
(2, '3, 4, 1'),  -- Frank's recommendations
(3, '4, 5, 2'),  -- Grace's recommendations
(4, '1, 3, 4');  -- Henry's recommendations

-- Verify all tables and constraints are in place
SHOW TABLES;
SELECT * FROM recommendations;
SELECT * FROM users;

DESCRIBE movies;
SELECT * FROM movies;
DESCRIBE recommendations;
SELECT * FROM movies;

SELECT id FROM users;

DELETE FROM movies WHERE id = 10;

SELECT * FROM movies ORDER BY release_date DESC;

SELECT m.* FROM movies m ORDER BY m.release_date DESC;


