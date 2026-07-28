import Color from "colorjs.io";

type HexColor = `#${string}`;

type Shade =
    | 50
    | 100
    | 200
    | 300
    | 400
    | 500
    | 600
    | 700
    | 800
    | 900
    | 950;

type ColorScale = Record<Shade, HexColor>;

interface ThemeMode {
    background: HexColor;
    foreground: HexColor;
    surface: HexColor;
    surfaceForeground: HexColor;
    muted: HexColor;
    mutedForeground: HexColor;
    border: HexColor;
    primary: HexColor;
    primaryForeground: HexColor;
    secondary: HexColor;
    secondaryForeground: HexColor;
    accent: HexColor;
    accentForeground: HexColor;
}

interface GeneratedTheme {
    primary: ColorScale;
    secondary: ColorScale;
    accent: ColorScale;
    complementary: ColorScale;
    neutral: ColorScale;

    semantic: {
        success: ColorScale;
        warning: ColorScale;
        danger: ColorScale;
        info: ColorScale;
    };

    light: ThemeMode;
    dark: ThemeMode;
}

interface Oklch {
    l: number;
    c: number;
    h: number;
}

const shadeLightness: Record<Shade, number> = {
    50: 0.97,
    100: 0.93,
    200: 0.87,
    300: 0.79,
    400: 0.70,
    500: 0.61,
    600: 0.53,
    700: 0.45,
    800: 0.37,
    900: 0.29,
    950: 0.22,
};

const shadeChromaMultipliers: Record<Shade, number> = {
    50: 0.18,
    100: 0.30,
    200: 0.48,
    300: 0.68,
    400: 0.86,
    500: 1,
    600: 0.96,
    700: 0.88,
    800: 0.76,
    900: 0.62,
    950: 0.48,
};

/**
 * Keeps a degree value between 0 and 360.
 */
function normalizeHue(hue: number): number {
    return ((hue % 360) + 360) % 360;
}

/**
 * Converts any Color.js-compatible input into OKLCH coordinates.
 */
function parseOklch(input: string): Oklch {
    const color = new Color(input).to("oklch");
    const [l, c, h] = color.coords;

    return {
        l: (l && Number.isFinite(l)) ? l : 0.5,
        c: (c && Number.isFinite(c)) ? c : 0,
        h: (h && Number.isFinite(h)) ? h : 0,
    };
}

/**
 * Creates a display-safe sRGB hexadecimal value.
 */
function toHex({ l, c, h }: Oklch): HexColor {
    const color = new Color("oklch", [
        Math.max(0, Math.min(1, l)),
        Math.max(0, c),
        normalizeHue(h),
    ]);

    const srgb = color.toGamut({
        space: "srgb",
        method: "oklch.c",
    });

    return srgb.to("srgb").toString({
        format: "hex",
    }) as HexColor;
}

const shadeLightnessMix: Record<Shade, number> = {
    50: 0.92,
    100: 0.78,
    200: 0.58,
    300: 0.38,
    400: 0.18,
    500: 0,
    600: 0.14,
    700: 0.30,
    800: 0.46,
    900: 0.62,
    950: 0.76,
};

function normalizeHex(input: string): HexColor {
    return new Color(input)
        .toGamut({
            space: "srgb",
            method: "oklch.c",
        })
        .to("srgb")
        .toString({
            format: "hex",
        }) as HexColor;
}

/**
 * Creates a standard 50–950 color scale while preserving hue.
 */
function createScale(input: string): ColorScale {
    const base = parseOklch(input);
    const seed = normalizeHex(input);

    const lightTarget = 0.985;
    const darkTarget = 0.16;

    return Object.fromEntries(
        Object.keys(shadeLightnessMix).map((shadeKey) => {
            const shade = Number(shadeKey) as Shade;

            // Preserve the exact supplied color as shade 500.
            if (shade === 500) {
                return [shade, seed];
            }

            const amount = shadeLightnessMix[shade];
            const target = shade < 500
                ? lightTarget
                : darkTarget;

            const lightness =
                base.l + (target - base.l) * amount;

            const chroma =
                base.c * shadeChromaMultipliers[shade];

            return [
                shade,
                toHex({
                    l: lightness,
                    c: chroma,
                    h: base.h,
                }),
            ];
        }),
    ) as ColorScale;
}

