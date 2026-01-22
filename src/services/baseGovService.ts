import axios, { AxiosInstance } from 'axios';
import { withRetry } from '../utils/retry';
import { logger } from '../utils/logger';

export interface Contract {
    id: number;
    contractingProcedureType: string;
    drPublicationDate: string;
    contractDesignation: string;
    basePrice: string;
    proposalDeadline: string;
    contractingEntity: string;
    type: string;
}

export interface SearchResult {
    total: number;
    items: Contract[];
}

export class BaseGovService {
    private client: AxiosInstance;
    private baseUrl = 'https://www.base.gov.pt/Base4/pt/resultados/';

    constructor() {
        this.client = axios.create({
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest',
                'Origin': 'https://www.base.gov.pt',
                'Referer': 'https://www.base.gov.pt/Base4/pt/pesquisa/?type=anuncios&texto=inform%C3%A1tica&numeroanuncio=&emissora=&desdedatapublicacao=&atedatapublicacao=&desdeprecobase=&ateprecobase=&tipoacto=0&tipomodelo=0&tipocontrato=0&cpv='
            }
        });
    }

    async searchContracts(query = "", page = 0, size = 25): Promise<SearchResult> {
        return withRetry(
            async () => {
                const payload = new URLSearchParams({
                    type: 'search_anuncios',
                    version: '131.0',
                    query: `texto=${encodeURIComponent(query)}&tipoacto=0&tipomodelo=0&tipocontrato=0`,
                    sort: '-drPublicationDate',
                    page: page.toString(),
                    size: size.toString()
                });

                logger.debug(`[BaseGovService] Searching: ${query} (Page ${page})`);

                const response = await this.client.post(this.baseUrl, payload.toString());

                // Validate response
                if (!response.data || !Array.isArray(response.data.items)) {
                    throw new Error('Invalid API response: unexpected format');
                }

                return response.data;
            },
            {
                maxAttempts: 4,
                initialDelay: 2000,
                maxDelay: 16000
            }
        );
    }
}
