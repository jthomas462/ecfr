# ecfr

I calculated word count, number of subagencies, budget, and historical changes over time. I calculated word count by finding all CFR references for a given agency, taking the XML, and extracting all text from the P tags. Especially for budget and historical changes, some data may be missing. For budget, I used a different API and it was difficult to find data from that API using the eCFR one. My tech stack was Supabase, Vercel, Vite, and React. I populated the Supabase database with all the data so that I could have almost constant lookup time, instead of fetching through a chain of API requests, which takes a long time and is very slow.

To start up, create a Supabase account and create a schema:
```
agency
1. id: int8
2. name: text
3. abbreviation: text

budget
1. id: int8
2. agency_id: int8 (foreign key)
3. year: int8
4. budget: float8

cfr
1. id: int8
2. title: varchar
3. subtitle: varchar
4. chapter: varchar
5. subchapter: varchar
6. part: varchar
7. subpart: varchar
8. section: varchar
9. subsection: varchar
10. appendix: varchar
11. agency_id: int8 (foreign key -> agency)
    
children
1. id: int8
2. name: varchar
3. agency_id: int8 (foreign key -> agency)

history
1. id: int8
2. num_changes: int8
3. agency_id: int8 (foreign key -> agency)
4. date: date

wordcount
1. id: int8
2. wordcount: int8
3. agency_id: int8 (foreign key -> agency)
   ```

You need to have your own Public API key, Private API Key, and URL to create your own databases. Otherwise, I can give you my credentials for this upon request.

--

Next, change directory to backend and initialize it (node)
```
npm init -y
```
Run populating.js to populate the tables
```
node populating.js
```
--

Next, change directory to frontend and initialize it with React and Vite
```
npm create vite@latest {name of app}
```
Source: https://www.geeksforgeeks.org/how-to-set-up-a-vite-project/

Select React and JavaScript when prompted.

Follow the directions given by Vite to run the app.

Enjoy and contact me if you have questions.
