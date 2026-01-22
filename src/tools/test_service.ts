import { BaseGovService } from '../services/baseGovService';

async function main() {
    const service = new BaseGovService();
    console.log("Testing BaseGovService...");

    try {
        const results = await service.searchContracts("informática", 0, 5);
        console.log(`\nFound ${results.total} results.`);
        console.log("First 5 items:");
        results.items.forEach(item => {
            console.log(`[${item.drPublicationDate}] ${item.contractDesignation.substring(0, 50)}... (${item.basePrice})`);
        });
    } catch (err) {
        console.error("Test failed:", err);
    }
}

main();
