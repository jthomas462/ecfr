import supabase from "./supabase-client.js";
import { DOMParser } from "@xmldom/xmldom";
import { XMLParser } from "fast-xml-parser";
import xpath from "xpath";
import fs from "fs";
import pLimit from 'p-limit';
import * as cheerio from 'cheerio';

const response = await fetch("https://www.ecfr.gov/api/admin/v1/agencies.json");
const data = await response.json();
const agencies = data.agencies;

const limit = pLimit(5);

async function processAgency(agency) {
    try {
        const agency_name = agency["name"];
        console.log(agency_name);
        let agency_abbreviation = agency["short_name"];
        const agency_slug = agency["slug"];

        const cfr_references = agency["cfr_references"] ?? [];
        const agencyId = await insertAgencies(agency_name, agency_abbreviation);
        const children = agency["children"] ?? [];

        await Promise.all(children.map(child =>
            insertChildren(child["name"], agencyId)
        ));

        await Promise.all(cfr_references.map(ref =>
            insertCFR(
                ref.title ?? null,
                ref.subtitle ?? null,
                ref.chapter ?? null,
                ref.subchapter ?? null,
                ref.part ?? null,
                ref.subpart ?? null,
                ref.section ?? null,
                ref.appendix ?? null,
                agencyId
            )
        ));

        console.log("Populating budget...");
        await getBudgetOverTime(agency_name, agency_abbreviation, agencyId);

        console.log("Populating history...");
        await getHistoricalChanges(agency_name, null, null, agency_slug, agencyId);

        console.log("Populating word count...");
        await getTotalWordCount(agency_name, cfr_references, agencyId);

        console.log("✅ Done with " + agency_name + "\n");

    } catch (err) {
        console.error("❌ Error processing agency:", agency["name"], err);
    }
}

// Use limit to throttle concurrent processing
await Promise.all(agencies.map(agency => limit(() => processAgency(agency))));
// Promise, processAgency, and anything limit related from ChatGPT

async function insertAgencies (name, abbreviation) {
    const { data, error } = await supabase
    .from('agency')
    .insert([
        {  name: name, abbreviation: abbreviation }
    ])
    .select();
    return data[0].id;
}

async function insertChildren (name, agencyId) {
    const { child_data, child_error } = await supabase
        .from('children')
        .insert({ name: name, agency_id: agencyId}).select()
}

async function insertCFR (rtitle, rsubtitle, rchapter, rsubchapter, rpart, rsubpart, rsection, rappendix, agencyId) {
    const { cfr_data, cfr_error } = await supabase
    .from('cfr')
    .insert([{
        title: rtitle, subtitle: rsubtitle, chapter: rchapter, subchapter: rsubchapter, part: rpart, subpart: rsubpart, section: rsection, appendix: rappendix, agency_id: agencyId
    }]).select();
}

async function getIDFromAbbr(abbr) {
    let id;
    try {
        const response = await fetchWithExponentialBackoff("https://api.usaspending.gov/api/v2/references/toptier_agencies/");
        // const data = await response.json();
        const results = response.results;
        results.forEach(res => {
            if (res.abbreviation === abbr) {
                id = res.agency_id;
            }
        });
    } catch (err) {
        console.error("Something went wrong trying to find abbreviation: ", err);
    }
    return id;
}

async function getBudgetOverTime(name, abbreviation, agencyId) {
    let budget = [];
    let years = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
    try {
        let id = await getIDFromAbbr(abbreviation);
        if (id) {
            for (const year of years) {
                let url = await buildURLBudget(year, id);
                const response = await fetchWithExponentialBackoff(url);
                // const data = await response.json();
                let budgetAmt;
                if (response.results.length == 0) {
                    budgetAmt = 0;
                } else {
                    budgetAmt = response.results[0].budget_authority_amount;
                }
                const { budget_data, budget_error } = await supabase
                .from('budget')
                .insert({ agency_id: agencyId, year: year, budget: budgetAmt}).select()
            }
        }
        
    } catch (err) {
        console.error("Something went wrong when fetching budget details: ", err);
    }
    return [years, budget];
}

async function buildURLBudget(year, id) {
    const baseUrl = "https://api.usaspending.gov/api/v2/financial_balances/agencies/";
    const url = new URL(baseUrl);
    url.searchParams.append("fiscal_year", year);
    url.searchParams.append("funding_agency_id", id);
    return url.toString();
}

async function getHistoricalChanges(name, startDate, endDate, slug, agencyId) {
    let timesInOrder = [];
    let correspondingCounts = [];
    try {
        let url = await buildUrlHistory(name, startDate, endDate, slug)
        const response = await fetchWithExponentialBackoff(url);
        const sortedKeys = Object.keys(response.dates)
        sortedKeys.forEach(async time => {
            const { timeData, error } = await supabase.from('history').insert([
            { num_changes: response.dates[time], agency_id: agencyId, date: time }
            ]).select();
        }) // forEach function had some help from ChatGPT
    } catch (error) {
        console.error('Something went wrong fetching historical changes: ', error);
    }
    return [timesInOrder, correspondingCounts];
}

