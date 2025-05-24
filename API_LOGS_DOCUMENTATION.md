# API Detailed Logs Feature

## Overview
The application now includes a comprehensive API logging system that tracks all API calls made to the Binance API with detailed information including requests, responses, timing, and error handling.

## Features

### 1. Detailed API Call Tracking
- **Request Information**: Method, URL, parameters, headers, request size
- **Response Information**: Status code, response size, response preview (first 500 chars)
- **Performance Metrics**: Response time in milliseconds
- **Error Handling**: Captures and logs any API errors
- **Symbol Tracking**: Associates each call with the relevant trading symbol

### 2. Real-time Statistics
- Total API calls made
- Successful vs failed calls
- Average response time
- Success rate monitoring

### 3. Web Interface
- **API Logs Tab**: New tab in the frontend showing detailed logs
- **Interactive Table**: Shows recent API calls with sortable columns
- **Detailed Modal**: Click "Details" to see complete request/response information
- **Filtering**: Filter logs by symbol (e.g., "BTCUSDT")
- **Real-time Updates**: Auto-refresh every 5 seconds
- **Statistics Dashboard**: Visual overview of API performance

### 4. API Endpoints

#### Get API Logs
```
GET /api/api-logs?limit=100&symbol_filter=BTCUSDT
```
- `limit`: Number of logs to return (max 1000, default 100)
- `symbol_filter`: Optional filter by symbol name

#### Get API Statistics
```
GET /api/api-stats
```
Returns summary statistics about API calls.

#### Clear API Logs
```
POST /api/api-logs/clear
```
Clears all logs and resets statistics.

## Usage

### Viewing Logs in the Web Interface
1. Open the application at `http://localhost:3001`
2. Click on the "API Logs" tab
3. View real-time API calls as they happen
4. Click "Details" on any row to see full request/response information
5. Use filters to find specific symbols or limit results

### Log Information Includes
- **Timestamp**: When the API call was made
- **Method**: HTTP method (GET, POST, etc.)
- **URL**: The API endpoint called
- **Symbol**: Trading pair if applicable
- **Status**: Success/failure status
- **Response Time**: How long the call took
- **Size**: Response size in KB
- **Full Details**: Complete request parameters and response preview

### Monitoring API Performance
- Check the statistics panel for overall API health
- Monitor average response times
- Track success/failure rates
- Identify slow or failing API calls

## Technical Implementation

### Backend Components
- **`api_logger.py`**: Core logging service with detailed tracking
- **`binance_client.py`**: Enhanced with logging integration
- **`routes.py`**: New endpoints for accessing logs and stats
- **`scheduler.py`**: Integrated API statistics in status reports

### Frontend Components
- **`ApiLogsPanel.jsx`**: Complete logs interface with filtering and details
- **`App.jsx`**: Tab navigation for accessing logs
- **`StatusPanel.jsx`**: Enhanced with API statistics

### Data Retention
- Logs are stored in memory with a rolling buffer (default: 1000 entries)
- Older logs are automatically removed to prevent memory issues
- Statistics accumulate over the application lifetime

## Benefits
1. **Debugging**: Easily identify API issues and performance problems
2. **Monitoring**: Real-time visibility into API usage and health
3. **Optimization**: Track response times to optimize API usage patterns
4. **Troubleshooting**: Complete request/response information for debugging
5. **Analytics**: Historical view of API call patterns and performance

## Example Use Cases
- Monitor which symbols are taking longer to fetch
- Debug API errors with complete request/response information
- Track API rate limiting and response patterns
- Analyze performance trends over time
- Identify and troubleshoot connectivity issues
