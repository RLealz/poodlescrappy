#!/usr/bin/env python3
"""
PoodleScrappy - Python Implementation
Scraper automático para contratos públicos portugueses
"""

import logging
import json
import time
import random
import sys
from datetime import datetime, timedelta
from typing import List, Dict, Any

from basegov_service import BaseGovService
from contract_filter import ContractFilter
from config import MY_PROFILE, CONFIG


# Configurar logging (built-in do Python!)
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

logger = logging.getLogger(__name__)


def random_delay():
    """Atraso aleatório entre MIN e MAX (em milissegundos)"""
    delay_ms = random.randint(CONFIG['DELAY']['MIN'], CONFIG['DELAY']['MAX'])
    delay_s = delay_ms / 1000.0
    time.sleep(delay_s)
    return delay_ms


def parse_date(date_str: str) -> datetime:
    """Converter 'DD-MM-YYYY' para datetime"""
    day, month, year = map(int, date_str.split('-'))
    return datetime(year, month, day)


def run_weekly_job():
    """Job principal: scraping e filtragem de contratos"""

    logger.info("=" * 60)
    logger.info("  PoodleScrappy - Job Semanal Iniciado")
    logger.info("=" * 60)

    service = BaseGovService()
    filter_engine = ContractFilter(MY_PROFILE)

    all_contracts: List[Dict[str, Any]] = []
    consecutive_errors = 0
    max_consecutive_errors = 3

    cutoff_date = datetime.now() - timedelta(days=CONFIG['DAYS_TO_FETCH'])
    logger.info(f"A procurar contratos desde: {cutoff_date.strftime('%d-%m-%Y')}")

    try:
        page = 0
        keep_fetching = True

        while keep_fetching and page < CONFIG['MAX_PAGES']:
            try:
                # Obter página de resultados (com retry automático!)
                results = service.search_contracts("informática", page, CONFIG['PAGE_SIZE'])

                # Reset do contador de erros em caso de sucesso
                consecutive_errors = 0

                items = results.get('items', [])

                if not items:
                    logger.info("Sem mais resultados. A terminar pesquisa.")
                    break

                all_contracts.extend(items)
                logger.info(f"Página {page}: {len(items)} contratos obtidos (total: {len(all_contracts)})")

                # Verificar data do último item
                last_item = items[-1]
                last_date = parse_date(last_item['drPublicationDate'])

                if last_date < cutoff_date:
                    logger.info(f"Atingido limite de data ({last_date.strftime('%d-%m-%Y')}). A terminar.")
                    keep_fetching = False

                # Rate limiting antes da próxima página
                if keep_fetching and page < CONFIG['MAX_PAGES'] - 1:
                    delay_ms = random_delay()
                    logger.debug(f"A aguardar {delay_ms}ms antes da próxima página...")

                page += 1

            except Exception as e:
                consecutive_errors += 1
                logger.error(f"Erro ao obter página {page}: {e}", exc_info=True)

                if consecutive_errors >= max_consecutive_errors:
                    logger.error("Demasiados erros consecutivos. A abortar job.")
                    raise

                # Se já temos alguns contratos, continuar com o que temos
                if all_contracts:
                    logger.warning(f"A continuar com {len(all_contracts)} contratos obtidos até agora.")
                    break
                else:
                    raise  # Se não temos nada, falhar

        logger.info(f"Total de contratos brutos obtidos: {len(all_contracts)}")

        # Aplicar filtros e classificação
        relevant_contracts = filter_engine.filter_and_classify(all_contracts)

        # Output para consola
        print("\n" + "=" * 70)
        print(f"    RELATÓRIO SEMANAL ({len(relevant_contracts)} Correspondências)")
        print("=" * 70 + "\n")

        for idx, contract in enumerate(relevant_contracts, 1):
            print(f"#{idx} [Score: {contract['relevanceScore']}] {contract['basePrice']}")
            print(f"   {contract['contractDesignation']}")
            print(f"   Entidade: {contract['contractingEntity']}")
            print(f"   Data: {contract['drPublicationDate']}")
            print(f"   Link: https://www.base.gov.pt/Base4/pt/detalhe/?type=contratos&id={contract['id']}")
            print()

        # Guardar relatório em JSON
        output_file = 'weekly_report.json'
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(relevant_contracts, f, indent=2, ensure_ascii=False)
            logger.info(f"✓ Relatório guardado: {output_file}")
        except IOError as e:
            # Fallback para localização temporária
            fallback_file = f'/tmp/weekly_report_{int(time.time())}.json'
            logger.warning(f"Erro ao guardar em {output_file}: {e}")
            logger.warning(f"A tentar localização alternativa: {fallback_file}")
            with open(fallback_file, 'w', encoding='utf-8') as f:
                json.dump(relevant_contracts, f, indent=2, ensure_ascii=False)
            logger.info(f"✓ Relatório guardado: {fallback_file}")

        logger.info("=" * 60)
        logger.info("  Job Semanal Concluído com Sucesso")
        logger.info("=" * 60)

        return 0

    except Exception as e:
        logger.error("=" * 60)
        logger.error("  Job Semanal FALHOU")
        logger.error("=" * 60)
        logger.error(f"Erro fatal: {e}", exc_info=True)
        return 1


if __name__ == "__main__":
    try:
        exit_code = run_weekly_job()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        logger.warning("Job interrompido pelo utilizador (Ctrl+C)")
        sys.exit(130)