// Helper
async function buildUrlHistory(name, startDate, endDate, slug) {
    const baseUrl = "https://www.ecfr.gov/api/search/v1/counts/daily";
    const url = new URL(baseUrl);
    // Add agency slug
    url.searchParams.append("agency_slugs[]", slug);
    // Conditionally add date filters
    if (startDate) {
      url.searchParams.append("last_modified_after", startDate);
    }

    if (endDate) {
      url.searchParams.append("last_modified_before", endDate);
    }

    return url.toString();
}
// method from ChatGPT

async function buildURLXML(date, title, subtitle, chapter, subchapter, part, subpart, section, appendix) {
    const baseUrl = "https://www.ecfr.gov/api/versioner/v1/full/" + date + "/title-" + title + ".xml";
    const newUrl = new URL(baseUrl);
    if (subtitle) { newUrl.searchParams.append("subtitle", subtitle); }
    if (chapter) { newUrl.searchParams.append("chapter", chapter); }
    if (subchapter) { newUrl.searchParams.append("subchapter", subchapter); }
    if (part) { newUrl.searchParams.append("part", part); }
    if (subpart) { newUrl.searchParams.append("subpart", subpart); }
    if (section) { newUrl.searchParams.append("section", section); }
    if (appendix) { newUrl.searchParams.append("appendix", appendix); }
    // console.log(newUrl);
    return newUrl.toString();     
}

// Helper
async function getXML(title, subtitle, chapter, subchapter, part, subpart, section, appendix) {
    let wordList = [];

    try {
        let date = await getDate(title);
        const url = await buildURLXML(date, title, subtitle, chapter, subchapter, part, subpart, section, appendix);
        const response = await fetch(url);
        const text = await response.text();

        try {
            const xmlDoc = new DOMParser().parseFromString(text, "text/xml");
            const paragraphs = xmlDoc.getElementsByTagName("P");
            for (let i = 0; i < paragraphs.length; i++) {
                wordList.push(...paragraphs[i].textContent.trim().split(/\s+/));
            }
        } catch (xmlErr) {
            console.warn("⚠️ XML parsing failed. Falling back to HTML parsing.");
            const $ = cheerio.load(text);
            $("p").each((_, el) => {
                const paragraphText = $(el).text();
                wordList.push(...paragraphText.trim().split(/\s+/));
            });
        }
        // Help from GPT for parsing after failing

    } catch (err) {
        console.error("❌ Error fetching or parsing document:", err);
    }

    return wordList;
}
// Method from ChatGPT

// Helper
async function getDate(titleNum) {
    let date = "";
    try {
        const titleResponse = await fetchWithExponentialBackoff("https://www.ecfr.gov/api/versioner/v1/titles.json");
        // const titleData = await titleResponse.json();
        const titles = titleResponse.titles;
        date = titles[titleNum - 1].up_to_date_as_of;
        if (date === null) {
            date = "2025-05-15";
        }
    } catch (err) {
        console.error("Something went wrong while getting date: ", err);
    }
    return date;
}

async function getTotalWordCount(name, cfr_references, agencyId) {
    // Loop through all CFR refs, get XMLs, and then calculate word counts, and sum together
    // Do the same with children
    let wordCount = 0;
    try {
        // get CFR Refs
        for (const ref of cfr_references) // Help from ChatGPT
        {
            let text = await getXML(ref.title ?? null, 
                ref.subtitle ?? null, 
                ref.chapter ?? null, 
                ref.part ?? null, 
                ref.subpart ?? null, 
                ref.section ?? null, 
                ref.appendix ?? null);
            wordCount += text.length;
        }
        console.log("Word Count: ", wordCount);
        const { data, error } = await supabase
        .from('wordcount')
        .insert([
            {  wordcount: wordCount, agency_id: agencyId }
        ])
        .select();
    } catch (err) {
        console.error("Something went wrong while getting total word count: ", err);
    }
    return wordCount
}

function fetchWithExponentialBackoff(url, retries = 5, delay = 1000) {
  return new Promise((resolve, reject) => {
    const attemptFetch = (attempt) => {
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(data => resolve(data))
        .catch((error) => {
          if (attempt < retries) {
            const backoffTime = delay * Math.pow(2, attempt);  // Exponential backoff
            console.log(`Attempt ${attempt} failed, retrying in ${backoffTime / 1000}s...`);
            setTimeout(() => attemptFetch(attempt + 1), backoffTime);
          } else {
            reject(`Failed after ${retries} attempts: ${error.message}`);
          }
        });
    };

    attemptFetch(1);
  });
}
// From ChatGPT completely