const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const axios = require('axios');

// Middleware to check if the user is logged in
const redirectLogin = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/usr/416/ users/login');
    } else {
        next();
    }
};



// random genres if people dont input any when addig movies
const availableGenres = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller',
    'Western', 'Musical', 'War', 'Historical', 'Biography', 'Crime', 'Family', 'Animation', 'Documentary', 'Sports'
];
const availableTags = [
    'Epic', 'Heroic', 'Magical', 'Survival', 'Romantic', 'Space', 'Suspenseful', 'Gritty', 'Lighthearted', 'Dark',
    'Intense', 'Emotional', 'Exciting', 'Mysterious', 'Heartwarming', 'Adventurous', 'Thrilling', 'Captivating', 'Dramatic'
];
const availableKeywords = [
    'Adventure', 'Hero', 'Fight', 'Love', 'Space', 'Magic', 'Mystery', 'Horror', 'Thrill', 'Epic',
    'Journey', 'Quest', 'Battle', 'Heroine', 'Fantasy', 'War', 'Challenge', 'Exploration', 'Escape', 'Discovery'
];

function getRandomUniqueItems(arr, num, existingItems = []) {
    const filteredArr = arr.filter(item => !existingItems.includes(item));
    const shuffled = filteredArr.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, num).join(', ');
}

// Route for rendering the Add Movie page
router.get("/addmovie", redirectLogin, (req, res) => {
    const userName = req.session.firstName || "Guest";
    res.render("addMovie.ejs", { 
        errors: [], 
        previousData: {}, 
        shopData: { shopName: "Betty's Movies" },
        userName  
    });
});

// Handle the movie addition with validation and sanitization
router.post(
    "/movieadded",
    redirectLogin,
    [
        check("title")
            .isLength({ min: 1, max: 100 })
            .withMessage("Movie title must be between 1 and 100 characters long.")
            .trim()
            .escape(),
        check("description")
            .isLength({ min: 10, max: 1000 })
            .withMessage("Description must be between 10 and 1000 characters.")
            .trim()
            .escape(),
        check("rating")
            .matches(/^\d+(\.\d{1,2})?$/)
            .withMessage("Rating must be a valid number with up to two decimal places.")
            .isFloat({ min: 0, max: 10 })
            .withMessage("Rating must be between 0 and 10."),
        check("release_date")
            .isDate()
            .withMessage("Release date must be a valid date.")
            .trim()
            .escape(),
        check("genres")
            .optional()
            .trim()
            .escape(),
        check("tags")
            .optional()
            .trim()
            .escape(),
        check("keywords")
            .optional()
            .trim()
            .escape(),
    ],
    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.render("addMovie.ejs", {
                errors: errors.array(),
                previousData: req.body,
                shopData: { shopName: "Betty's Movies" }
            });
        }

        // Assign random genres, tags, and keywords if not provided and ensure no duplicates
        const genres = req.body.genres || getRandomUniqueItems(availableGenres, 3);
        const tags = req.body.tags || getRandomUniqueItems(availableTags, 3, genres.split(', '));
        const keywords = req.body.keywords || getRandomUniqueItems(availableKeywords, 3, [...genres.split(', '), ...tags.split(', ')]);

        const sqlquery = "INSERT INTO movies (title, description, rating, release_date, genres, tags, keywords) VALUES (?, ?, ?, ?, ?, ?, ?)";
        const newRecord = [
            req.body.title,
            req.body.description,
            req.body.rating,
            req.body.release_date,
            genres,
            tags,
            keywords
        ];

        db.query(sqlquery, newRecord, (err, result) => {
            if (err) {
                return res.render("addMovie.ejs", {
                    errors: [{ msg: "Error inserting into database. Please try again." }],
                    previousData: req.body,
                    shopData: { shopName: "Betty's Movies" }
                });
            }
            res.redirect('./list');
        });
    }
);





