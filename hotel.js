const axios = require('axios');

async function getTMDbReviews() {
    const apiKey = 'b4c8f4d68cafb98598fa69cd18caccc3';
    const accessToken = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiNGM4ZjRkNjhjYWZiOTg1OThmYTY5Y2QxOGNhY2NjMyIsIm5iZiI6MTczMzc1MDQzNS42NzgwMDAyLCJzdWIiOiI2NzU2ZWVhMzllMTJmYTI1ZThmYmUwZmEiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.Z7S4vYgb4uaChz0Tf1XFXLlfE4kcT1A4ybZb1t9aSuM';
    const url = 'https://api.themoviedb.org/3/movie/popular';

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            params: {
                'api_key': apiKey
            }
        });

        // Shuffle the movies array to get random movies
        const movies = response.data.results.sort(() => Math.random() - 0.5);

        console.log('\nMovies and Reviews:');
        for (let i = 0; i < 5; i++) { // Limiting to top 5 movies
            const movie = movies[i];
            const movieDetailsUrl = `https://api.themoviedb.org/3/movie/${movie.id}`;

            const movieDetailsResponse = await axios.get(movieDetailsUrl, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                params: {
                    'api_key': apiKey
                }
            });

            const details = movieDetailsResponse.data;

            console.log(`\nMovie ${i + 1}:`);
            console.log(`  Title: ${details.title}`);
            console.log(`  Rating: ${details.vote_average}`);
            console.log(`  Description: ${details.overview}`);

            const reviewsUrl = `https://api.themoviedb.org/3/movie/${movie.id}/reviews`;
            const reviewsResponse = await axios.get(reviewsUrl, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                params: {
                    'api_key': apiKey
                }
            });

            const reviews = reviewsResponse.data.results.slice(0, 3); // Limiting to top 3 reviews

            console.log('  Reviews:');
            if (reviews.length === 0) {
                console.log('    No reviews available');
            } else {
                reviews.forEach((review, i) => console.log(`    ${i + 1}. ${review.content.replace(/<\/?[^>]+(>|$)/g, "").split(' ').slice(0, 30).join(' ')}${review.content.split(' ').length > 30 ? '...' : ''}`));
            }
        }
    } catch (error) {
        console.error('Error fetching TMDb data:', error.message);
    }
}

// Run the scraper
getTMDbReviews();
