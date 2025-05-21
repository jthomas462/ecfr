import './App.css'
import supabase from './supabase-client.js';
import AgencyCard from './AgencyCard.jsx';
import BudgetGraph from './BudgetGraph.jsx';
import HistoryGraph from './HistoryGraph.jsx';
// import TitleCard from './TitleCard.jsx';
import { useState, useEffect } from 'react'

function App() {
  const [names, setNames] = useState([]);
  const [agency, setAgency] = useState("");
  const [agencyId, setAgencyId] = useState(0);
  const [numChildren, setNumChildren] = useState(0);
  const [wordCount, setWordCount] = useState("");
  const [budget, setBudget] = useState([]);
  const [years, setYears] = useState([]);
  const [dates, setDates] = useState([]);
  const [historicalChanges, setHistoricalChanges] = useState([]);

  const handleAgencyChange = (e) => {
    setAgency(e.target.value);
  }

  useEffect(() => {
    const getNames = async () => {
      const { data, error } = await supabase.from('agency').select();
      setNames(data.map(agency => agency.name));
    }

    getNames();
  }, []);

  useEffect(() => {
    const getAgencyId = async () => {
      if (!agency) return;
      const { data, error } = await supabase.from('agency').select('id').eq('name', agency);
      setAgencyId(data[0].id);
    }

    

    getAgencyId();
  }, [agency]);

  useEffect(() => {

    const getWordCount = async () => {
      if (!agency) return;
      const { data, error } = await supabase.from('wordcount').select('wordcount').eq('agency_id', agencyId);
      if (data.length !== 0) {
        setWordCount(data[0].wordcount.toString());
      } else {
        setWordCount("Unavailable");
      }
    }

    const getSubAgencies = async () => {
      if (!agency) return;
      const { data, count, error } = await supabase.from('children').select('*', {count : 'exact'}).eq('agency_id', agencyId);
      setNumChildren(count);
    }

    const getBudget = async () => {
      if (!agency) return;
      const { data, error } = await supabase.from('budget').select('*').eq('agency_id', agencyId).order('year', { ascending: true});
      setBudget(data.map(b => b.budget));
      setYears(data.map(yr => yr.year));
    }

    const getHistory = async () => {
      if (!agency) return;
      const { data, error } = await supabase.from('history').select('*').eq('agency_id', agencyId).order('date', { ascending: true});
      setDates(data.map(d => d.date));
      setHistoricalChanges(data.map(c => c.num_changes));
    }

    getWordCount();
    getSubAgencies();
    getBudget();
    getHistory();

  }, [agencyId]);


  return (
    <>
      <div className = 'titleCard'>
        <h1>eCFR Analyzer</h1>
        <p>Find out the budget, word count, subagencies, and more of different gov. agencies</p>
        <select className = 'select' value = {agency} onChange = {handleAgencyChange} placeholder = 'Select an Agency'>
          <option value="" disabled hidden>
            Select an agency
          </option>
          {names.map(name => (
            <option key = {name} value = {name}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <hr/>
      { agency ? (
          <AgencyCard agency = { agency } wordCount = { wordCount } numChildren={ numChildren }/>
        ) : (
          <div></div>
        )}
      <div className = "container">
        {/* <div className = "agency">
          hi
        </div>
        <div className = "budget">
          yo
        </div>
        <div className = "history">
          story
        </div> */}
        
        { budget.length !== 0 ? (
          <BudgetGraph budget = { budget } years = {years}/>
        ) : (
          <div></div>
        )}
        { historicalChanges.length !== 0 ? (
          <HistoryGraph historicalChanges={ historicalChanges } dates = {dates} />
        ) : (
          <div></div>
        )}
      </div>

      
      
          
          
        
    </>
  )
}

export default App

// logic fixing help from ChatGPT
