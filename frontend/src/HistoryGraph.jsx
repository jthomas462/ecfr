import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    BarElement,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

function HistoryGraph({ historicalChanges, dates }) {
    const data = {
        labels: dates,
        datasets: [
            {
                label: "Historical Changes Over Time",
                data: historicalChanges,
                fill: true,
                backgroundColors: "rgba(255, 99, 132, 0.7)",
                borderColor: "rgba(75, 192, 192, 1)"
            }
        ]
    }
    return (
      <div>Historical Changes Over Time
        <div>
            <Bar data = { data } />
        </div>

      </div>
    )
}

export default HistoryGraph

// Help debugging from ChatGPT