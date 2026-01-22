"""
Configuração do PoodleScrappy
"""

from typing import List, Dict

# Perfil do utilizador
MY_PROFILE: Dict = {
    "keywords": ["informática", "software", "desenvolvimento", "IT", "tecnologia"],
    "excludeTerms": ["mobiliário", "limpeza"],
    "minPrice": 5000.0,
    "maxPrice": 500000.0
}

# Configuração do job
CONFIG: Dict = {
    "DAYS_TO_FETCH": 14,
    "DELAY": {
        "MIN": 2000,  # milissegundos
        "MAX": 5000
    },
    "MAX_PAGES": 20,
    "PAGE_SIZE": 25,
    "MAX_RETRIES": 4,
    "TIMEOUT": 30  # segundos
}
