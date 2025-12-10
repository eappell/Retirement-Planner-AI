// Wrapper that re-exports the CommonJS implementation from `lib/insights.cjs`
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
export default require('../lib/insights.cjs');
