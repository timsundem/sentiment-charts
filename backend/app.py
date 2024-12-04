from flask import Flask, send_from_directory, request, jsonify
import yfinance as yf
import requests
from dotenv import load_dotenv
import os

load_dotenv()

# Access variables
TWITTER_API_KEY = os.getenv("TWITTER_API_KEY")
TWITTER_API_SECRET = os.getenv("TWITTER_API_SECRET")
TWITTER_BEARER_TOKEN = os.getenv("TWITTER_BEARER_TOKEN")

app = Flask(__name__)

# Route to serve the frontend
@app.route('/')
def serve_frontend():
    return send_from_directory('../frontend', 'index.html')

@app.route('/api/stock', methods=['GET'])
def get_stock_data():
    ticker = request.args.get('ticker')
    try:
        stock = yf.Ticker(ticker)
        data = stock.history(period='1y')
        
        # Additional stock information
        stock_info = stock.info
        details = {
            "chart_data": {str(date): value for date, value in data['Close'].to_dict().items()},
            "info": {
                "52_week_high": stock_info.get("fiftyTwoWeekHigh"),
                "52_week_low": stock_info.get("fiftyTwoWeekLow"),
                "market_cap": stock_info.get("marketCap"),
                "current_price": stock_info.get("currentPrice"),
                "day_high": stock_info.get("dayHigh"),
                "day_low": stock_info.get("dayLow"),
            }
        }
        return jsonify(details)
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route('/api/crypto', methods=['GET'])
def get_crypto_data():
    ticker = request.args.get('ticker')
    response = requests.get(
        f'https://api.coingecko.com/api/v3/coins/{ticker}/market_chart',
        params={'vs_currency': 'usd', 'days': 365}
    )
    return jsonify(response.json()['prices'])

if __name__ == '__main__':
    app.run(debug=True)