/**
 * Creates a color by rotating the original color's hue.
 */
function rotateHue(input: string, degrees: number): HexColor {
    const color = parseOklch(input);

    return toHex({
        ...color,
        h: normalizeHue(color.h + degrees),
    });
}

/**
 * Creates a neutral scale with a subtle relationship to the primary color.
 *
 * Instead of using completely hue-free gray, this retains a tiny amount
 * of the primary hue.
 */
function createNeutralScale(input: string): ColorScale {
    const base = parseOklch(input);

    const neutralChroma: Record<Shade, number> = {
        50: 0.006,
        100: 0.008,
        200: 0.010,
        300: 0.012,
        400: 0.014,
        500: 0.016,
        600: 0.015,
        700: 0.014,
        800: 0.012,
        900: 0.010,
        950: 0.008,
    };

    return Object.fromEntries(
        Object.entries(shadeLightness).map(([shade, lightness]) => {
            const shadeNumber = Number(shade) as Shade;

            return [
                shadeNumber,
                toHex({
                    l: lightness,
                    c: neutralChroma[shadeNumber],
                    h: base.h,
                }),
            ];
        }),
    ) as ColorScale;
}

/**
 * Returns either a light or dark foreground according to contrast.
 */
function getForeground(
    background: string,
    light: HexColor = "#ffffff",
    dark: HexColor = "#111111",
): HexColor {
    const bg = new Color(background);
    const lightContrast = Math.abs(bg.contrast(new Color(light), "WCAG21"));
    const darkContrast = Math.abs(bg.contrast(new Color(dark), "WCAG21"));

    return lightContrast >= darkContrast ? light : dark;
}

function createMode(
    mode: "light" | "dark",
    primary: ColorScale,
    secondary: ColorScale,
    accent: ColorScale,
    neutral: ColorScale,
): ThemeMode {
    if (mode === "dark") {
        return {
            background: neutral[950],
            foreground: neutral[50],
            surface: neutral[900],
            surfaceForeground: neutral[50],
            muted: neutral[800],
            mutedForeground: neutral[300],
            border: neutral[700],
            primary: primary[400],
            primaryForeground: getForeground(primary[400]),
            secondary: secondary[400],
            secondaryForeground: getForeground(secondary[400]),
            accent: accent[400],
            accentForeground: getForeground(accent[400]),
        };
    }

    return {
        background: neutral[50],
        foreground: neutral[950],
        surface: "#ffffff",
        surfaceForeground: neutral[950],
        muted: neutral[100],
        mutedForeground: neutral[600],
        border: neutral[200],
        primary: primary[500],
        primaryForeground: getForeground(primary[500]),
        secondary: secondary[500],
        secondaryForeground: getForeground(secondary[500]),
        accent: accent[500],
        accentForeground: getForeground(accent[500]),
    };
}

export function generateTheme(seedColors: string[]): GeneratedTheme {
    if (seedColors.length < 1 || seedColors.length > 3) {
        throw new RangeError("Provide between one and three seed colors.");
    }

    for (const color of seedColors) {
        try {
            new Color(color);
        } catch {
            throw new TypeError(`Invalid color value: ${color}`);
        }
    }

    const primarySeed = seedColors[0];

    /*
     * One color:
     *   Secondary is analogous, accent is split-complementary.
     *
     * Two colors:
     *   Use the supplied secondary and generate the accent.
     *
     * Three colors:
     *   Use all supplied colors directly.
     */
    const secondarySeed =
        seedColors[1] ?? rotateHue(primarySeed, 30);

    const accentSeed =
        seedColors[2] ??
        (seedColors[1]
            ? rotateHue(primarySeed, 180)
            : rotateHue(primarySeed, 150));

    const complementarySeed = rotateHue(primarySeed, 180);

    const primary = createScale(primarySeed);
    const secondary = createScale(secondarySeed);
    const accent = createScale(accentSeed);
    const complementary = createScale(complementarySeed);
    const neutral = createNeutralScale(primarySeed);

    const success = createScale("#16a34a");
    const warning = createScale("#f59e0b");
    const danger = createScale("#dc2626");
    const info = createScale("#0284c7");

    return {
        primary,
        secondary,
        accent,
        complementary,
        neutral,

        semantic: {
            success,
            warning,
            danger,
            info,
        },

        light: createMode(
            "light",
            primary,
            secondary,
            accent,
            neutral,
        ),

        dark: createMode(
            "dark",
            primary,
            secondary,
            accent,
            neutral,
        ),
    };
}

