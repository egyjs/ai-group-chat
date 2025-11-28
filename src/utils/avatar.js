const AVATAR_BACKGROUNDS_LIGHT = [
    'E0F2FE', // soft sky
    'DCFCE7', // soft green
    'FEF3C7', // warm yellow
    'FFEDD5', // peach
    'EDE9FE', // lavender
    'FCE7F3', // blush
    'FFE4E6', // rose
];

const AVATAR_BACKGROUNDS_DARK = [
    '0EA5E9', // sky-500
    '22C55E', // emerald-500
    'EAB308', // amber-500
    'FB923C', // orange-500
    'A855F7', // purple-500
    'EC4899', // pink-500
    'F97373', // rose-400
];

export const getAvatarBackgrounds = (isDarkMode = false) => (
    isDarkMode ? AVATAR_BACKGROUNDS_DARK : AVATAR_BACKGROUNDS_LIGHT
);

const hashName = (value = '') => {
    if (!value) return 0;
    return value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
};

const detectDarkMode = () => {
    if (typeof window === 'undefined') return false;
    if (document?.documentElement?.classList?.contains('dark')) return true;
    return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches || false;
};

export const createAvatarUrl = (name = 'User', options = {}) => {
    const { isDarkMode } = options;
    const safeName = name?.trim() || 'User';
    const themeIsDark = typeof isDarkMode === 'boolean' ? isDarkMode : detectDarkMode();
    const palette = getAvatarBackgrounds(themeIsDark);
    const background = palette[Math.abs(hashName(safeName)) % palette.length];
    const encodedName = encodeURIComponent(safeName);
    return `https://ui-avatars.com/api/?name=${encodedName}&color=FFFFFF&background=${background}&rounded=true&font-size=0.36&format=svg`;
};
