import test from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Import scorers and services
import { calculateEmbeddingScore } from "../services/match/embedding.service.js";
import { generateEmbeddingFromText } from "../services/embedding.service.js";
import { calculateSkillScore } from "../services/match/skill.service.js";
import { calculateExperienceScore } from "../services/match/experience.service.js";
import { calculateEducationScore } from "../services/match/education.service.js";
import { calculateCertificationScore } from "../services/match/certification.service.js";
import { calculateLocationScore } from "../services/match/location.service.js";
import { calculateDomainScore, extractDomainConcepts } from "../services/match/domain.service.js";
import { calculatePenalties } from "../services/match/penalty.service.js";
import { generateExplanation } from "../services/match/explanation.service.js";
import { scoreCandidate } from "../services/match/scoring.service.js";
import { parseJobDescription } from "../services/jd.service.js";
import { runMatchPipeline, getMatchResultsList, getMatchResultById } from "../services/match/match.service.js";

// Models
import JobDescription from "../models/jobDescription.models.js";
import Resume from "../models/resume.models.js";
import MatchResult from "../models/matchResult.models.js";

// Mock JDs and Resumes for tests
const mockJd = {
    title: "Senior Node.js Developer",
    rawText: `We are looking for a Senior Node.js Developer.
Minimum 5 years of experience.
Required skills: Node.js, JavaScript, AWS.
Preferred Degree: Bachelor's in Computer Science.
Certifications: AWS Certified Solutions Architect.
Location: San Francisco, CA (Hybrid).
Responsibilities:
- Design and implement scalable microservices.
- Manage cloud infrastructure on AWS.`,
    keywords: ["node.js", "javascript", "aws"],
    requiredSkills: [
        { name: "Node.js", category: "Frameworks" },
        { name: "JavaScript", category: "Languages" },
        { name: "AWS", category: "Cloud" }
    ],
    skills: [
        { name: "Node.js", category: "Frameworks" },
        { name: "JavaScript", category: "Languages" },
        { name: "AWS", category: "Cloud" }
    ],
    minimumExperience: { years: 5, raw: "Minimum 5 years of experience" },
    seniority: "senior",
    location: "San Francisco, CA (Hybrid)",
    responsibilities: [
        "Design and implement scalable microservices",
        "Manage cloud infrastructure on AWS"
    ],
    embedding: Array(384).fill(0.1) // Mock vector
};

const mockResume = {
    originalFileName: "john_doe.pdf",
    embedding: Array(384).fill(0.11), // Mock vector
    parsedData: {
        contact: {
            name: "John Doe",
            location: "San Francisco, CA"
        },
        skills: [
            { name: "Node.js", category: "Frameworks" },
            { name: "JavaScript", category: "Languages" },
            { name: "Python", category: "Languages" }
        ],
        experience: [
            {
                title: "Senior Software Engineer",
                company: "Tech Corp",
                dates: "Jan 2021 - Present",
                description: "Built scalable APIs in Node.js and worked on AWS cloud architecture."
            },
            {
                title: "Software Developer",
                company: "Startup Co",
                dates: "June 2018 - Dec 2020",
                description: "Worked on JavaScript frontend and backend systems."
            }
        ],
        education: [
            {
                degree: "BS in Computer Science",
                field: "Computer Science",
                institution: "State University",
                dates: "2014 - 2018"
            }
        ],
        certifications: [
            { name: "AWS Certified Solutions Architect" }
        ]
    }
};

test("Embedding Score - should calculate cosine similarity clamped [0, 1]", () => {
    const res = calculateEmbeddingScore([1, 0], [1, 0]);
    assert.deepEqual(res.score, 1);

    const res2 = calculateEmbeddingScore([1, 0], [0, 1]);
    assert.deepEqual(res2.score, 0);

    const resNull = calculateEmbeddingScore(null, [1, 0]);
    assert.deepEqual(resNull.score, 0);
});

test("Skill Score - should calculate correct overlap percentage and segment mandatory/preferred", async () => {
    const jdSkills = mockJd.requiredSkills;
    const resumeSkills = mockResume.parsedData.skills;

    const res = await calculateSkillScore(jdSkills, resumeSkills, mockJd.rawText);
    assert.deepEqual(res.matchedSkills, ["Node.js", "JavaScript"]);
    assert.deepEqual(res.missingSkills, ["AWS"]);
    assert.deepEqual(res.extraSkills, ["Python"]);
    assert.ok(res.score > 0.6 && res.score < 0.67); // 2/3 matched
    assert.ok(res.percentageMatch > 66 && res.percentageMatch < 67);
    
    // None are preferred in the mock JD text, so all are mandatory
    assert.deepEqual(res.missingMandatory, ["AWS"]);
    assert.deepEqual(res.missingPreferred, []);
});

