export function generateAccessibilityScore (dataStr: string) {
    let score = 0, error: string = "";

    let data;
    try {
        data = JSON.parse(dataStr);
    } catch (err) {
        error = err as string;
        return { score, scoringError: error };
    }

    let totalTests = 0;
    let passedTests = 0;
    let incompleteTests = 0;
    let failedTests = 0;

    if(data.passes) {
        passedTests += data.passes.length;
        totalTests += data.passes.length;
    }
    if(data.incomplete) {
        incompleteTests += data.incomplete.length;
        totalTests += data.incomplete.length;
    }
    if(data.violations) {
        failedTests += data.violations.length;
        totalTests += data.violations.length;
    }

    const passedScore = passedTests * 1;
    const incompleteScore = incompleteTests * 0.5;
    const failedScore = failedTests * -1;
    score = ((passedScore + incompleteScore + failedScore) / totalTests) * 100;

    return { score, scoringError: error };
}