function flattenTheme(
    value: unknown,
    prefix = "",
    result: Record<string, string> = {},
): Record<string, string> {
    if (typeof value === "string") {
        result[prefix] = value;
        return result;
    }

    if (!value || typeof value !== "object") {
        return result;
    }

    for (const [key, child] of Object.entries(value)) {
        const nextPrefix = prefix ? `${prefix}-${key}` : key;
        flattenTheme(child, nextPrefix, result);
    }

    return result;
}

export function themeToCssVariables(theme: GeneratedTheme): string {
    const variables = flattenTheme(theme);

    return [
        ":root {",
        ...Object.entries(variables).map(
            ([name, value]) => `  --color-${name}: ${value};`,
        ),
        "}",
    ].join("\n");
}
interface TailwindCssOptions {
    radius?: string;
    includeDarkMode?: boolean;
    darkSelector?: string;
    precision?: number;
    includeThemeInline?: boolean;
}

interface BootstrapCssOptions {
    includeDarkMode?: boolean;
    darkSelector?: string;
}

interface ThemeCssOutputOptions {
    tailwind?: TailwindCssOptions;
    bootstrap?: BootstrapCssOptions;
}

export interface ThemeCssOutputs {
    rootVariables: string;
    tailwindVariables: string;
    bootstrapOverrides: string;
}

type CssVariableMap = Record<string, string>;

function colorToOklch(colorValue: string, precision = 3): string {
    const color = new Color(colorValue).to("oklch");
    const [lightness, chroma, hue] = color.coords;

    const round = (value: number): string =>
        String(Number(value.toFixed(precision)));

    return `oklch(${round((lightness && Number.isFinite(lightness)) ? lightness : 0)} ${round(
        (chroma && Number.isFinite(chroma)) ? chroma : 0,
    )} ${round((hue && Number.isFinite(hue)) ? hue : 0)})`;
}

function formatCssBlock(
    selector: string,
    variables: CssVariableMap,
    indentation = "  ",
): string {
    return [
        `${selector} {`,
        ...Object.entries(variables).map(
            ([name, value]) => `${indentation}${name}: ${value};`,
        ),
        "}",
    ].join("\n");
}