test("Domain Concept Extraction - should strip generic words and extract domain-specific terms", () => {
    const concepts = extractDomainConcepts("Senior RF Systems Engineer transceiver antenna DSP electromagnetic wave spectrum Matlab C++");
    assert.ok(concepts.includes("rf"));
    assert.ok(concepts.includes("transceiver"));
    assert.ok(concepts.includes("antenna"));
    assert.ok(concepts.includes("dsp"));
    assert.ok(concepts.includes("matlab"));
    assert.ok(concepts.includes("c++"));
    // Generic words should be stripped
    assert.ok(!concepts.includes("senior"));
    assert.ok(!concepts.includes("engineer"));
});

test("Dynamic Domain Classifier - RF JD vs IT resume should flag mismatch", async () => {
    const rfJd = {
        title: "Senior RF Systems Engineer",
        rawText: "Design transceiver antenna DSP electromagnetic wave spectrum simulation Matlab C++",
        keywords: ["rf", "dsp", "matlab"],
        requiredSkills: [{ name: "Matlab" }, { name: "C++" }]
    };

    const itResume = {
        parsedData: {
            skills: [{ name: "Python" }, { name: "networking" }],
            experience: [
                { title: "IT Support Technician", description: "Helpdesk network administrator hardware setup software installation" }
            ]
        }
    };

    const res = await calculateDomainScore(rfJd, itResume);
    assert.ok(res.primaryMismatch === true);
    assert.ok(res.score < 0.45);
});

test("Dynamic Domain Classifier - matching domains should not flag mismatch", async () => {
    const backendJd = {
        title: "Senior Node.js Developer",
        rawText: "Build scalable REST APIs with Node.js Express MongoDB microservices",
        keywords: ["node.js", "express", "mongodb"],
        requiredSkills: [{ name: "Node.js" }, { name: "MongoDB" }]
    };

    const backendResume = {
        parsedData: {
            skills: [{ name: "Node.js" }, { name: "Express" }, { name: "MongoDB" }],
            experience: [
                { title: "Backend Developer", description: "Built REST APIs using Node.js Express and MongoDB." }
            ]
        }
    };

    const res = await calculateDomainScore(backendJd, backendResume);
    assert.ok(res.primaryMismatch === false);
    assert.ok(res.score >= 0.45);
});

test("Experience Score - should parse dates and calculate seniority and relevance", () => {
    const res = calculateExperienceScore(mockJd, mockResume);
    assert.ok(res.totalYears >= 7.5 && res.totalYears <= 8.5);
    assert.deepEqual(res.seniority, "senior");
    assert.ok(res.score > 0.5);
});

test("Education Score - should map degree level and check field relevance", () => {
    const res = calculateEducationScore(mockJd, mockResume);
    assert.deepEqual(res.highestDegree, "BS in Computer Science");
    assert.deepEqual(res.requiredDegree, "Bachelor's");
    assert.deepEqual(res.fieldMatch, true);
    assert.deepEqual(res.degreeScore, 1.0);
    assert.deepEqual(res.fieldScore, 1.0);
    assert.deepEqual(res.score, 1.0);
});

test("Certification Score - should find exact and alias match", () => {
    const res = calculateCertificationScore(mockJd, mockResume);
    assert.deepEqual(res.matchedCerts, ["AWS Certified"]);
    assert.deepEqual(res.missingCerts, []);
    assert.deepEqual(res.score, 1.0);
});

test("Location Score - should evaluate onsite/remote/hybrid city match", () => {
    const res = calculateLocationScore(mockJd, mockResume);
    assert.deepEqual(res.score, 1.0);
    
    const badResume = {
        parsedData: { contact: { location: "New York, NY" } }
    };
    const res2 = calculateLocationScore(mockJd, badResume);
    assert.deepEqual(res2.score, 0.2);
});

test("Penalty Engine - should subtract scores for missing requirements", () => {
    const scores = {
        domain: { score: 1.0, primaryMismatch: false },
        skills: { missingMandatory: ["AWS"], missingPreferred: [], score: 0.67 },
        experience: { relevantYears: 3 },
        education: { degreeScore: 0.67, highestDegree: "Associate", requiredDegree: "Bachelor's" },
        certification: { matchedCerts: [], missingCerts: ["AWS Certified"] }
    };

    const res = calculatePenalties(mockJd, mockResume, scores);
    assert.ok(res.penalty > 0);
    assert.ok(res.reasons.length > 0);
});

test("Explanation Layer - should identify strengths, weaknesses and breakdown", () => {
    const scores = {
        embedding: { score: 0.8 },
        domain: { score: 0.85, primaryMismatch: false },
        skills: { score: 0.67, percentageMatch: 67, matchedSkills: ["Node.js", "JavaScript"], missingMandatory: ["AWS"], missingPreferred: [] },
        experience: { score: 0.9, totalYears: 8, relevantYears: 7 },
        education: { degreeScore: 1.0, fieldMatch: true, highestDegree: "BS", requiredDegree: "Bachelor's" },
        certification: { matchedCerts: ["AWS Certified"], missingCerts: [] },
        responsibility: { score: 0.85 },
        location: { score: 1.0 }
    };
    const penalties = { penalty: 0.05, reasons: ["Missing mandatory skill AWS (-15%)"] };
    const finalScore = 0.82;

    const res = generateExplanation(scores, penalties, finalScore);
    assert.ok(res.strengths.length > 0);
});

