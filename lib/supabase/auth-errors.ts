export const supabaseAuthErrors = (error_code?: string) => {
    switch (error_code) {
        case "same_password":
            return "New password must be different from current password.";
        
        case "bad_json":
        case "bad_jwt":
            return "Database connection error.";

        case "invalid_credentials":
            return "Invalid credentials.";

        case "session_expired":
        case "session_not_found":
            return "Your session has expired. Please log in again.";

        case "user_not_found":
            return "User account not found.";

        case "weak_password":
            return "The password entered is too weak. Please enter a new password.";

        default:
            console.log("AuthAPI Error: " + error_code);
            return "An unknown error has occured.";
    }

    return "An unknown error has occurred.";
};