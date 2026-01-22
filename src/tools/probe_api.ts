import axios from 'axios';
import * as fs from 'fs';
import * as cheerio from 'cheerio';

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";
const TARGET_URL = 'https://www.base.gov.pt/Base4/pt/pesquisa/';

async function inspectFrontend() {
    console.log(`Fetching ${TARGET_URL}...`);
    try {
        const response = await axios.get(TARGET_URL, {
            headers: { 'User-Agent': UA }
        });

        console.log(`Status: ${response.status}`);
        const html = response.data;

        // Guardar HTML para referência futura se for preciso
        fs.writeFileSync('base_search.html', html);
        console.log("Saved HTML to base_search.html");

        const $ = cheerio.load(html);
        const scripts: string[] = [];

        $('script').each((i, el) => {
            const src = $(el).attr('src');
            if (src) {
                scripts.push(src);
            }
        });

        console.log("\nFound Scripts:");
        scripts.forEach(s => console.log(`- ${s}`));

    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(`Error: ${error.message}`);
        } else {
            console.error(`Unknown Error: ${String(error)}`);
        }
    }
}

inspectFrontend();
