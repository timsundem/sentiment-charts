let chartInstance = null;

function updateStockDetails(info = {}, flags = {}) {
    // Update basic stock details
    document.getElementById('current-price').innerText = info.current_price ? `$${info.current_price.toFixed(2)}` : 'N/A';
    document.getElementById('high').innerText = info['52_week_high'] ? `$${info['52_week_high'].toFixed(2)}` : 'N/A';
    document.getElementById('low').innerText = info['52_week_low'] ? `$${info['52_week_low'].toFixed(2)}` : 'N/A';
    document.getElementById('market-cap').innerText = info.market_cap ? `$${(info.market_cap / 1e9).toFixed(2)}B` : 'N/A';


    const metrics = [
        { id: 'pe-ratio', value: info.pe_ratio || 'N/A', flag: flags.pe_ratio || 'Neutral' },
        { id: 'peg-ratio', value: info.peg_ratio || 'N/A', flag: flags.peg_ratio || 'Neutral' },
        { id: 'pb-ratio', value: info.pb_ratio || 'N/A', flag: flags.pb_ratio || 'Neutral' },
        { id: 'net-profit-margin', value: info.net_profit_margin || 'N/A', flag: flags.net_profit_margin || 'Neutral' },
        { id: 'roe', value: info.roe || 'N/A', flag: flags.roe || 'Neutral' },
        { id: 'roa', value: info.roa || 'N/A', flag: flags.roa || 'Neutral' },
        { id: 'revenue-growth', value: info.revenue_growth || 'N/A', flag: flags.revenue_growth || 'Neutral' },
        { id: 'eps-growth', value: info.eps_growth || 'N/A', flag: flags.eps_growth || 'Neutral' },
        { id: 'current-ratio', value: info.current_ratio || 'N/A', flag: flags.current_ratio || 'Neutral' },
        { id: 'debt-to-equity', value: info.debt_to_equity || 'N/A', flag: flags.debt_to_equity || 'Neutral' }
    ];
    
    metrics.forEach(metric => {
        const valueElement = document.getElementById(metric.id);
        const flagElement = document.getElementById(`${metric.id}-flag`);

        console.log(`Processing metric: ${metric.id}, Value: ${metric.value}, Flag: ${metric.flag}`);

    
        if (valueElement) valueElement.innerText = metric.value;
    
        if (flagElement) {
            if (metric.flag === 'Good') {
                flagElement.innerHTML = '✔️';
                flagElement.style.color = 'green';
            } else if (metric.flag === 'Bad') {
                flagElement.innerHTML = '❌';
                flagElement.style.color = 'red';
            } else if (metric.flag === 'Neutral') {
                flagElement.innerHTML = '⚪';
                flagElement.style.color = 'gray';
            } else {
                flagElement.innerHTML = ''; // Handle missing flags
            }
        }
    });
}    





// Function to update investment scenario results
function updateInvestmentResults(investment) {
    document.getElementById('value-now').innerText = investment.current_value ? `$${investment.current_value.toFixed(2)}` : 'N/A';
    document.getElementById('percentage-change').innerText = investment.percentage_change ? `${investment.percentage_change.toFixed(2)}%` : 'N/A';
}

// Function to fetch stock data and optionally simulate an investment
async function fetchStockDetails(ticker, investmentAmount = null, investmentDate = null) {
    try {
        const loadingIndicator = document.getElementById('loading');
        loadingIndicator.style.display = 'block';

        // Build API query string
        let query = `/api/stock?ticker=${ticker}`;
        if (investmentAmount && investmentDate) {
            query += `&investment_amount=${investmentAmount}&investment_date=${investmentDate}`;
        }

        const response = await fetch(query);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error fetching stock data.');
        }

        // Update stock details
        if (data.info) {
            updateStockDetails(data.info);
        }

        // Update investment results
        if (data.investment) {
            updateInvestmentResults(data.investment);
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
        alert(error.message);
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

// Event listener for stock search
document.getElementById('search-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const ticker = document.getElementById('ticker').value.trim();
    await fetchStockDetails(ticker);
});

// Event listener for investment scenario
document.getElementById('investment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const ticker = document.getElementById('ticker').value.trim();
    const investmentAmount = parseFloat(document.getElementById('investment-amount').value);
    const investmentDate = document.getElementById('investment-date').value;
    if (!investmentAmount || !investmentDate) {
        alert('Please enter both an investment amount and a date.');
        return;
    }
    await fetchStockDetails(ticker, investmentAmount, investmentDate);
});
