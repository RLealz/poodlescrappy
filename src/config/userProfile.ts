import { UserProfile } from '../services/contractFilter';

export const MY_PROFILE: UserProfile = {
    keywords: [
        'informática', 'software', 'desenvolvimento', 'web', 'plataforma',
        'app', 'digital', 'inteligência artificial', 'dados'
    ],
    minPrice: 5000,
    excludedTerms: ['limpeza', 'construção civil', 'manutenção predial']
};

export const CONFIG = {
    DAYS_TO_FETCH: 14,
    // Random delay range in milliseconds
    DELAY: {
        MIN: 2000,
        MAX: 5000
    }
};
