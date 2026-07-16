export function calculateCertificationScore(jd, resume) {
    const certs = resume?.parsedData?.certifications || [];
    const jdText = `${jd.title || ""} ${jd.rawText || ""} ${(jd.keywords || []).join(" ")}`.toLowerCase();

    // Standard certifications mapping to check if they are required by JD
    const CERT_DATABASE = [
        { name: "PMP", aliases: ["pmp", "project management professional"] },
        { name: "Certified Scrum Master", aliases: ["csm", "scrum master", "scrummaster"] },
        { name: "CISSP", aliases: ["cissp", "certified information systems security professional"] },
        { name: "AWS Certified", aliases: ["aws certified", "aws solutions architect", "aws developer", "aws sysops"] },
        { name: "Google Cloud Certified", aliases: ["gcp certified", "google cloud certified"] },
        { name: "CKA", aliases: ["cka", "certified kubernetes administrator", "ckad", "cks"] },
        { name: "CCNA", aliases: ["ccna", "cisco certified network associate", "ccnp", "ccie"] },
        { name: "ITIL", aliases: ["itil"] },
        { name: "Salesforce Certified", aliases: ["salesforce certified", "salesforce administrator"] },
        { name: "CEH", aliases: ["ceh", "certified ethical hacker"] }
    ];

    // Find which certifications are requested in JD
    const requiredCerts = [];
    for (const cert of CERT_DATABASE) {
        for (const alias of cert.aliases) {
            const pattern = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
            if (pattern.test(jdText)) {
                requiredCerts.push(cert);
                break;
            }
        }
    }

    if (requiredCerts.length === 0) {
        return {
            score: 1.0,
            matchedCerts: [],
            missingCerts: [],
            explanation: "No certifications required by the job description"
        };
    }

    const candidateCertsText = certs.map(c => (c.name || "").toLowerCase()).join(" ");

    const matched = [];
    const missing = [];

    for (const req of requiredCerts) {
        let found = false;
        for (const alias of req.aliases) {
            const pattern = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
            if (pattern.test(candidateCertsText)) {
                found = true;
                break;
            }
        }
        if (found) {
            matched.push(req.name);
        } else {
            missing.push(req.name);
        }
    }

    const score = matched.length / requiredCerts.length;

    return {
        score,
        matchedCerts: matched,
        missingCerts: missing,
        explanation: `${matched.length} of ${requiredCerts.length} required certifications matched`
    };
}
