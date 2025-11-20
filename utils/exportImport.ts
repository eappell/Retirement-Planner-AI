import { validateAssetDefaults } from './assetValidation';

export function buildExport(scenariosState: any, assetAssumptionDefaults: any) {
    return {
        scenariosState,
        appSettings: { assetAssumptionDefaults }
    };
}

export function parseUpload(parsed: any) {
    // Accept wrapped format or legacy ScenariosState
    if (!parsed) throw new Error('Invalid upload');
    if (parsed.scenariosState) {
        const assetDefaults = parsed.appSettings?.assetAssumptionDefaults;
        const issues = validateAssetDefaults(assetDefaults);
        return { type: 'wrapped', scenariosState: parsed.scenariosState, assetDefaults, issues };
    }
    if (parsed.scenarios && typeof parsed.activeScenarioId !== 'undefined') {
        return { type: 'legacy', scenariosState: parsed };
    }
    throw new Error('Unknown upload format');
}

export default { buildExport, parseUpload };
