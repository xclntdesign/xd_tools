"use server";

import { createClient } from "@/lib/supabase/server";

export const getZipCodesFromState = async (state: string) => {
    let returnData = {
        status: false,
        message: "",
        data: [],
    }

    const supabase = await createClient();
            
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
        returnData.message = "You are not authorized to use this function.";
        return returnData;
    }

    const body = {
        auth: process.env.CM_API_KEY!,
        route: "geojson-state",
        body: {
            state: state,
        },
    };

    try {
        const response = await fetch(`${process.env.PHP_API_V3_URL!}/geojson`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        })

        if(!response.ok) {
            returnData.message = "Error from upstream service: " + response.statusText;
            return returnData;
        }

        const json = await response.json();

        returnData.status = true;
        returnData.data = json.data;
        return returnData;
    } catch (error: any) {
        returnData.message = error.message;
        return returnData;
    }
}