function createTailwindVariableMap(
    theme: GeneratedTheme,
    mode: "light" | "dark",
    radius: string,
    precision: number,
): CssVariableMap {
    const colors = theme[mode];
    const isDark = mode === "dark";

    return {
        "--background": colorToOklch(colors.background, precision),
        "--foreground": colorToOklch(colors.foreground, precision),
        "--card": colorToOklch(colors.surface, precision),
        "--card-foreground": colorToOklch(colors.surfaceForeground, precision),
        "--popover": colorToOklch(colors.surface, precision),
        "--popover-foreground": colorToOklch(colors.surfaceForeground, precision),
        "--primary": colorToOklch(colors.primary, precision),
        "--primary-foreground": colorToOklch(colors.primaryForeground, precision),
        "--secondary": colorToOklch(colors.secondary, precision),
        "--secondary-foreground": colorToOklch(colors.secondaryForeground, precision),
        "--muted": colorToOklch(colors.muted, precision),
        "--muted-foreground": colorToOklch(colors.mutedForeground, precision),
        "--accent": colorToOklch(colors.accent, precision),
        "--accent-foreground": colorToOklch(colors.accentForeground, precision),
        "--destructive": colorToOklch(
            isDark ? theme.semantic.danger[400] : theme.semantic.danger[600],
            precision,
        ),
        "--destructive-foreground": colorToOklch(
            getForeground(
                isDark ? theme.semantic.danger[400] : theme.semantic.danger[600],
            ),
            precision,
        ),
        "--border": colorToOklch(colors.border, precision),
        "--input": colorToOklch(colors.border, precision),
        "--ring": colorToOklch(
            isDark ? theme.primary[400] : theme.primary[500],
            precision,
        ),
        "--chart-1": colorToOklch(
            isDark ? theme.primary[400] : theme.primary[600],
            precision,
        ),
        "--chart-2": colorToOklch(
            isDark ? theme.secondary[400] : theme.secondary[600],
            precision,
        ),
        "--chart-3": colorToOklch(
            isDark ? theme.accent[400] : theme.accent[600],
            precision,
        ),
        "--chart-4": colorToOklch(
            isDark ? theme.complementary[400] : theme.complementary[600],
            precision,
        ),
        "--chart-5": colorToOklch(
            isDark ? theme.semantic.info[400] : theme.semantic.info[600],
            precision,
        ),
        "--radius": radius,
        "--sidebar": colorToOklch(
            isDark ? theme.neutral[900] : theme.neutral[50],
            precision,
        ),
        "--sidebar-foreground": colorToOklch(colors.foreground, precision),
        "--sidebar-primary": colorToOklch(colors.primary, precision),
        "--sidebar-primary-foreground": colorToOklch(
            colors.primaryForeground,
            precision,
        ),
        "--sidebar-accent": colorToOklch(
            isDark ? theme.neutral[800] : theme.neutral[100],
            precision,
        ),
        "--sidebar-accent-foreground": colorToOklch(colors.foreground, precision),
        "--sidebar-border": colorToOklch(colors.border, precision),
        "--sidebar-ring": colorToOklch(
            isDark ? theme.primary[400] : theme.primary[500],
            precision,
        ),
    };
}

function createTailwindInlineTheme(): string {
    return `@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}`;
}

function createTailwindImports() {
    return `@import "tailwindcss";
        @import "tw-animate-css";
        @import "shadcn/tailwind.css";
        /* Use @fontsource-variable for Google Fonts */
        @import "@fontsource-variable/inter";
        /* Import only necessary Font Awesome icons - This kit is FontAwesome 7 */
        @import "@awesome.me/kit-4f3ad6188d/icons/css/fontawesome.min.css";
        @import "@awesome.me/kit-4f3ad6188d/icons/css/solid.min.css";
        @import "@awesome.me/kit-4f3ad6188d/icons/css/light.min.css";
        @import "@awesome.me/kit-4f3ad6188d/icons/css/brands.min.css";
        @import "@awesome.me/kit-4f3ad6188d/icons/css/custom-icons.min.css";

        @custom-variant dark (&:is(.dark *));`;
}

export function themeToTailwindCss(
    theme: GeneratedTheme,
    options: TailwindCssOptions = {},
): string {
    const {
        radius = "0.625rem",
        includeDarkMode = true,
        darkSelector = ".dark",
        precision = 3,
        includeThemeInline = true,
    } = options;

    const blocks: string[] = [];

    blocks.push(createTailwindImports());

    if (includeThemeInline) {
        blocks.push(createTailwindInlineTheme());
    }

    blocks.push(
        formatCssBlock(
            ":root",
            createTailwindVariableMap(theme, "light", radius, precision),
        ),
    );

    if (includeDarkMode) {
        blocks.push(
            formatCssBlock(
                darkSelector,
                createTailwindVariableMap(theme, "dark", radius, precision),
            ),
        );
    }

    return blocks.join("\n\n");
}

