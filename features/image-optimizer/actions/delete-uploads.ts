"use server";

import { createClient } from "@/lib/supabase/server";
import { ImageOptimizerResponse } from "../components/image-optimizer";

export const deleteUploadedImages = async (urls: string[]) => {
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

    const { data: fileRemoveData, error: fileRemoveError } = await supabase.storage.from('optimization').remove(urls);
}