from flask import Flask, send_from_directory, request, jsonify
import yfinance as yf
import requests
from dotenv import load_dotenv
import os
import pandas as pd

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
    investment_date = request.args.get('investment_date')
    investment_amount = float(request.args.get('investment_amount', 0))

    try:
        stock = yf.Ticker(ticker)
        data = stock.history(period='1y')
        stock_info = stock.info



        # Initialize default values for investment simulation
        purchase_price = None
        current_value = None
        percentage_change = None

        # Investment simulation
        if investment_date:
            try:
                investment_date = pd.Timestamp(investment_date)
                if data.index.tz:
                    investment_date = investment_date.tz_localize(data.index.tz)
                closest_date = data.index[data.index.get_indexer([investment_date], method='nearest')[0]]
                purchase_price = data.loc[closest_date]['Close']
                shares = investment_amount / purchase_price
                current_price = stock_info.get("currentPrice")
                current_value = shares * current_price
                percentage_change = ((current_value - investment_amount) / investment_amount) * 100
            except Exception as e:
                print(f"Error during investment simulation: {e}")
       
       # Calculate additional metrics
        pe_ratio = stock_info.get("forwardPE")
        peg_ratio = stock_info.get("pegRatio")
        pb_ratio = stock_info.get("priceToBook")
        net_profit_margin = stock_info.get("profitMargins")
        roe = stock_info.get("returnOnEquity")
        roa = stock_info.get("returnOnAssets")
        revenue_growth = stock_info.get("revenueGrowth")
        eps_growth = stock_info.get("earningsQuarterlyGrowth")
        current_ratio = stock_info.get("currentRatio")
        debt_to_equity = stock_info.get("debtToEquity")

        # Helper function to classify metrics
        def classify(value, good_range, bad_range):
            if value is None:
                return "Neutral"
            if good_range[0] <= value <= good_range[1]:
                return "Good"
            if value < bad_range[0] or value > bad_range[1]:
                return "Bad"
            return "Neutral"
        

        # Return stock details and investment scenario
        details = {
            "chart_data": {str(date): value for date, value in data['Close'].to_dict().items()},
            "info": {
                "52_week_high": stock_info.get("fiftyTwoWeekHigh"),
                "52_week_low": stock_info.get("fiftyTwoWeekLow"),
                "current_price": stock_info.get("currentPrice"),
                "market_cap": stock_info.get("marketCap"),
                "pe_ratio": stock_info.get("forwardPE", None),
                "peg_ratio": stock_info.get("pegRatio", None),
                "pb_ratio": stock_info.get("priceToBook", None),
                "net_profit_margin": stock_info.get("profitMargins", None),
                "roe": stock_info.get("returnOnEquity", None),
                "roa": stock_info.get("returnOnAssets", None),
                "revenue_growth": stock_info.get("revenueGrowth", None),
                "eps_growth": stock_info.get("earningsQuarterlyGrowth", None),
                "current_ratio": stock_info.get("currentRatio", None),
                "debt_to_equity": stock_info.get("debtToEquity", None),
            },
            "investment": {
                "purchase_price": purchase_price,
                "current_value": current_value,
                "percentage_change": percentage_change
            },
            "flags": {
                "pe_ratio": classify(pe_ratio, (10, 25), (30, float("inf"))),
                "peg_ratio": classify(peg_ratio, (0, 1), (2, float("inf"))),
                "pb_ratio": classify(pb_ratio, (0, 3), (5, float("inf"))),
                "net_profit_margin": classify(net_profit_margin, (0.1, float("inf")), (0, 0.05)),
                "roe": classify(roe, (0.15, float("inf")), (0, 0.05)),
                "roa": classify(roa, (0.05, float("inf")), (0, 0.02)),
                "revenue_growth": classify(revenue_growth, (0.1, float("inf")), (0, 0.05)),
                "eps_growth": classify(eps_growth, (0.1, float("inf")), (0, 0.05)),
                "current_ratio": classify(current_ratio, (1.5, 3), (0, 1)),
                "debt_to_equity": classify(debt_to_equity, (0, 0.5), (1, float("inf"))),
            }
        }
        print("Backend Response:", details)
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
