import React, {useState, useEffect} from 'react'
import "./AgencyCard.css";

function AgencyCard({ agency, wordCount, numChildren }) {
    const [ processedCount, setProcessedCount ] = useState("");

    useEffect(() => {
        setProcessedCount(Number(wordCount).toLocaleString());
    }, [wordCount]); // useEffect specific implementation from chatgpt and all of localstring + number logic from chatgpt

    return (
      <div>
          <h2>{ agency }</h2>
          <div>{ processedCount } words</div>
          <div>{ numChildren } subagencies</div>
      </div>
    )
}

export default AgencyCard;

// debugging help from chatgpt, basic logic written by me, processedCount in div from chatgpt