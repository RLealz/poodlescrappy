import { Contract } from './baseGovService';

export interface UserProfile {
    keywords: string[];
    minPrice?: number;
    maxPrice?: number;
    excludedTerms?: string[];
}

export interface ClassifiedContract extends Contract {
    relevanceScore: number;
    matchedKeywords: string[];
}

export class ContractFilter {
    private profile: UserProfile;

    constructor(profile: UserProfile) {
        this.profile = profile;
    }

    public filterAndClassify(contracts: Contract[]): ClassifiedContract[] {
        return contracts
            .filter(c => this.passesHardFilters(c))
            .map(c => this.classify(c))
            .filter(c => c.relevanceScore > 0) // Isto pode ser chato - mantém apenas os que têm pelo menos um ponto
            .sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    private passesHardFilters(contract: Contract): boolean {
        // Separar o preço "75.000,00 €" -> 75000.00
        const priceStr = contract.basePrice.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '');
        const price = parseFloat(priceStr);

        if (this.profile.minPrice && price < this.profile.minPrice) return false;
        if (this.profile.maxPrice && price > this.profile.maxPrice) return false;

        if (this.profile.excludedTerms && this.profile.excludedTerms.some(term =>
            contract.contractDesignation.toLowerCase().includes(term.toLowerCase()))) {
            return false;
        }

        return true;
    }

    private classify(contract: Contract): ClassifiedContract {
        const text = contract.contractDesignation.toLowerCase();
        const matches: string[] = [];
        let score = 0;

        for (const keyword of this.profile.keywords) {
            if (text.includes(keyword.toLowerCase())) {
                matches.push(keyword);
                score += 10; // Pontos base para correspondência de keywords
            }
        }

        // Mais guita vale mais pontos (log opcional)
        // const price = parseFloat(contract.basePrice.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, ''));
        // if (price > 50000) score += 5;

        return {
            ...contract,
            relevanceScore: score,
            matchedKeywords: matches
        };
    }
}
