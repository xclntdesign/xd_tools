import { ArrowRightLeftIcon, ChartNoAxesCombinedIcon, ClipboardListIcon, CodeIcon, FileSpreadsheetIcon, HomeIcon, ImagesIcon, MapPinPlusIcon, MonitorDownIcon, PaletteIcon, RotateCcwKeyIcon } from "lucide-react";
import { auditPath, colorShadesPath, criticalCssPath, dashboardPath, imageOptimizerPath, kmlCreatorPath, modernizrBuildPath, passwordGeneratorPath, projectsPath, redirectBuilderPath, screenshotGeneratorPath } from "../paths";

export function getMainNav({ pathname, sorted = false, omitDashboard = false }: { pathname: string, sorted?: boolean, omitDashboard?: boolean }) {
    const mainNav = [
        {
            title: "Dashboard",
            description: "All available Web Tools.",
            url: dashboardPath(),
            icon: HomeIcon,
            isActive: pathname === dashboardPath(),
        },
        {
            title: "Color Shades",
            description: "Generate color shades from a given HEX or RGB color.",
            url: colorShadesPath(),
            icon: PaletteIcon,
            isActive: pathname === colorShadesPath(),
        },
        {
            title: "Critical CSS",
            description: "Generate above-the-fold CSS for a web page.",
            url: criticalCssPath(),
            icon: FileSpreadsheetIcon,
            isActive: pathname === criticalCssPath(),
        },
        {
            title: "GeoJSON Creator",
            description: "Create GeoJSON files for Google Maps or Mapbox from zip codes.",
            url: kmlCreatorPath(),
            icon: MapPinPlusIcon,
            isActive: pathname === kmlCreatorPath(),
        },
        {
            title: "Image Optimizer",
            description: "Optimize and convert images to different formats.",
            url: imageOptimizerPath(),
            icon: ImagesIcon,
            isActive: pathname === imageOptimizerPath(),
        },
        {
            title: "Modernizr Build",
            description: "Create a Modernizr build for browser feature detection.",
            url: modernizrBuildPath(),
            icon: CodeIcon,
            isActive: pathname === modernizrBuildPath(),
        },
        {
            title: "Password Generator",
            description: "Generate a password, and encrypted versions for database entry.",
            url: passwordGeneratorPath(),
            icon: RotateCcwKeyIcon,
            isActive: pathname === passwordGeneratorPath(),
        },
        {
            title: "Project Search",
            description: "Search the original xclntDesign Project Manager.",
            url: projectsPath(),
            icon: ClipboardListIcon,
            isActive: pathname.includes(projectsPath()),
        },
        {
            title: "Redirect Builder",
            description: "Generate redirects for an .htaccess or vercel.json file.",
            url: redirectBuilderPath(),
            icon: ArrowRightLeftIcon,
            isActive: pathname === redirectBuilderPath(),
        },
        {
            title: "Screenshot Generator",
            description: "Generate screenshots of a web page on specific devices.",
            url: screenshotGeneratorPath(),
            icon: MonitorDownIcon,
            isActive: pathname === screenshotGeneratorPath(),
        },
        {
            title: "Web Audit",
            description: "Examine how well a website runs.",
            url: auditPath(),
            icon: ChartNoAxesCombinedIcon,
            isActive: pathname === auditPath(),
        },
    ];

    let navToUse: typeof mainNav = mainNav;
    if(omitDashboard) {
        navToUse = mainNav.filter(nav => nav.url !== dashboardPath());
    } else {
        navToUse = mainNav;
    }

    if (sorted) {
        navToUse.sort((a, b) => {
            if(a.title < b.title) return -1;
            if(a.title > b.title) return 1;
            return 0;
        });
    }

    return navToUse;
}