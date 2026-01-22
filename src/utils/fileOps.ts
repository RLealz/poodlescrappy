import * as fs from 'fs';
import * as path from 'path';
import { logger } from './logger';

export class FileOperationError extends Error {
    constructor(message: string, public readonly originalError: unknown) {
        super(message);
        this.name = 'FileOperationError';
    }
}

export function safeWriteJSON(
    filePath: string,
    data: unknown,
    options: { atomic?: boolean } = {}
): void {
    try {
        const jsonString = JSON.stringify(data, null, 2);

        // Ensure directory exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        if (options.atomic) {
            // Atomic write: write to temp file then rename
            const tempPath = `${filePath}.tmp`;
            fs.writeFileSync(tempPath, jsonString, 'utf-8');
            fs.renameSync(tempPath, filePath);
            logger.info(`File saved (atomic): ${filePath}`);
        } else {
            fs.writeFileSync(filePath, jsonString, 'utf-8');
            logger.info(`File saved: ${filePath}`);
        }

    } catch (error: unknown) {
        if (error instanceof Error) {
            if ('code' in error) {
                const nodeError = error as NodeJS.ErrnoException;
                switch (nodeError.code) {
                    case 'ENOENT':
                        throw new FileOperationError(`Directory does not exist: ${filePath}`, error);
                    case 'EACCES':
                        throw new FileOperationError(`Permission denied: ${filePath}`, error);
                    case 'ENOSPC':
                        throw new FileOperationError(`Disk full: ${filePath}`, error);
                    default:
                        throw new FileOperationError(`Error writing file: ${nodeError.code}`, error);
                }
            }
        }
        throw new FileOperationError(`Unknown error writing file: ${filePath}`, error);
    }
}