// Route to list all movies with their reviews
router.get("/list", [
    check('rating').optional().matches(/^\d+(\.\d{1,2})?$/).withMessage('Invalid rating format'),
    check('title').trim().escape(),
    check('description').trim().escape(),
    check('review_text').trim().escape()
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.session.userId || null;
    const userName = req.session.firstName || "Guest";

    try {
        const sqlquery = `
            SELECT m.id, m.title, m.description, m.rating, m.release_date, m.genres,
                   r.user_id, r.rating AS review_rating, r.review_text, u.first_name,
                   uf.user_id IS NOT NULL AS isFavorited
            FROM movies m
            LEFT JOIN reviews r ON m.id = r.movie_id
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN user_favorites uf ON m.id = uf.movie_id AND uf.user_id = ?
        `;

        const [rows] = await new Promise((resolve, reject) => {
            db.query(sqlquery, [userId], (err, results) => {
                if (err) return reject(err);
                resolve([results]);
            });
        });

        // Group movies by their ID and attach reviews
        const movies = {};
        rows.forEach((row) => {
            if (!movies[row.id]) {
                movies[row.id] = {
                    id: row.id,
                    title: sanitize(row.title),
                    description: sanitize(row.description),
                    rating: row.rating,
                    release_date: row.release_date,
                    genres: sanitize(row.genres),
                    isFavorited: !!row.isFavorited,
                    reviews: [],
                };
            }
            if (row.review_text) {
                movies[row.id].reviews.push({
                    userId: row.user_id,
                    userName: sanitize(row.first_name),
                    rating: row.review_rating,
                    comment: sanitize(row.review_text),
                });
            }
        });

        const favoriteMovies = Object.values(movies).filter(movie => movie.isFavorited);

        // Render the page with updated movie data, favorite status, and user info
        res.render("list", {
            availableMovies: Object.values(movies),
            favoriteMovies, 
            shopData: { shopName: "Betty's Movies" },
            userId: userId,
            firstName: userName,
        });

    } catch (error) {
        console.error('Error fetching movies:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Function to sanitize input to prevent XSS
function sanitize(input) {
    return input.replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
}

module.exports = router;







// Add movie to favorites
router.post('/favorite', (req, res) => {
    const userId = req.session.userId;
    const movieId = req.body.movieId;

    const query = `
        INSERT INTO user_favorites (user_id, movie_id)
        SELECT ?, ?
        WHERE NOT EXISTS (
            SELECT 1 FROM user_favorites WHERE user_id = ? AND movie_id = ?
        );
    `;
    db.query(query, [userId, movieId, userId, movieId], (err, result) => {
        if (err) {
            console.error('Database error while adding favorite:', err);
            return res.status(500).send('Failed to add favorite.');
        }

        res.redirect('./list'); // Redirect back to the movie list
    });
});

// Remove movie from favorites
router.post('/unfavorite', (req, res) => {
    const userId = req.session.userId;
    const movieId = req.body.movieId;

    const query = `DELETE FROM user_favorites WHERE user_id = ? AND movie_id = ?`;

    db.query(query, [userId, movieId], (err, result) => {
        if (err) {
            console.error('Error removing favorite:', err);
            return res.status(500).send('Failed to remove favorite.');
        }

        res.redirect('./list'); // Redirect back to the movie list
    });
});











// Add a check to set userId properly for the logged-in user.
router.post("/review", (req, res, next) => {
    const { movieId, rating, comment } = req.body;
    const userId = req.session.userId;

    if (!userId) {
        return res.status(403).send("You must be logged in to submit a review.");
    }

    if (isNaN(userId) || userId <= 0) {
        return res.status(400).send("Invalid user ID");
    }

    if (rating < 0 || rating > 10) {
        return res.status(400).send("Rating must be between 0 and 10");
    }

    const insertReviewQuery = `
      INSERT INTO reviews (movie_id, user_id, rating, review_text) 
      VALUES (?, ?, ?, ?)
    `;
    db.query(insertReviewQuery, [movieId, userId, rating, comment], (err, result) => {
        if (err) {
            return next(err);
        }

        updateMovieRating(movieId);
        res.redirect("./list");
    });
});

// Function to update the movie's overall rating
function updateMovieRating(movieId) {
    const sqlquery = "SELECT AVG(rating) AS avgRating FROM reviews WHERE movie_id = ?";
    db.query(sqlquery, [movieId], (err, result) => {
        if (err) {
            console.error("Error calculating average rating:", err);
            return;
        }

        const avgRating = result[0].avgRating;
        const updateRatingQuery = "UPDATE movies SET rating = ? WHERE id = ?";
        db.query(updateRatingQuery, [avgRating, movieId], (err, result) => {
            if (err) {
                console.error("Error updating movie rating:", err);
            }
        });
    });
}



router.get('/search', (req, res) => {
    res.render('search', { shopData: { shopName: "Betty's Movies" } });
});

router.get('/search_result', (req, res, next) => {
    const { title, minRating, maxRating, reviewContent, descriptionContent, releaseYear, sortBy, genres } = req.query;

    // Build the SQL query dynamically based on provided filters
    let sqlQuery = `
        SELECT m.id, m.title, m.description, m.rating, m.release_date, m.genres, COUNT(r.id) AS review_count
        FROM movies m
        LEFT JOIN reviews r ON m.id = r.movie_id
        WHERE 1=1
    `;
    const params = [];

    if (title) {
        sqlQuery += " AND m.title LIKE ?";
        params.push(`%${title}%`);
    }
    if (minRating) {
        sqlQuery += " AND m.rating >= ?";
        params.push(parseFloat(minRating));
    }
    if (maxRating) {
        sqlQuery += " AND m.rating <= ?";
        params.push(parseFloat(maxRating));
    }
    if (reviewContent) {
        sqlQuery += " AND r.review_text LIKE ?";
        params.push(`%${reviewContent}%`);
    }
    if (descriptionContent) {
        sqlQuery += " AND m.description LIKE ?";
        params.push(`%${descriptionContent}%`);
    }
    if (releaseYear) {
        sqlQuery += " AND YEAR(m.release_date) = ?";
        params.push(parseInt(releaseYear));
    }
    if (genres) {
        const genresArray = genres.split(',').map(genre => genre.trim());
        sqlQuery += " AND (" + genresArray.map(() => "m.genres LIKE ?").join(" OR ") + ")";
        params.push(...genresArray.map(genre => `%${genre}%`));
    }

    // Add sorting based on user selection
    if (sortBy === 'mostReviews') {
        sqlQuery += " GROUP BY m.id ORDER BY review_count DESC";
    } else if (sortBy === 'highestRating') {
        sqlQuery += " GROUP BY m.id ORDER BY m.rating DESC";
    } else if (sortBy === 'newestRelease') {
        sqlQuery += " GROUP BY m.id ORDER BY m.release_date DESC";
    } else {
        sqlQuery += " GROUP BY m.id";
    }

    // Execute the query
    db.query(sqlQuery, params, (err, results) => {
        if (err) {
            return next(err);
        }

        if (results.length === 0) {
            // No movies matched the criteria
            return res.render('search_result', { shopData: { shopName: "Betty's Movies" }, movies: null });
        }

        // Format the release date to show only the date part
        results.forEach(movie => {
            movie.release_date = new Date(movie.release_date).toDateString();
        });

        res.render('search_result', { shopData: { shopName: "Betty's Movies" }, movies: results });
    });
});




const TMDB_API_KEY = 'b4c8f4d68cafb98598fa69cd18caccc3';
const TMDB_AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiNGM4ZjRkNjhjYWZiOTg1OThmYTY5Y2QxOGNhY2NjMyIsIm5iZiI6MTczMzc1MDQzNS42NzgwMDAyLCJzdWIiOiI2NzU2ZWVhMzllMTJmYTI1ZThmYmUwZmEiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.Z7S4vYgb4uaChz0Tf1XFXLlfE4kcT1A4ybZb1t9aSuM';

const getRandomPage = () => Math.floor(Math.random() * 500) + 1;

// Helper function to limit text to a certain number of words
const limitText = (text, wordLimit) => {
    if (!text) return '';
    const words = text.split(' ');
    return words.length > wordLimit ? words.slice(0, wordLimit).join(' ') + '...' : text;
};

// Route to fetch and display random movies from TMDb and database
router.get("/latest", async (req, res, next) => {
    const userId = req.session.userId || null;
    const userName = req.session.firstName || "Guest";

    try {
        // Fetch random movies from TMDb
        const randomPage = getRandomPage();
        const response = await axios.get('https://api.themoviedb.org/3/movie/popular', {
            headers: {
                'Authorization': `Bearer ${TMDB_AUTH_TOKEN}`
            },
            params: {
                'api_key': TMDB_API_KEY,
                'page': randomPage
            }
        });

        const latestMoviesFromAPI = await Promise.all(
            response.data.results.slice(0, 5).map(async movie => {
                const movieDetailsResponse = await axios.get(`https://api.themoviedb.org/3/movie/${movie.id}`, {
                    headers: {
                        'Authorization': `Bearer ${TMDB_AUTH_TOKEN}`
                    },
                    params: {
                        'api_key': TMDB_API_KEY
                    }
                });

                const keywordsResponse = await axios.get(`https://api.themoviedb.org/3/movie/${movie.id}/keywords`, {
                    headers: {
                        'Authorization': `Bearer ${TMDB_AUTH_TOKEN}`
                    },
                    params: {
                        'api_key': TMDB_API_KEY
                    }
                });

                const movieDetails = movieDetailsResponse.data;
                const keywords = keywordsResponse.data.keywords.map(keyword => keyword.name).join(', ');

                return {
                    id: movieDetails.id,
                    title: movieDetails.title || 'Untitled',
                    description: limitText(movieDetails.overview, 50) || 'No description available.',
                    rating: movieDetails.vote_average || 'N/A',
                    release_date: movieDetails.release_date || 'N/A',
                    genres: movieDetails.genres.map(genre => genre.name).join(', ') || 'N/A',
                    tags: movieDetails.tagline || 'No tags available.',
                    keywords: limitText(keywords, 50) || 'No keywords available.'
                };
            })
        );

        // Filter out movies with any field having 'N/A'
        const filteredMoviesFromAPI = latestMoviesFromAPI.filter(movie => 
            movie.title !== 'Untitled' && movie.description !== 'No description available.' && 
            movie.rating !== 'N/A' && movie.release_date !== 'N/A' && 
            movie.genres !== 'N/A' && movie.tags !== 'No tags available.' && 
            movie.keywords !== 'No keywords available.'
        );

        // Fetch the latest five movie entries from your database
        const sqlQuery = `
            SELECT title, description, rating, release_date, genres, tags, keywords
            FROM movies
            ORDER BY id DESC
            LIMIT 5
        `;

        db.query(sqlQuery, (err, dbResults) => {
            if (err) {
                return next(err);
            }

            const latestMoviesFromDB = dbResults.map(movie => ({
                title: movie.title,
                description: movie.description,
                rating: movie.rating,
                release_date: movie.release_date,
                genres: movie.genres,
                tags: movie.tags,
                keywords: movie.keywords
            }));

            res.render("latest", {
                latestMoviesFromAPI: filteredMoviesFromAPI,
                latestMoviesFromDB: latestMoviesFromDB,
                shopData: { shopName: "Betty's Movies" },
                userName,  // Pass userName to the template
                userId     // Pass userId to the template
            });
        });
    } catch (error) {
        console.error('Error fetching random movies:', error.message);
        next(error);
    }
});

// Route to add movie to database
router.post('/add-movie', (req, res) => {
    const { title, description, rating, release_date, genres, tags, keywords } = req.body;

    // Ensure all fields are present
    if (!title || title === 'Untitled' || !description || description === 'No description available.' || 
        !rating || rating === 'N/A' || !release_date || release_date === 'N/A' || 
        !genres || genres === 'N/A' || !tags || tags === 'No tags available.' || 
        !keywords || keywords === 'No keywords available.') {
        return res.status(400).send('Failed to add movie. Missing or invalid required fields.');
    }

    const sqlQuery = `
        INSERT INTO movies (title, description, rating, release_date, genres, tags, keywords)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sqlQuery, [title, description, rating, release_date, genres, tags, keywords], (err, result) => {
        if (err) {
            console.error('Error adding movie to database:', err);
            return res.status(500).send('Failed to add movie.');
        }

        res.redirect('./latest'); // Redirect back to the random movies page
    });
});

module.exports = router;











const googleApiKey = 'AIzaSyCgIPpczN_SP_qmAGfGCEDlOfAv7sQjYVY';
const customSearchEngineId = '22622c00d685e4ccc'; 

// Recommendations route
router.get('/recommendations', async (req, res, next) => {
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ error: "User not logged in." });
    }

    // Fetch user preferences
    const query = `
        SELECT u.username,
               GROUP_CONCAT(m.genres SEPARATOR '|') AS favorite_genres,
               GROUP_CONCAT(m.tags SEPARATOR '|') AS favorite_tags,
               GROUP_CONCAT(m.keywords SEPARATOR '|') AS favorite_keywords,
               GROUP_CONCAT(m.id SEPARATOR ',') AS favorite_movie_ids
        FROM users u
        JOIN user_favorites uf ON u.id = uf.user_id
        JOIN movies m ON uf.movie_id = m.id
        WHERE u.id = ?
        GROUP BY u.username;
    `;

    db.query(query, [userId], async (err, results) => {
        if (err) return next(err);

        const preferences = results.length ? results[0] : null;

        // Check if preferences are null or empty
        if (!preferences) {
            return res.status(404).json({ error: "No preferences found for this user." });
        }

        // Handle case where the user doesn't have favorite genres
        if (!preferences.favorite_genres) {
            return res.json({ message: "User has no favorite movies." });
        }

        const genres = preferences.favorite_genres.split('|');

        // Normalize and count genres
        const genreCounts = genres
            .flatMap(genre => genre.split(',').map(g => g.trim().toLowerCase()))
            .reduce((acc, genre) => {
                acc[genre] = (acc[genre] || 0) + 1;
                return acc;
            }, {});

        // Get all genres with their counts
        const allGenres = Object.keys(genreCounts).map(genre => `${genre} (${genreCounts[genre]})`);

        // Get the top 2 most frequent genres
        const sortedGenres = Object.keys(genreCounts)
            .sort((a, b) => genreCounts[b] - genreCounts[a]);
        const topGenres = sortedGenres.slice(0, 2);

        const tags = preferences.favorite_tags ? preferences.favorite_tags.split('|') : [];
        const keywords = preferences.favorite_keywords ? preferences.favorite_keywords.split('|') : [];
        const favoriteMovieIds = preferences.favorite_movie_ids ? preferences.favorite_movie_ids.split(',') : [];

        // Query for recommendations based on top genres
        const genreConditions = topGenres.map(genre => `m.genres LIKE ?`).join(' OR ');
        const recommendationQuery = `
            SELECT m.id, m.title, m.genres, m.tags, m.keywords, m.description
            FROM movies m
            WHERE (${genreConditions})
              AND m.id NOT IN (?)
            LIMIT 10
        `;

        const queryParams = [
            ...topGenres.map(genre => `%${genre}%`),
            favoriteMovieIds
        ];

        db.query(recommendationQuery, queryParams, async (err, dbRecommendations) => {
            if (err) return next(err);

            // Fetch API recommendations
            let apiRecommendations = [];
            try {
                const apiResponse = await axios.get(`https://www.googleapis.com/customsearch/v1`, {
                    params: {
                        key: googleApiKey,
                        cx: customSearchEngineId,
                        q: `top ${topGenres.join(', ')} movies`,
                        num: 3
                    }
                });

                // Increased slice for query and response
                apiRecommendations = apiResponse.data.items?.map(item => ({
                    query: item.title.slice(0, 150),  // Increase query slice length
                    response: item.snippet.slice(0, 400)  // Increase response slice length
                })) || [];
            } catch (error) {
                console.error('Error fetching API recommendations:', error.message);
            }

            res.render('recommendations', {
                username: preferences.username,
                allGenres: allGenres.length ? allGenres.join(', ') : 'No favorite genres available.',
                favoriteGenres: topGenres.length ? topGenres.join(', ') : 'No favorite genres available.',
                dbRecommendations,
                apiRecommendations
            });
        });
    });
});


module.exports = router;





// User preferences route
router.get('/user-preferences', (req, res, next) => {
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ error: "User not logged in." });
    }

    const query = `
        SELECT u.username,
               m.title AS favorite_titles,
               m.genres AS favorite_genres,
               m.tags AS favorite_tags,
               m.release_date AS favorite_years,
               m.description AS favorite_descriptions,
               m.keywords AS favorite_keywords
        FROM users u
        LEFT JOIN user_favorites uf ON u.id = uf.user_id
        LEFT JOIN movies m ON uf.movie_id = m.id
        WHERE u.id = ?
        ORDER BY uf.id;
    `;

    db.query(query, [userId], (err, results) => {
        if (err) return next(err);

        const preferences = results.length ? results : [];

        // Define the message
        let message = '';
        if (preferences.length && preferences.length < 4) {
            message = `You need at least 4 favorite movies to get recommendations. You have ${preferences.length}.`;
        } else if (preferences.length === 0) {
            message = `You have no favorite movies. Please add at least 4 favorite movies to get recommendations.`;
        }

        res.render('user-preferences', {
            username: preferences.length ? preferences[0].username : '',
            preferences,
            favorite_count: preferences.length,
            message  // Pass the message variable to the template
        });
    });
});

module.exports = router;




