import { documentTypes } from './registry.js';
import { governingDocType } from './types/governing.js';
import { motionDocType } from './types/motion.js';
import { proseDocType } from './types/prose.js';
import { contractDocType } from './types/contract.js';

// Register all document types
documentTypes.register(governingDocType);
documentTypes.register(motionDocType);
documentTypes.register(proseDocType);
documentTypes.register(contractDocType);

// Export registry and types
export { documentTypes } from './registry.js';
export type { DocumentTypeConfig } from './registry.js';
export { governingDocType, getSeniorityName, getSeniorityVariant } from './types/governing.js';
export { motionDocType } from './types/motion.js';
export { proseDocType } from './types/prose.js';
export { contractDocType } from './types/contract.js';
