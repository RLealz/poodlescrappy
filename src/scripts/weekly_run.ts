import { BaseGovService } from '../services/baseGovService';
import { ContractFilter, UserProfile } from '../services/contractFilter';
import * as fs from 'fs';

// --- CONFIGURATION ---
const MY_PROFILE: UserProfile = {
    keywords: [
        'informática', 'software', 'desenvolvimento', 'web', 'plataforma',
        'app', 'digital', 'inteligência artificial', 'dados'
    ],
    minPrice: 5000,
    excludedTerms: ['limpeza', 'construção civil', 'manutenção predial']
};

const DAYS_TO_FETCH = 14;
// ---------------------

async function runWeeklyJob() {
    console.log("Starting Weekly BaseGov Job...");
    const service = new BaseGovService();
    const filter = new ContractFilter(MY_PROFILE);

    // Calculate date range (Optional improvement: filter by date in code if API doesn't support strict ranges well)
    // For now, we search for a broad term or empty string to get recent stuff, 
    // but the API query in BaseGovService handles "sort: -drPublicationDate".
    // We will fetch enough pages to cover the last X days.

    let allContracts: any[] = [];
    let page = 0;
    let keepFetching = true;

    // Safety limit: 20 pages ~ 500 contracts
    while (keepFetching && page < 20) {
        const results = await service.searchContracts("informática", page, 25);
        if (results.items.length === 0) break;

        allContracts = allContracts.concat(results.items);

        // Check date of last item
        const lastItemDateStr = results.items[results.items.length - 1].drPublicationDate; // "DD-MM-YYYY"
        const [day, month, year] = lastItemDateStr.split('-').map(Number);
        const lastDate = new Date(year, month - 1, day);

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - DAYS_TO_FETCH);

        if (lastDate < cutoffDate) {
            keepFetching = false;
        }

        page++;
    }

    console.log(`Fetched ${allContracts.length} raw contracts.`);

    // Apply Filter & Classification
    const relevantContracts = filter.filterAndClassify(allContracts);

    console.log(`\n----------------------------------------`);
    console.log(`    WEEKLY REPORT (${relevantContracts.length} Matches)`);
    console.log(`----------------------------------------\n`);

    relevantContracts.forEach((c, idx) => {
        console.log(`#${idx + 1} [Score: ${c.relevanceScore}] ${c.basePrice}`);
        console.log(`   ${c.contractDesignation}`);
        console.log(`   Entity: ${c.contractingEntity}`);
        console.log(`   Date: ${c.drPublicationDate} | Link: https://www.base.gov.pt/Base4/pt/detalhe/?type=contratos&id=${c.id}`); // ID might need adjustment for detail link
        console.log('');
    });

    // Save to file
    const reportData = JSON.stringify(relevantContracts, null, 2);
    fs.writeFileSync('weekly_report.json', reportData);
    console.log("Report saved to 'weekly_report.json'");
}

runWeeklyJob();
