/**
 * Petition system - public API
 * 
 * This module provides functions for managing petitions and their signatures.
 */

// Re-export types
export type {
	Petition,
	PetitionSignature,
	PetitionWithSignatures,
} from './types.js';

// Re-export query functions
export {
	getPetitionByUuid,
	listPetitions,
	getSignatureCount,
	hasSignedPetition,
} from './queries.js';

// Re-export mutation functions
export {
	createPetition,
	signPetition,
	unsignPetition,
	respondToPetition,
	withdrawPetition,
} from './mutations.js';
