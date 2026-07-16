export function calculateLocationScore(jd, resume) {
    const jdLocation = (jd.location || "").trim().toLowerCase();
    const candidateLocation = (resume?.parsedData?.contact?.location || "").trim().toLowerCase();

    if (!jdLocation) {
        return {
            score: 1.0,
            explanation: "No location requirements specified in job description"
        };
    }

    const isJdRemote = jdLocation.includes("remote");
    const isJdHybrid = jdLocation.includes("hybrid");
    const isJdOnsite = !isJdRemote && !isJdHybrid;

    const isCandRemote = candidateLocation.includes("remote");

    if (isJdRemote) {
        return {
            score: 1.0,
            explanation: "Job is remote; candidate location is compatible"
        };
    }

    if (!candidateLocation) {
        return {
            score: 0.5,
            explanation: "Job is onsite/hybrid but candidate location is not specified"
        };
    }

    const getTokens = (str) => {
        return str
            .replace(/[\d,;.:()\-]/g, " ")
            .split(/\s+/)
            .filter(w => w.length > 1 && w !== "remote" && w !== "hybrid" && w !== "onsite" && w !== "on-site");
    };

    const jdTokens = getTokens(jdLocation);
    const candTokens = getTokens(candidateLocation);

    let match = false;
    for (const t1 of jdTokens) {
        for (const t2 of candTokens) {
            if (t1 === t2 || t1.includes(t2) || t2.includes(t1)) {
                match = true;
                break;
            }
        }
        if (match) break;
    }

    if (match) {
        return {
            score: 1.0,
            explanation: `Location matches: Job is ${isJdHybrid ? 'hybrid' : 'onsite'} in ${jd.location}, candidate is in ${resume.parsedData.contact.location}`
        };
    }

    if (isJdHybrid && isCandRemote) {
        return {
            score: 0.6,
            explanation: "Job is hybrid; candidate prefers remote"
        };
    }

    return {
        score: 0.2,
        explanation: `Location mismatch: Job is ${jd.location}, candidate is in ${resume.parsedData.contact.location}`
    };
}
