import { BaseGovService, Contract } from './services/baseGovService';
import { ContractFilter } from './services/contractFilter';
import { MY_PROFILE, CONFIG } from './config/userProfile';
import { logger } from './utils/logger';
import { safeWriteJSON, FileOperationError } from './utils/fileOps';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const randomDelay = () => Math.floor(Math.random() * (CONFIG.DELAY.MAX - CONFIG.DELAY.MIN)) + CONFIG.DELAY.MIN;

async function runWeeklyJob() {
    logger.info('=== Início do BaseGov Job Semanal ===');

    const service = new BaseGovService();
    const filter = new ContractFilter(MY_PROFILE);

    let allContracts: Contract[] = [];
    let page = 0;
    let keepFetching = true;
    let consecutiveErrors = 0;
    const MAX_CONSECUTIVE_ERRORS = 3;

    try {
        while (keepFetching && page < 20) {
            try {
                const results = await service.searchContracts("informática", page, 25);

                // Reset error counter em caso de sucesso
                consecutiveErrors = 0;

                if (results.items.length === 0) {
                    logger.info('Sem mais resultados. A terminar pesquisa.');
                    break;
                }

                allContracts = allContracts.concat(results.items);
                logger.info(`Página ${page}: ${results.items.length} contratos obtidos`);

                // Verificar data do último item
                const lastItemDateStr = results.items[results.items.length - 1].drPublicationDate;
                const [day, month, year] = lastItemDateStr.split('-').map(Number);
                const lastDate = new Date(year, month - 1, day);

                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - CONFIG.DAYS_TO_FETCH);

                if (lastDate < cutoffDate) {
                    logger.info('Atingido limite de data. A terminar pesquisa.');
                    keepFetching = false;
                }

                // Rate limiting antes da próxima página
                if (keepFetching) {
                    const waitTime = randomDelay();
                    logger.debug(`A aguardar ${waitTime}ms antes da próxima página...`);
                    await delay(waitTime);
                }

                page++;

            } catch (error: unknown) {
                consecutiveErrors++;
                logger.error(`Erro ao obter página ${page}`, error);

                if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                    logger.error('Demasiados erros consecutivos. A abortar job.');
                    throw new Error('Máximo de erros consecutivos atingido');
                }

                // Se temos alguns contratos, continuar com o que temos
                if (allContracts.length > 0) {
                    logger.warn(`Continuando com ${allContracts.length} contratos obtidos até agora.`);
                    break;
                } else {
                    throw error;  // Se não temos nada, falhar
                }
            }
        }

        logger.info(`Total de contratos obtidos: ${allContracts.length}`);

        // Aplicar filtros
        const relevantContracts = filter.filterAndClassify(allContracts);

        logger.info(`Contratos relevantes após filtros: ${relevantContracts.length}`);

        // Output para consola
        console.log(`\n${'='.repeat(50)}`);
        console.log(`    RELATÓRIO SEMANAL (${relevantContracts.length} Correspondências)`);
        console.log(`${'='.repeat(50)}\n`);

        relevantContracts.forEach((c, idx) => {
            console.log(`#${idx + 1} [Score: ${c.relevanceScore}] ${c.basePrice}`);
            console.log(`   ${c.contractDesignation}`);
            console.log(`   Entidade: ${c.contractingEntity}`);
            console.log(`   Data: ${c.drPublicationDate}`);
            console.log(`   Link: https://www.base.gov.pt/Base4/pt/detalhe/?type=contratos&id=${c.id}`);
            console.log('');
        });

        // Guardar relatório com operação segura
        try {
            safeWriteJSON('weekly_report.json', relevantContracts, { atomic: true });
            logger.info('✓ Relatório guardado com sucesso');
        } catch (error: unknown) {
            if (error instanceof FileOperationError) {
                logger.error('Erro ao guardar relatório', error.originalError);
                // Tentar guardar em localização alternativa
                const fallbackPath = `/tmp/weekly_report_${Date.now()}.json`;
                logger.warn(`A tentar guardar em localização alternativa: ${fallbackPath}`);
                safeWriteJSON(fallbackPath, relevantContracts);
            } else {
                throw error;
            }
        }

        logger.info('=== Job Semanal Concluído com Sucesso ===');
        process.exit(0);

    } catch (error: unknown) {
        logger.error('=== Job Semanal Falhou ===', error);
        process.exit(1);
    }
}

// Tratar sinais de interrupção
process.on('SIGINT', () => {
    logger.warn('Job interrompido pelo utilizador (SIGINT)');
    process.exit(130);
});

process.on('SIGTERM', () => {
    logger.warn('Job terminado pelo sistema (SIGTERM)');
    process.exit(143);
});

// Tratar erros não capturados
process.on('unhandledRejection', (reason: unknown) => {
    logger.error('Promise rejeitada não tratada', reason);
    process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
    logger.error('Exceção não capturada', error);
    process.exit(1);
});

runWeeklyJob();
