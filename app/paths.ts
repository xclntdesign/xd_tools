export const signInPath = () => "/sign-in";
export const forceLogoutPath = (reason: string) => `/api/users/logout?reason=${reason}`;

export const dashboardPath = () => "/dashboard";
export const auditPath = () => "/generate/web-audit";
export const colorShadesPath = () => "/generate/color-shades";
export const criticalCssPath = () => "/generate/critical-css";
export const passwordGeneratorPath = () => "/generate/password";
export const imageOptimizerPath = () => "/generate/image-optimizer";
export const kmlCreatorPath = () => "/build/geojson";
export const modernizrBuildPath = () => "/build/modernizr";
export const pdfCreatorPath = () => "/build/pdf";
export const redirectBuilderPath = () => "/build/redirects";
export const screenshotGeneratorPath = () => "/generate/screenshot";
export const projectsPath = () => "/projects";