function bootstrapColorVariables(
    theme: GeneratedTheme,
    mode: "light" | "dark",
): CssVariableMap {
    const colors = theme[mode];
    const isDark = mode === "dark";

    return {
        "--bs-body-bg": colors.background,
        "--bs-body-color": colors.foreground,
        "--bs-border-color": colors.border,
        "--bs-primary": colors.primary,
        "--bs-primary-rgb": new Color(colors.primary).to("srgb").coords
            .map((value) => Math.round((value ?? 0) * 255))
            .join(", "),
        "--bs-secondary": colors.secondary,
        "--bs-secondary-rgb": new Color(colors.secondary).to("srgb").coords
            .map((value) => Math.round((value ?? 0) * 255))
            .join(", "),
        "--bs-success": isDark ? theme.semantic.success[400] : theme.semantic.success[600],
        "--bs-info": isDark ? theme.semantic.info[400] : theme.semantic.info[600],
        "--bs-warning": isDark ? theme.semantic.warning[400] : theme.semantic.warning[600],
        "--bs-danger": isDark ? theme.semantic.danger[400] : theme.semantic.danger[600],
        "--bs-light": theme.neutral[100],
        "--bs-dark": theme.neutral[900],
        "--bs-link-color": colors.primary,
        "--bs-link-hover-color": isDark ? theme.primary[300] : theme.primary[700],
    };
}

function bootstrapButtonClass(
    name: string,
    background: HexColor,
    foreground: HexColor,
    hoverBackground: HexColor,
    hoverForeground: HexColor,
    activeBackground: HexColor,
): string {
    return `.btn-${name} {
  --bs-btn-color: ${foreground};
  --bs-btn-bg: ${background};
  --bs-btn-border-color: ${background};
  --bs-btn-hover-color: ${hoverForeground};
  --bs-btn-hover-bg: ${hoverBackground};
  --bs-btn-hover-border-color: ${hoverBackground};
  --bs-btn-focus-shadow-rgb: 0, 0, 0;
  --bs-btn-active-color: ${hoverForeground};
  --bs-btn-active-bg: ${activeBackground};
  --bs-btn-active-border-color: ${activeBackground};
  --bs-btn-disabled-color: ${foreground};
  --bs-btn-disabled-bg: ${background};
  --bs-btn-disabled-border-color: ${background};
}`;
}

function bootstrapOutlineButtonClass(
    name: string,
    color: HexColor,
    hoverBackground: HexColor,
    hoverForeground: HexColor,
): string {
    return `.btn-outline-${name},
.btn-${name}-outline {
  --bs-btn-color: ${color};
  --bs-btn-border-color: ${color};
  --bs-btn-hover-color: ${hoverForeground};
  --bs-btn-hover-bg: ${hoverBackground};
  --bs-btn-hover-border-color: ${hoverBackground};
  --bs-btn-focus-shadow-rgb: 0, 0, 0;
  --bs-btn-active-color: ${hoverForeground};
  --bs-btn-active-bg: ${hoverBackground};
  --bs-btn-active-border-color: ${hoverBackground};
  --bs-btn-disabled-color: ${color};
  --bs-btn-disabled-bg: transparent;
  --bs-btn-disabled-border-color: ${color};
}`;
}

