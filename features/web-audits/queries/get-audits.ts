"use server";

import { createClient } from "@/lib/supabase/server";
import { StoredAudits } from "../components/web-audit";

export const getWebAudits = async () => {
    let returnStatus = {
        status: false,
        message: "",
        description: "",
        data: [] as StoredAudits[],
    };

    const supabase = await createClient();
    
    const { data: auditData, error: auditError, status: auditStatus, statusText: auditStatusText } = await supabase.from("WebAudits").select().order("created_at", { ascending: false });

    if(auditError || auditStatus !== 200) {
        returnStatus.message = "Data retrieval error.";
        returnStatus.description = "An unknown error has occurred.";
        return returnStatus;
    }

    returnStatus.status = true;
    returnStatus.data = auditData ?? [];
    return returnStatus;
}

export const getWebAudit = async (id: string) => {
    let returnStatus = {
        status: false,
        message: "",
        description: "",
        data: {} as StoredAudits,
    };

    const supabase = await createClient();
    
    const { data: auditData, error: auditError, status: auditStatus, statusText: auditStatusText } = await supabase.from("WebAudits").select().eq("id", id).limit(1).single();

    if(auditError || auditStatus !== 200) {
        returnStatus.message = "Data retrieval error.";
        returnStatus.description = "An unknown error has occurred.";
        return returnStatus;
    }

    returnStatus.status = true;
    returnStatus.data = auditData.audit_details ?? {};
    return returnStatus;
}

export const getWebAuditByClientId = async (id: string) => {
    let returnStatus = {
        status: false,
        message: "",
        description: "",
        data: {} as StoredAudits,
    };

    const supabase = await createClient();
    
    const { data: auditData, error: auditError, status: auditStatus, statusText: auditStatusText } = await supabase.from("WebAudits").select().eq("audit_id", id).limit(1).single();

    if(auditError || auditStatus !== 200) {
        returnStatus.message = "Data retrieval error.";
        returnStatus.description = "An unknown error has occurred.";
        return returnStatus;
    }

    auditData.audit_details = JSON.stringify(auditData.audit_details);

    returnStatus.status = true;
    returnStatus.data = auditData ?? {};
    return returnStatus;
}