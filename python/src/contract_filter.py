"""
Sistema de filtragem e classificação de contratos
"""

import logging
import re
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


class ContractFilter:
    """Filtra e classifica contratos com base no perfil do utilizador"""

    def __init__(self, profile: Dict[str, Any]):
        self.keywords = [kw.lower() for kw in profile.get('keywords', [])]
        self.exclude_terms = [term.lower() for term in profile.get('excludeTerms', [])]
        self.min_price = profile.get('minPrice', 0)
        self.max_price = profile.get('maxPrice', float('inf'))

    def _parse_price(self, price_str: str) -> float:
        """
        Converter preço "75.000,00 €" para 75000.00
        """
        try:
            # Remover símbolo €, espaços, e converter formato PT para float
            cleaned = price_str.replace('€', '').replace(' ', '').strip()
            # Substituir separador de milhares (.) e decimal (,)
            cleaned = cleaned.replace('.', '').replace(',', '.')
            return float(cleaned)
        except (ValueError, AttributeError):
            return 0.0

    def _calculate_score(self, contract: Dict[str, Any]) -> int:
        """
        Calcular score de relevância baseado em keywords
        """
        designation = contract.get('contractDesignation', '').lower()
        entity = contract.get('contractingEntity', '').lower()

        score = 0

        # +10 pontos por cada keyword que apareça
        for keyword in self.keywords:
            if keyword in designation or keyword in entity:
                score += 10

        # Opcional: boost para contratos de maior valor
        # price = self._parse_price(contract.get('basePrice', '0'))
        # if price > 50000:
        #     score += 5

        return score

    def _should_exclude(self, contract: Dict[str, Any]) -> bool:
        """
        Verificar se o contrato contém termos de exclusão
        """
        designation = contract.get('contractDesignation', '').lower()

        for term in self.exclude_terms:
            if term in designation:
                return True

        return False

    def _matches_price_range(self, contract: Dict[str, Any]) -> bool:
        """
        Verificar se o preço está dentro do intervalo definido
        """
        price = self._parse_price(contract.get('basePrice', '0'))
        return self.min_price <= price <= self.max_price

    def filter_and_classify(self, contracts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Filtrar e classificar lista de contratos

        Returns:
            Lista de contratos relevantes, ordenados por score (maior primeiro)
        """
        results = []

        for contract in contracts:
            # Aplicar filtros de exclusão
            if self._should_exclude(contract):
                continue

            # Verificar preço
            if not self._matches_price_range(contract):
                continue

            # Calcular relevância
            score = self._calculate_score(contract)

            # Apenas manter se tem pelo menos alguma relevância
            if score > 0:
                contract['relevanceScore'] = score
                results.append(contract)

        # Ordenar por score (maior primeiro)
        results.sort(key=lambda x: x['relevanceScore'], reverse=True)

        logger.info(f"Filtrados {len(results)} contratos relevantes de {len(contracts)} totais")

        return results
