/* eslint-disable no-irregular-whitespace */

const movies = [
    {
        title: "The Shawshank Redemption",
        year: 1994,
        genre: ["Drama"],
        imdbRating: 9.3,
        // Poster from MoviePosterDB (downloadable 687 × 1000px)
        poster: "https://img.movieposterdb.com/00_687x1000/shawshank-redemption-i111161.jpg",
        plot: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
        download: true
    },
    {
        title: "Inception",
        year: 2010,
        genre: ["Action", "Adventure", "Sci-Fi"],
        imdbRating: 8.8,
        // Reddit-hosted poster snapshot (trusted link from community sharing)
        poster: "https://i.redd.it/z60u9j.jpg",
        plot: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a CEO.",
        download: false
    },
    {
        title: "The Dark Knight",
        year: 2008,
        genre: ["Action", "Crime", "Drama"],
        imdbRating: 9.0,
        poster: "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTM2Mw@@._V1_.jpg",
        plot: "When the menace known as the Joker wreaks havoc on Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
        download: true
    },
    {
        title: "Interstellar",
        year: 2014,
        genre: ["Adventure", "Drama", "Sci-Fi"],
        imdbRating: 8.6,
        poster: "https://m.media-amazon.com/images/M/MV5BMjIxNTU4MzY4Nl5BMl5BanBnXkFtZTgwNzUxNzE3MjE@._V1_.jpg",
        plot: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
        download: false
    },
    {
        title: "Parasite",
        year: 2019,
        genre: ["Drama", "Thriller"],
        imdbRating: 8.5,
        poster: "https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDAtNTBlMC00NjczLWJkMjktYjZhZDA3ZjhjZGRjXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_.jpg",
        plot: "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.",
        download: false
    }
];

// Export the data if using in a module system
export default movies
