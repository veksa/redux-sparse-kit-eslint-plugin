/**
 * Test fixture: an application module wrapping defineSegment with a function
 * of its own, the way an application adds its own bookkeeping to it.
 */
import { defineSegment as defineBase } from 'redux-sparse-kit';

export const defineSegment: typeof defineBase = (options) => defineBase(options);
