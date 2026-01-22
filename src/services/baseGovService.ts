import axios, { AxiosInstance } from 'axios';

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
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Origin': 'https://www.base.gov.pt',
                'Referer': 'https://www.base.gov.pt/Base4/pt/pesquisa/?type=anuncios&texto=inform%C3%A1tica&numeroanuncio=&emissora=&desdedatapublicacao=&atedatapublicacao=&desdeprecobase=&ateprecobase=&tipoacto=0&tipomodelo=0&tipocontrato=0&cpv=',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
    }

    async searchContracts(query = "", page = 0, size = 25): Promise<SearchResult> {
        try {
            // "type: search_anuncios" == anuncios de contratos
            // "type: search_contratos" == contratos
            const payload = new URLSearchParams({
                type: 'search_anuncios',
                version: '131.0',
                query: `texto=${encodeURIComponent(query)}&tipoacto=0&tipomodelo=0&tipocontrato=0`,
                sort: '-drPublicationDate',
                page: page.toString(),
                size: size.toString()
            });

            console.log(`[BaseGovService] Searching: ${query} (Page ${page})`);

            const response = await this.client.post(this.baseUrl, payload.toString());
            return response.data;

        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                console.error('API Error:', error.response?.status, error.response?.statusText);
            } else {
                console.error('Unexpected Error:', error);
            }
            throw error;
        }
    }
}
