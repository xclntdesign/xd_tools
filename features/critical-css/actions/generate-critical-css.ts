"use server";

export const generateCriticalCssAction = async ({ url }: { url: string }) => {
    let returnData = {
        status: false,
        message: "",
        desktop: "",
        mobile: "",
    };

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL!}/api/critical-css`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-caller-secret": process.env.CRITICAL_CSS_CALLER_SECRET!,
            },
            body: JSON.stringify({url: url}),
        })

        if(!response.ok) {
            returnData.message = "Error from upstream service: " + response.statusText;
            return returnData;
        }

        const json = await response.json();

        returnData.desktop = json.desktop.css;
        returnData.mobile = json.mobile.css;
        returnData.status = true;
        return returnData;
    } catch (error: any) {
        returnData.message = error.message;
        return returnData;
    }

    return returnData;
}