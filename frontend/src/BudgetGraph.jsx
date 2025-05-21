import React, { useState, useEffect, use } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Title,
    Tooltip,
    Legend, 
    Colors
} from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend, Colors); // Help from ChatGPT

function BudgetGraph({ budget, years}) {
    const [valid, setValid] = useState(false);
    const [refinedBudget, setRefinedBudget] = useState([]);
    const [refinedYears, setRefinedYears] = useState([]);

    const data = {
        labels: years,
        datasets: [
            {
                label: "Budget",
                data: budget,
                fill: true,
                backgroundColors: "rgba(75, 192, 192, 0.2)",
                borderColor: "rgba(75, 192, 192, 1)",
                color: "#36A2EB",
            }
        ]
    }

    return (
      <div>
        Allocated Budget Over the Years
        <div>
            <Line data = { data } />
        </div>
      </div>
    )
}

export default BudgetGraph;