import { createClient } from "@/lib/supabase/server";

export const storeWebAudit = async (url: string, details: string) => {
    let returnStatus = {
        status: false,
        message: "",
        description: "",
        data: "",
    };

    const supabase = await createClient();
    
    const { data, error } = await supabase.auth.getUser();
    
    if (error || !data?.user) {
        returnStatus.message = "Authentication error.";
        returnStatus.description = "You are not authorized to perform this action.";
        return returnStatus;
    }

    const insertData = {
        audit_url: url,
        audit_id: crypto.randomUUID(),
        audit_details: JSON.parse(details),
    };

    const { data: auditStoreData, error: auditStoreError } = await supabase.from("WebAudits").insert(insertData);

    if (auditStoreError) {
        console.log(auditStoreError);
        returnStatus.message = "Error storing audit.";
        returnStatus.description = auditStoreError.message;
        return returnStatus;
    }

    returnStatus.status = true;
    returnStatus.message = "Audit stored successfully.";
    returnStatus.description = "";
    returnStatus.data = insertData.audit_id;
    return returnStatus;
}