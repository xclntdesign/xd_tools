"use server";

import { createClient } from "@/lib/supabase/server";
import { ImageFormat, ImageOptimizerResponse } from "../components/image-optimizer";

type OptimizeImageAction = {
    input_urls: string[];
    strategy: string;
    formats: ImageFormat[];
    width: string;
    height: string;
}

const maximumFileCount = 5;

function chunkArray(arr: any[], chunkSize: number) {
  if (chunkSize <= 0) {
    return []; // Avoid infinite loop or unintended behavior
  }
  const result = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    const chunk = arr.slice(i, i + chunkSize);
    result.push(chunk);
  }
  return result;
}

export const optimizeImagesAction = async ({ input_urls, strategy, formats, width, height }: OptimizeImageAction) => {
    let returnData = {
        status: false,
        message: "",
        data: {},
    } as ImageOptimizerResponse;

    const supabase = await createClient();
        
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
        returnData.message = "You are not authorized to use this function.";
        return returnData;
    }

    const body = {
        auth: process.env.CM_API_KEY!,
        route: "image-optimization",
        body: {
            input_urls: input_urls,
            strategy: strategy,
            formats: formats,
            width: width,
            height: height
        },
    };

    try {
        const response = await fetch(`${process.env.PHP_API_V3_URL!}/image-optimization`, {
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