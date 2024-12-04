let chartInstance = null;

// Function to update stock details on the page
function updateStockDetails(info) {
    document.getElementById('current-price').innerText = info.current_price || 'N/A';
    document.getElementById('high').innerText = info["52_week_high"] || 'N/A';
    document.getElementById('low').innerText = info["52_week_low"] || 'N/A';
    document.getElementById('market-cap').innerText = info.market_cap || 'N/A';
}

async function fetchSentiment(ticker) {
    const sentimentResponse = await fetch(`/api/sentiment?ticker=${ticker}`);
    const sentimentData = await sentimentResponse.json();

    if (sentimentResponse.ok) {
        document.getElementById('positive').innerText = sentimentData.sentiments.positive;
        document.getElementById('neutral').innerText = sentimentData.sentiments.neutral;
        document.getElementById('negative').innerText = sentimentData.sentiments.negative;
    } else {
        alert("Error fetching sentiment data");
    }
}

document.getElementById('search-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const ticker = document.getElementById('ticker').value.trim();
    const isCrypto = ticker.match(/BTC|ETH|DOGE/i);
    const endpoint = isCrypto ? '/api/crypto' : '/api/stock';

    try {
        const loadingIndicator = document.getElementById('loading');
        loadingIndicator.style.display = 'block'; // Show custom loading icon

        const response = await fetch(endpoint + `?ticker=${ticker}`);
        if (!response.ok) {
            alert("Error fetching data. Please check the ticker.");
            return;
        }

        const data = await response.json();
        loadingIndicator.style.display = 'none'; // Hide custom loading icon

        // Update stock details
        if (!isCrypto && data.info) {
            updateStockDetails(data.info);
        }

        // Format data and display chart
        const labels = Object.keys(data.chart_data || {});
        const values = Object.values(data.chart_data || {});

        if (chartInstance) {
            chartInstance.destroy();
        }

        const ctx = document.getElementById('chart').getContext('2d');
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${ticker.toUpperCase()} Price`,
                    data: values,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { display: true },
                    y: { display: true }
                }
            }
        });
    } catch (error) {
        console.error(error);
        alert("An error occurred. Please try again later.");
    } finally {
        document.getElementById('loading').style.display = 'none'; // Hide custom loading icon
    }
});
