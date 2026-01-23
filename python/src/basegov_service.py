"""
Serviço para comunicar com a API do BaseGov
Inclui retry automático e rate limiting
"""

import logging
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from typing import Dict, Any
from config import CONFIG

logger = logging.getLogger(__name__)


class BaseGovService:
    """Cliente HTTP para a API do base.gov.pt com retry automático"""

    def __init__(self):
        self.base_url = 'https://www.base.gov.pt/Base4/pt/resultados/'
        self.session = self._create_session()

    def _create_session(self) -> requests.Session:
        """Criar sessão HTTP com retry automático e headers correctos"""
        session = requests.Session()

        # Configurar retry strategy (built-in do urllib3!)
        retry_strategy = Retry(
            total=CONFIG['MAX_RETRIES'],
            backoff_factor=2,  # Exponential backoff: 2s, 4s, 8s, 16s
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["POST", "GET"]
        )

        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("https://", adapter)
        session.mount("http://", adapter)

        # Headers para mimificar browser Chrome
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
            'Origin': 'https://www.base.gov.pt',
            'Referer': 'https://www.base.gov.pt/Base4/pt/pesquisa/'
        })

        return session

    def search_contracts(self, query: str = "", page: int = 0, size: int = 25) -> Dict[str, Any]:
        """
        Procurar contratos na API do BaseGov

        Args:
            query: Termo de pesquisa
            page: Número da página (0-indexed)
            size: Resultados por página

        Returns:
            Dicionário com items, total, etc.
        """
        # Formato exato que a API espera (igual ao TypeScript)
        from urllib.parse import quote
        query_string = f"texto={quote(query)}&tipoacto=0&tipomodelo=0&tipocontrato=0"

        payload = {
            'type': 'search_anuncios',  # anuncios de contratos
            'version': '131.0',
            'query': query_string,  # NÃO 'text', mas 'query'!
            'sort': '-drPublicationDate',  # Mais recentes primeiro
            'page': str(page),
            'size': str(size)
        }

        logger.info(f"A procurar: '{query}' (Página {page})")

        try:
            response = self.session.post(
                self.base_url,
                data=payload,
                timeout=CONFIG['TIMEOUT']
            )

            # Raise exception se status 4xx ou 5xx
            response.raise_for_status()

            data = response.json()

            # Validar estrutura da resposta
            if not isinstance(data, dict) or 'items' not in data:
                raise ValueError(f"Resposta inválida da API: {data}")

            logger.debug(f"Página {page}: {len(data['items'])} contratos obtidos")
            return data

        except requests.exceptions.RequestException as e:
            logger.error(f"Erro ao comunicar com API: {e}")
            raise
        except ValueError as e:
            logger.error(f"Erro ao parsear resposta: {e}")
            raise