test("Score Candidate Integration - should compute final score with dynamic domain", async () => {
    const realJdEmbed = await generateEmbeddingFromText(mockJd.rawText);
    const realResumeEmbed = await generateEmbeddingFromText(
        mockResume.parsedData.experience.map(e => e.description).join(" ")
    );

    const jd = { ...mockJd, embedding: realJdEmbed };
    const resume = { ...mockResume, embedding: realResumeEmbed };

    const result = await scoreCandidate(jd, resume);
    assert.ok(result.finalScore >= 0 && result.finalScore <= 1.0);
    assert.ok(result.explanation.strengths.length > 0);
    assert.ok(typeof result.domain.score === "number");
    assert.ok(typeof result.domain.primaryMismatch === "boolean");
});

test("IT Instructor vs RF JD - should result in low match score (< 0.20)", async () => {
    const rfJdText = "Senior RF Systems Engineer. Design transceiver antenna frontends. Implement DSP simulation algorithms using Matlab and C++. Electromagnetic wave propagation and spectrum analysis.";

    const rfJdEmbed = await generateEmbeddingFromText(rfJdText);
    const itResumeEmbed = await generateEmbeddingFromText("IT Support Technician helpdesk network administrator teaching python programming courses");

    const jd = {
        title: "Senior RF Systems Engineer",
        rawText: rfJdText,
        keywords: ["rf", "matlab", "dsp", "c++"],
        requiredSkills: [
            { name: "Matlab", category: "Languages" },
            { name: "C++", category: "Languages" }
        ],
        minimumExperience: { years: 10 },
        embedding: rfJdEmbed
    };

    const resume = {
        parsedData: {
            contact: { name: "IT Instructor" },
            skills: [
                { name: "Python", category: "Languages" }
            ],
            experience: [
                {
                    title: "IT Instructor / Network Admin",
                    dates: "Jan 2012 - Present",
                    description: "Taught general programming and IT courses at community college."
                }
            ]
        },
        embedding: itResumeEmbed
    };

    const result = await scoreCandidate(jd, resume);
    // Domain mismatch penalty (-35%) + missing mandatory skills + zero domain experience
    // Should be well under 20%
    assert.ok(result.finalScore < 0.20, `Expected < 0.20 but got ${result.finalScore}`);
    assert.ok(result.domain.primaryMismatch === true);
});

test("JD Parser - should correctly extract keywords, minExperience, location and seniority", async () => {
    const parsed = await parseJobDescription({
        title: mockJd.title,
        rawText: mockJd.rawText,
        keywords: mockJd.keywords
    });

    assert.deepEqual(parsed.title, "Senior Node.js Developer");
    assert.deepEqual(parsed.seniority, "senior");
    assert.deepEqual(parsed.minimumExperience.years, 5);
    assert.ok(parsed.location.toLowerCase().includes("san francisco"));
    assert.ok(parsed.skills.some(s => s.name.toLowerCase() === "node.js"));
});

test("DB Integration - should connect to MongoDB, save records, and run matching pipeline", async () => {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
        console.log("Skipping DB integration test: No MONGO_URI in environment.");
        return;
    }

    try {
        await mongoose.connect(mongoUri);

        const testUserId = "test-user-id-123";
        const testBatchId = new mongoose.Types.ObjectId();

        const realJdEmbed = await generateEmbeddingFromText(mockJd.rawText);
        const realResumeEmbed = await generateEmbeddingFromText(
            mockResume.parsedData.experience.map(e => e.description).join(" ")
        );

        const parsedJd = await parseJobDescription({
            title: mockJd.title,
            rawText: mockJd.rawText,
            keywords: mockJd.keywords
        });

        const jdRecord = await JobDescription.create({
            userId: testUserId,
            ...parsedJd,
            embedding: realJdEmbed
        });

        const resumeRecord = await Resume.create({
            userId: testUserId,
            batchId: testBatchId,
            originalFileName: mockResume.originalFileName,
            status: "parsed",
            parsedData: mockResume.parsedData,
            embedding: realResumeEmbed
        });

        const matchResult = await runMatchPipeline({
            userId: testUserId,
            jobDescriptionId: jdRecord._id,
            batchId: testBatchId
        });

        assert.deepEqual(matchResult.userId, testUserId);
        assert.deepEqual(matchResult.results.length, 1);
        assert.deepEqual(matchResult.results[0].candidateName, "John Doe");
        assert.ok(matchResult.results[0].finalScore > 0);

        const listRes = await getMatchResultsList(testUserId);
        assert.ok(listRes.matches.length >= 1);

        const getRes = await getMatchResultById(testUserId, matchResult._id);
        assert.deepEqual(getRes._id.toString(), matchResult._id.toString());

        // Cleanup
        await JobDescription.deleteOne({ _id: jdRecord._id });
        await Resume.deleteOne({ _id: resumeRecord._id });
        await MatchResult.deleteOne({ _id: matchResult._id });

    } finally {
        await mongoose.connection.close();
    }
});
