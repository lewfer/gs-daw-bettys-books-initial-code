const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db'); 
const googleApiKey = 'AIzaSyCgIPpczN_SP_qmAGfGCEDlOfAv7sQjYVY';
const customSearchEngineId = '22622c00d685e4ccc'; 




// Middleware to check user ID
function checkUserId(req, res, next) {
    const userId = req.session.userId; 
    if (userId && parseInt(userId) === 5) {
        next(); // User ID 5 is allowed, proceed to the next middleware/route handler
    } else {
        res.status(403).send('Access restricted'); // Access denied for other users
    }
}

// Route to render API Provision page with user ID check
router.get('/api-provision', checkUserId, (req, res, next) => {
    const query = 'SELECT id FROM users';

    db.query(query, (err, results) => {
        if (err) return next(err);

        res.render('apiProvision', { users: results });
    });
});

module.exports = router;



// Recommendations route
router.get('/recommendations/:userId', async (req, res, next) => {
    const userId = req.params.userId;

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

        if (!preferences) {
            return res.status(404).json({ error: "No preferences found for this user." });
        }

        // Handle missing or empty preferences
        const genres = preferences.favorite_genres ? preferences.favorite_genres.split('|') : [];
        const tags = preferences.favorite_tags ? preferences.favorite_tags.split('|') : [];
        const keywords = preferences.favorite_keywords ? preferences.favorite_keywords.split('|') : [];
        const favoriteMovieIds = preferences.favorite_movie_ids ? preferences.favorite_movie_ids.split(',') : [];

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

        // If no top genres found, handle the case
        if (topGenres.length === 0) {
            return res.status(404).json({ error: "No favorite genres available for recommendations." });
        }

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

                apiRecommendations = apiResponse.data.items?.map(item => ({
                    query: item.title.slice(0, 30),
                    response: item.snippet.slice(0, 70)
                })) || [];
            } catch (error) {
                console.error('Error fetching API recommendations:', error.message);
            }

            res.json({
                username: preferences.username,
                allGenres: allGenres.join(', ') || 'No favorite genres available.',
                favoriteGenres: topGenres.join(', ') || 'No top genres available.',
                dbRecommendations,
                apiRecommendations
            });
        });
    });
});

module.exports = router;
