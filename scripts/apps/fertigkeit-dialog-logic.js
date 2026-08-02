const LEGACY_MESSAGE_MODES = {
    publicroll: 'public',
    selfroll: 'self',
    gmroll: 'gm',
    blindroll: 'blind',
};

/**
 * Convert legacy roll mode values into a Foundry V14 chat message mode.
 *
 * @param {string | undefined | null} mode The selected or stored roll mode.
 * @param {object} availableModes Foundry's CONFIG.ChatMessage.modes registry.
 * @returns {string} A supported message mode, falling back to public.
 */
export function normalizeMessageMode(mode, availableModes = {}) {
    const normalizedMode = LEGACY_MESSAGE_MODES[mode] || mode;

    return Object.hasOwn(availableModes, normalizedMode) ? normalizedMode : 'public';
}
