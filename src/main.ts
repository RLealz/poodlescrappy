import { BaseGovService, Contract } from './services/baseGovService';
import { ContractFilter, UserProfile } from './services/contractFilter';
import * as fs from 'fs';

import { MY_PROFILE, CONFIG } from './config/userProfile';

// --- CONFIGURAÇÃO ---
// Perfil importado de ../config/userProfile.ts



// Lógica de atraso aleatório usando CONFIG
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const randomDelay = () => Math.floor(Math.random() * (CONFIG.DELAY.MAX - CONFIG.DELAY.MIN)) + CONFIG.DELAY.MIN;
// ---------------------

async function runWeeklyJob() {
    console.log("Starting Weekly BaseGov Job...");
    const service = new BaseGovService();
    const filter = new ContractFilter(MY_PROFILE);

    // Calcular intervalo de datas (Melhoria opcional: filtrar por data no código se a API não ajudar)
    // Por agora, procuramos termos gerais para apanhar cenas recentes,
    // mas a query da API no BaseGovService trata do "sort: -drPublicationDate".
    // Vamos sacar páginas suficientes para cobrir os últimos X dias.

    let allContracts: Contract[] = [];
    let page = 0;
    let keepFetching = true;

    // Limite de segurança: 20 páginas ~ 500 contratos
    while (keepFetching && page < 20) {
        const results = await service.searchContracts("informática", page, 25);
        if (results.items.length === 0) break;

        allContracts = allContracts.concat(results.items);

        // Verificar data do último item
        const lastItemDateStr = results.items[results.items.length - 1].drPublicationDate; // "DD-MM-YYYY"
        const [day, month, year] = lastItemDateStr.split('-').map(Number);
        const lastDate = new Date(year, month - 1, day);

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - CONFIG.DAYS_TO_FETCH);

        if (lastDate < cutoffDate) {
            keepFetching = false;
        }

        // Aplicar rate limiting antes da próxima página
        if (keepFetching) {
            const waitTime = randomDelay();
            console.log(`Waiting ${waitTime}ms...`);
            await delay(waitTime);
        }

        page++;
    }

    console.log(`Fetched ${allContracts.length} raw contracts.`);

    // Aplicar Filtro e Classificação
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

    // Guardar no ficheiro
    const reportData = JSON.stringify(relevantContracts, null, 2);
    fs.writeFileSync('weekly_report.json', reportData);
    console.log("Report saved to 'weekly_report.json'");
}

runWeeklyJob();
