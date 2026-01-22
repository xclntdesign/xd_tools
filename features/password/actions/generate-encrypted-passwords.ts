"use server";


export const generateEncryptedPasswords = async (pw: string) => {
    let returnData = {
        status: false,
        message: "",
        v2: "",
        v4: "",
    }

    const body = {
        auth: process.env.CM_API_KEY!,
        route: "password",
        body: {
            password: pw
        },
    }

    try {
        const response = await fetch(`${process.env.PHP_API_V3_URL!}/password`, {
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

        returnData.v2 = json.data.v2;
        returnData.v4 = json.data.v4;
        returnData.status = true;
        return returnData;
    } catch (error: any) {
        returnData.message = error.message;
        return returnData;
    }
}