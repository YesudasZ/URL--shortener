# URL Shortener

This is an advanced URL shortener application that allows users to shorten long URLs, access URL analytics, and use custom aliases for shortened links. The app is built using Node.js, Express, MongoDB, and Redis for caching. 

The project includes an API for shortening URLs, retrieving URL analytics, and more. It also provides a web interface for end-users to interact with the application.

## Live Demo

You can access the live demo of the application here:  
[URL Shortener App](https://url-shortener-pink-zeta.vercel.app/)

## API Documentation

API documentation for the URL Shortener app is available on Postman:  
[API Documentation](https://documenter.getpostman.com/view/33164217/2sAYHzFi2x)

## Folder Structure

```
advanced-url-shortener/
├── src/
│   ├── config/         # Configuration (DB, Redis, env variables)
│   ├── controllers/    # Controllers (business logic)
│   ├── middleware/     # Middleware (auth, rate limiting)
│   ├── models/         # DB Models
│   ├── routes/         # API routes
│   ├── utils/          # Utilities (logging, helpers)
│   ├── app.js          # Main Express app
├── package.json        # Project dependencies and scripts
├── README.md           # Project documentation
```

## Installation

To run the project locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/advanced-url-shortener.git
   ```

2. Navigate to the project directory:
   ```bash
   cd advanced-url-shortener
   ```

3. Install the required dependencies:
   ```bash
   npm install
   ```

4. Create a `.env` file in the root directory and set the necessary environment variables:
   ```bash
   DB_URI=mongodb://localhost:27017/shortener
   REDIS_URI=redis://localhost:6379
   JWT_SECRET=your-secret-key
   ```

5. Start the server:
   ```bash
   npm start
   ```

6. The app will be running at [http://localhost:3000](http://localhost:3000).

## Features

- **URL Shortening**: Create a shortened URL by providing a long URL and an optional custom alias.
- **Custom Aliases**: Optionally, create a custom alias for your shortened URL.
- **Topic-Based Shortening**: Categorize URLs by topic for better organization and analytics.
- **URL Analytics**: Retrieve analytics such as number of clicks and the source of the clicks for any shortened URL.
- **Redirection**: Redirect users from a short URL to the original long URL.

## Endpoints

### Authentication

- `GET /auth/google` - Google Login
- `GET /auth/google/callback` - Google Callback
- `GET /auth/logout` - Logout

### URL Shortening

- `POST /api/shorten` - Create Short URL
  - Body:
    ```json
    {
      "longUrl": "https://example.com",
      "customAlias": "custom123",
      "topic": "general"
    }
    ```
  
- `GET /api/shorten/:alias` - Redirect to Long URL

### URL Analytics

- `GET /api/analytics/:alias` - Get URL Analytics
- `GET /api/analytics/topic/:topic` - Get Topic Analytics
- `GET /api/analytics/overall` - Get Overall Analytics

## Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Caching**: Redis
- **Authentication**: JWT
- **Rate Limiting**: Redis-based rate limiter
- **API Documentation**: Postman

## Contributing

If you would like to contribute to the project:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them with clear messages.
4. Push your branch and create a pull request.