function createBootstrapComponentCss(
    theme: GeneratedTheme,
    mode: "light" | "dark",
    selector?: string,
): string {
    const colors = theme[mode];
    const isDark = mode === "dark";
    const prefix = selector ? `${selector} ` : "";

    const primaryHover = isDark ? theme.primary[300] : theme.primary[700];
    const primaryActive = isDark ? theme.primary[200] : theme.primary[800];
    const secondaryHover = isDark ? theme.secondary[300] : theme.secondary[700];
    const secondaryActive = isDark ? theme.secondary[200] : theme.secondary[800];

    const blocks = [
        bootstrapButtonClass(
            "primary",
            colors.primary,
            colors.primaryForeground,
            primaryHover,
            getForeground(primaryHover),
            primaryActive,
        ),
        bootstrapOutlineButtonClass(
            "primary",
            colors.primary,
            colors.primary,
            colors.primaryForeground,
        ),
        bootstrapButtonClass(
            "secondary",
            colors.secondary,
            colors.secondaryForeground,
            secondaryHover,
            getForeground(secondaryHover),
            secondaryActive,
        ),
        bootstrapOutlineButtonClass(
            "secondary",
            colors.secondary,
            colors.secondary,
            colors.secondaryForeground,
        ),
        `.card,
.modal-content,
.dropdown-menu,
.list-group-item {
  --bs-card-bg: ${colors.surface};
  --bs-card-color: ${colors.surfaceForeground};
  --bs-card-border-color: ${colors.border};
  --bs-modal-bg: ${colors.surface};
  --bs-modal-color: ${colors.surfaceForeground};
  --bs-dropdown-bg: ${colors.surface};
  --bs-dropdown-color: ${colors.surfaceForeground};
  --bs-dropdown-border-color: ${colors.border};
  --bs-list-group-bg: ${colors.surface};
  --bs-list-group-color: ${colors.surfaceForeground};
  --bs-list-group-border-color: ${colors.border};
}`,
        `.form-control,
.form-select {
  color: ${colors.foreground};
  background-color: ${colors.surface};
  border-color: ${colors.border};
}

.form-control:focus,
.form-select:focus {
  color: ${colors.foreground};
  background-color: ${colors.surface};
  border-color: ${theme.primary[400]};
  box-shadow: 0 0 0 0.25rem color-mix(in srgb, ${colors.primary} 25%, transparent);
}`,
        `.nav-pills {
  --bs-nav-pills-link-active-bg: ${colors.primary};
  --bs-nav-pills-link-active-color: ${colors.primaryForeground};
}

.pagination {
  --bs-pagination-color: ${colors.primary};
  --bs-pagination-bg: ${colors.surface};
  --bs-pagination-border-color: ${colors.border};
  --bs-pagination-hover-color: ${getForeground(theme.primary[100])};
  --bs-pagination-hover-bg: ${theme.primary[100]};
  --bs-pagination-hover-border-color: ${theme.primary[200]};
  --bs-pagination-active-color: ${colors.primaryForeground};
  --bs-pagination-active-bg: ${colors.primary};
  --bs-pagination-active-border-color: ${colors.primary};
}`,
        `.progress {
  --bs-progress-bg: ${colors.muted};
  --bs-progress-bar-bg: ${colors.primary};
}`,
        `.accordion {
  --bs-accordion-bg: ${colors.surface};
  --bs-accordion-color: ${colors.surfaceForeground};
  --bs-accordion-border-color: ${colors.border};
  --bs-accordion-active-bg: ${colors.muted};
  --bs-accordion-active-color: ${colors.foreground};
  --bs-accordion-btn-focus-border-color: ${theme.primary[400]};
  --bs-accordion-btn-focus-box-shadow: 0 0 0 0.25rem color-mix(in srgb, ${colors.primary} 25%, transparent);
}`,
    ];

    if (!prefix) {
        return blocks.join("\n\n");
    }

    return blocks
        .map((block) =>
            block.replace(/(^|\n)([^@\n][^{]+)\s*\{/g, (_match, start, selectors) => {
                const scoped = String(selectors)
                    .split(",")
                    .map((item) => `${prefix}${item.trim()}`)
                    .join(",\n");
                return `${start}${scoped} {`;
            }),
        )
        .join("\n\n");
}

export function themeToBootstrapCss(
    theme: GeneratedTheme,
    options: BootstrapCssOptions = {},
): string {
    const {
        includeDarkMode = false,
        darkSelector = ".dark",
    } = options;

    const blocks = [
        formatCssBlock(":root", bootstrapColorVariables(theme, "light")),
        createBootstrapComponentCss(theme, "light"),
    ];

    if (includeDarkMode) {
        blocks.push(
            formatCssBlock(
                darkSelector,
                bootstrapColorVariables(theme, "dark"),
            ),
            createBootstrapComponentCss(theme, "dark", darkSelector),
        );
    }

    return blocks.join("\n\n");
}

export function generateThemeCssOutputs(
    theme: GeneratedTheme,
    options: ThemeCssOutputOptions = {},
): ThemeCssOutputs {
    return {
        rootVariables: themeToCssVariables(theme),
        tailwindVariables: themeToTailwindCss(theme, options.tailwind),
        bootstrapOverrides: themeToBootstrapCss(theme, options.bootstrap),
    };
}