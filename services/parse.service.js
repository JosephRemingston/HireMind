import pdfParse from "pdf-parse";
import winkNLP from "wink-nlp";
import model from "wink-eng-lite-web-model";
import { pipeline } from "@xenova/transformers";

const nlp = winkNLP(model);

// ─── Skills Database ───────────────────────────────────────────────────────────

const SKILLS_DB = {
    "javascript":       "Languages",
    "typescript":       "Languages",
    "python":           "Languages",
    "java":             "Languages",
    "c++":              "Languages",
    "c#":               "Languages",
    "c":                "Languages",
    "go":               "Languages",
    "golang":           "Languages",
    "rust":             "Languages",
    "ruby":             "Languages",
    "php":              "Languages",
    "swift":            "Languages",
    "kotlin":           "Languages",
    "scala":            "Languages",
    "r":                "Languages",
    "matlab":           "Languages",
    "sql":              "Languages",
    "html":             "Languages",
    "css":              "Languages",
    "sass":             "Languages",
    "scss":             "Languages",
    "less":             "Languages",
    "graphql":          "Languages",
    "solidity":         "Languages",
    "elixir":           "Languages",
    "haskell":          "Languages",
    "perl":             "Languages",
    "shell":            "Languages",
    "bash":             "Languages",
    "powershell":       "Languages",
    "dart":             "Languages",

    "react":            "Frameworks",
    "react.js":         "Frameworks",
    "reactjs":          "Frameworks",
    "next.js":          "Frameworks",
    "nextjs":           "Frameworks",
    "next":             "Frameworks",
    "vue":              "Frameworks",
    "vue.js":           "Frameworks",
    "vuejs":            "Frameworks",
    "nuxt":             "Frameworks",
    "nuxt.js":          "Frameworks",
    "angular":          "Frameworks",
    "angularjs":        "Frameworks",
    "svelte":           "Frameworks",
    "sveltekit":        "Frameworks",
    "node.js":          "Frameworks",
    "nodejs":           "Frameworks",
    "node":             "Frameworks",
    "express":          "Frameworks",
    "express.js":       "Frameworks",
    "expressjs":        "Frameworks",
    "fastify":          "Frameworks",
    "nestjs":           "Frameworks",
    "nest.js":          "Frameworks",
    "django":           "Frameworks",
    "flask":            "Frameworks",
    "fastapi":          "Frameworks",
    "spring":           "Frameworks",
    "spring boot":      "Frameworks",
    "laravel":          "Frameworks",
    "rails":            "Frameworks",
    "ruby on rails":    "Frameworks",
    ".net":             "Frameworks",
    "asp.net":          "Frameworks",
    "dotnet":           "Frameworks",
    "gin":              "Frameworks",
    "fiber":            "Frameworks",
    "actix":            "Frameworks",
    "tailwind":         "Frameworks",
    "tailwindcss":      "Frameworks",
    "bootstrap":        "Frameworks",
    "material-ui":      "Frameworks",
    "mui":              "Frameworks",
    "chakra ui":        "Frameworks",
    "shadcn":           "Frameworks",
    "shadcn/ui":        "Frameworks",
    "jquery":           "Frameworks",
    "redux":            "Frameworks",
    "zustand":          "Frameworks",
    "recoil":           "Frameworks",
    "mobx":             "Frameworks",
    "axios":            "Frameworks",
    "socket.io":        "Frameworks",
    "websocket":        "Frameworks",
    "grpc":             "Frameworks",
    "webpack":          "Frameworks",
    "vite":             "Frameworks",
    "esbuild":          "Frameworks",
    "rollup":           "Frameworks",
    "parcel":           "Frameworks",
    "turborepo":        "Frameworks",

    "mongodb":          "Databases",
    "postgres":         "Databases",
    "postgresql":       "Databases",
    "mysql":            "Databases",
    "sqlite":           "Databases",
    "redis":            "Databases",
    "elasticsearch":    "Databases",
    "cassandra":        "Databases",
    "dynamodb":         "Databases",
    "firebase":         "Databases",
    "supabase":         "Databases",
    "planetscale":      "Databases",
    "mariadb":          "Databases",
    "neo4j":            "Databases",
    "couchdb":          "Databases",
    "cosmos db":        "Databases",
    "cosmosdb":         "Databases",
    "timescaledb":      "Databases",
    "clickhouse":       "Databases",
    "memcached":        "Databases",
    "prisma":           "Databases",
    "sequelize":        "Databases",
    "typeorm":          "Databases",
    "mongoose":         "Databases",
    "knex":             "Databases",
    "drizzle":          "Databases",

    "aws":              "Cloud",
    "amazon web services": "Cloud",
    "gcp":              "Cloud",
    "google cloud":     "Cloud",
    "google cloud platform": "Cloud",
    "azure":            "Cloud",
    "microsoft azure":  "Cloud",
    "heroku":           "Cloud",
    "vercel":           "Cloud",
    "netlify":          "Cloud",
    "cloudflare":       "Cloud",
    "digitalocean":     "Cloud",
    "linode":           "Cloud",
    "vultr":            "Cloud",
    "firebase":         "Cloud",
    "openstack":        "Cloud",
    "s3":               "Cloud",
    "lambda":           "Cloud",
    "ec2":              "Cloud",
    "cloudfront":       "Cloud",
    "cloudflare workers": "Cloud",
    "deno deploy":      "Cloud",
    "fly.io":           "Cloud",
    "render":           "Cloud",
    "railway":          "Cloud",

    "docker":           "DevOps",
    "kubernetes":       "DevOps",
    "k8s":              "DevOps",
    "terraform":        "DevOps",
    "ansible":          "DevOps",
    "jenkins":          "DevOps",
    "github actions":   "DevOps",
    "gitlab ci":        "DevOps",
    "gitlab ci/cd":     "DevOps",
    "circleci":         "DevOps",
    "travis ci":        "DevOps",
    "ci/cd":            "DevOps",
    "ci cd":            "DevOps",
    "prometheus":       "DevOps",
    "grafana":          "DevOps",
    "datadog":          "DevOps",
    "new relic":        "DevOps",
    "nagios":           "DevOps",
    "helm":             "DevOps",
    "istio":            "DevOps",
    "nginx":            "DevOps",
    "apache":           "DevOps",
    "caddy":            "DevOps",
    "vault":            "DevOps",
    "consul":           "DevOps",
    "packer":           "DevOps",

    "git":              "Tools",
    "github":           "Tools",
    "gitlab":           "Tools",
    "bitbucket":        "Tools",
    "jira":             "Tools",
    "confluence":       "Tools",
    "notion":           "Tools",
    "figma":            "Tools",
    "slack":            "Tools",
    "vscode":           "Tools",
    "vim":              "Tools",
    "neovim":           "Tools",
    "postman":          "Tools",
    "insomnia":         "Tools",
    "dbeaver":          "Tools",
    "datagrip":         "Tools",
    "intellij":         "Tools",
    "pycharm":          "Tools",
    "xcode":            "Tools",

    "jest":             "Testing",
    "mocha":            "Testing",
    "chai":             "Testing",
    "cypress":          "Testing",
    "playwright":       "Testing",
    "selenium":         "Testing",
    "puppeteer":        "Testing",
    "vitest":           "Testing",
    "pytest":           "Testing",
    "junit":            "Testing",
    "unittest":         "Testing",
    "rspec":            "Testing",
    "karma":            "Testing",
    "jasmine":          "Testing",
    "testing library":  "Testing",
    "enzyme":           "Testing",
    "supertest":        "Testing",
    "sonarqube":        "Testing",
    "cucumber":         "Testing",

    "machine learning": "Data/AI",
    "deep learning":    "Data/AI",
    "tensorflow":       "Data/AI",
    "pytorch":          "Data/AI",
    "keras":            "Data/AI",
    "scikit-learn":     "Data/AI",
    "sklearn":          "Data/AI",
    "pandas":           "Data/AI",
    "numpy":            "Data/AI",
    "scipy":            "Data/AI",
    "nlp":              "Data/AI",
    "computer vision":  "Data/AI",
    "opencv":           "Data/AI",
    "hugging face":     "Data/AI",
    "huggingface":      "Data/AI",
    "transformers":     "Data/AI",
    "llm":              "Data/AI",
    "gpt":              "Data/AI",
    "bert":             "Data/AI",
    "langchain":        "Data/AI",
    "openai":           "Data/AI",
    "anthropic":        "Data/AI",
    "gemini":           "Data/AI",
    "llamaindex":       "Data/AI",
    "rag":              "Data/AI",
    "vector database":  "Data/AI",
    "pinecone":         "Data/AI",
    "weaviate":         "Data/AI",
    "chroma":           "Data/AI",
    "chromadb":         "Data/AI",
    "milvus":           "Data/AI",
    "qdrant":           "Data/AI",
    "tableau":          "Data/AI",
    "power bi":         "Data/AI",
    "looker":           "Data/AI",
    "apache spark":     "Data/AI",
    "spark":            "Data/AI",
    "hadoop":           "Data/AI",
    "kafka":            "Data/AI",
    "airflow":          "Data/AI",
    "dbt":              "Data/AI",
    "snowflake":        "Data/AI",
    "databricks":       "Data/AI",
    "etl":              "Data/AI",

    "react native":     "Mobile",
    "flutter":          "Mobile",
    "ios":              "Mobile",
    "android":          "Mobile",
    "xamarin":          "Mobile",
    "ionic":            "Mobile",
    "capacitor":        "Mobile",
    "expo":             "Mobile",
    "swiftui":          "Mobile",
    "jetpack compose":  "Mobile",
    "kotlin multiplatform": "Mobile",

    "figma":            "Design",
    "sketch":           "Design",
    "adobe xd":         "Design",
    "photoshop":        "Design",
    "illustrator":      "Design",
    "canva":            "Design",
    "invision":         "Design",
    "zeplin":           "Design",
    "principle":        "Design",
    "framer":           "Design",
    "webflow":          "Design",
    "framer motion":    "Design",

    "agile":            "Methodologies",
    "scrum":            "Methodologies",
    "kanban":           "Methodologies",
    "sprint":           "Methodologies",
    "lean":             "Methodologies",
    "saas":             "Methodologies",
    "microservices":    "Methodologies",
    "serverless":       "Methodologies",
    "domain driven design": "Methodologies",
    "ddd":              "Methodologies",
    "tdd":              "Methodologies",
    "bdd":              "Methodologies",
    "pair programming": "Methodologies",
    "code review":      "Methodologies",
    "rest api":         "Methodologies",
    "restful":          "Methodologies",
    "rest":             "Methodologies",
    "websocket":        "Methodologies",
    "oauth":            "Methodologies",
    "jwt":              "Methodologies",
    "web security":     "Methodologies",
    "owasp":            "Methodologies",
};

// ─── Section Headings ──────────────────────────────────────────────────────────

const SECTION_PATTERNS = [
    { section: "summary",        regex: /^(?:summary|professional\s+summary|objective|career\s+objective|profile|about\s+me|personal\s+statement|career\s+summary)$/i },
    { section: "experience",     regex: /^(?:experience|work\s+experience|professional\s+experience|employment|employment\s+history|work\s+history|career\s+history|positions?\s+held)$/i },
    { section: "education",      regex: /^(?:education|academic|academics|education\s+background|educational\s+background|qualifications?|academic\s+background)$/i },
    { section: "skills",         regex: /^(?:skills?|technical\s+skills?|technologies|competencies|tech\s+stack|technical\s+expertise|core\s+competencies|key\s+skills?|proficiencies)$/i },
    { section: "projects",       regex: /^(?:projects?|portfolio|personal\s+projects?|key\s+projects?|side\s+projects?|notable\s+projects?)$/i },
    { section: "certifications", regex: /^(?:certifications?|licenses?|certificates?|professional\s+certifications?|licenses?\s*&?\s*certifications?)$/i },
    { section: "awards",         regex: /^(?:awards?|honors?|achievements?|recognition|accolades?)$/i },
    { section: "publications",   regex: /^(?:publications?|papers?|research|articles?|journal\s+entries?)$/i },
    { section: "languages",      regex: /^(?:languages?|foreign\s+languages?|spoken\s+languages?)$/i },
    { section: "volunteer",      regex: /^(?:volunteer|volunteering|community\s+service|extracurricular)$/i },
    { section: "interests",      regex: /^(?:interests?|hobbies|activities|additional)$/i },
];

// ─── Text Extraction ───────────────────────────────────────────────────────────

async function extractText(pdfBuffer) {
    const data = await pdfParse(pdfBuffer);
    return data.text;
}

// ─── Section Splitter ──────────────────────────────────────────────────────────

function splitSections(text) {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const sections = {};
    let currentSection = "header";
    sections[currentSection] = [];

    for (const line of lines) {
        const cleaned = line.replace(/[:\-_=]+$/, "").replace(/[:\-_=]+$/, "").trim();

        let matched = false;
        for (const { section, regex } of SECTION_PATTERNS) {
            if (regex.test(cleaned)) {
                currentSection = section;
                if (!sections[section]) sections[section] = [];
                matched = true;
                break;
            }
        }

        if (!matched) {
            sections[currentSection].push(line);
        }
    }

    for (const key of Object.keys(sections)) {
        sections[key] = sections[key].join("\n").trim();
    }

    return sections;
}

// ─── Contact Extraction ────────────────────────────────────────────────────────

function extractContact(rawText) {
    const emailMatch = rawText.match(
        /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/
    );

    const phoneMatch = rawText.match(
        /(?:\+?\d{1,3}[\s\-]?)?\(?\d{2,4}\)?[\s\-]?\d{3,4}[\s\-]?\d{3,4}/
    );

    const linkedinMatch = rawText.match(
        /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-_%]+/i
    );

    const githubMatch = rawText.match(
        /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9\-_]+/i
    );

    const locationPatterns = [
        /(?:Location|Address|City|Based in|Located in)\s*:\s*(.+)/i,
    ];
    let location = null;
    for (const pat of locationPatterns) {
        const m = rawText.match(pat);
        if (m) { location = m[1].trim(); break; }
    }

    return {
        email: emailMatch ? emailMatch[0] : null,
        phone: phoneMatch ? phoneMatch[0].trim() : null,
        linkedin: linkedinMatch ? linkedinMatch[0] : null,
        github: githubMatch ? githubMatch[0] : null,
        location,
    };
}

// ─── Name Extraction ───────────────────────────────────────────────────────────

function extractName(headerText, rawText) {
    if (headerText) {
        const lines = headerText.split("\n").map((l) => l.trim()).filter(Boolean);
        for (const line of lines) {
            if (/[@\d]/.test(line)) continue;
            if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/.test(line)) return line;
        }
        for (const line of lines) {
            if (/[@\d]/.test(line)) continue;
            const words = line.split(/\s+/);
            if (words.length >= 2 && words.length <= 5) return line;
        }
    }

    const doc = nlp.readDoc(rawText);
    const sentences = doc.sentences().out();
    for (const sent of sentences.slice(0, 3)) {
        const nameMatch = sent.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/);
        if (nameMatch) return nameMatch[1];
    }

    return null;
}

// ─── Date Extraction ───────────────────────────────────────────────────────────

function extractDates(text) {
    const patterns = [
        /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}\s*[-–—to]+\s*(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|Present|Current|Now)\s*,?\s*\d{0,4}/gi,
        /\d{1,2}\/\d{1,2}\/\d{2,4}\s*[-–—to]+\s*\d{1,2}\/\d{1,2}\/\d{2,4}/g,
        /\d{4}\s*[-–—to]+\s*(?:\d{4}|Present|Current|Now)/gi,
        /(?:Present|Current|Now)/gi,
    ];

    const dates = [];
    for (const pat of patterns) {
        const matches = text.match(pat);
        if (matches) dates.push(...matches);
    }
    return [...new Set(dates)];
}

// ─── Organization Extraction ───────────────────────────────────────────────────

function extractOrganizations(text) {
    const doc = nlp.readDoc(text);
    const tokens = doc.tokens().out();
    const capitalizedSequences = [];
    let current = [];

    for (const token of tokens) {
        if (/^[A-Z]/.test(token) && token.length > 1 && !/^[A-Z]{2,}$/.test(token)) {
            current.push(token);
        } else {
            if (current.length >= 2) {
                capitalizedSequences.push(current.join(" "));
            }
            current = [];
        }
    }
    if (current.length >= 2) capitalizedSequences.push(current.join(" "));

    return [...new Set(capitalizedSequences)];
}

// ─── Experience Parser ─────────────────────────────────────────────────────────

function parseExperience(experienceText) {
    if (!experienceText) return [];

    const blocks = experienceText.split(/\n\s*\n/).filter(Boolean);
    const entries = [];

    for (const block of blocks) {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.length === 0) continue;

        const titlePatterns = [
            /^(.+?)\s+at\s+(.+?)(?:\s*[,|]\s*(.+))?$/i,
            /^(.+?)(?:\s*[-–—|,]\s*)(.+?)(?:\s*[,|]\s*(.+))?$/,
        ];

        let title = null;
        let company = null;
        let dates = null;

        const firstLine = lines[0];
        let matched = false;

        for (const pat of titlePatterns) {
            const m = firstLine.match(pat);
            if (m) {
                title = m[1]?.trim();
                company = m[2]?.trim();
                dates = m[3]?.trim() || null;
                matched = true;
                break;
            }
        }

        if (!matched) {
            title = firstLine;
        }

        if (!dates) {
            const dateStr = lines.find((l) => /\d{4}/.test(l) || /present|current/i.test(l));
            if (dateStr) dates = dateStr.trim();
        }

        const descLines = lines.filter(
            (l) => l !== firstLine && l !== dates && !/^\d{4}/.test(l)
        );

        entries.push({
            title,
            company,
            dates,
            description: descLines.join("\n").trim() || null,
        });
    }

    return entries;
}

// ─── Education Parser ──────────────────────────────────────────────────────────

function parseEducation(educationText) {
    if (!educationText) return [];

    const blocks = educationText.split(/\n\s*\n/).filter(Boolean);
    const entries = [];

    for (const block of blocks) {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.length === 0) continue;

        const firstLine = lines[0];
        let degree = null;
        let institution = null;
        let field = null;
        let dates = null;

        const degreeMatch = firstLine.match(
            /(?:BS|BA|B\.?S\.?|B\.?A\.?|MS|MA|M\.?S\.?|M\.?A\.?|MBA|Ph\.?D\.?|Bachelor|Master|Associate|Diploma|B\.?Tech|M\.?Tech|B\.?Eng|M\.?Eng)\s+(?:of|in)\s+(.+?)(?:\s+at\s+(.+))?$/i
        );

        if (degreeMatch) {
            degree = firstLine.match(/(BS|BA|B\.?S\.?|B\.?A\.?|MS|MA|M\.?S\.?|M\.?A\.?|MBA|Ph\.?D\.?|Bachelor|Master|Associate|Diploma|B\.?Tech|M\.?Tech|B\.?Eng|M\.?Eng)/i)?.[0] || "Degree";
            field = degreeMatch[1]?.trim();
            institution = degreeMatch[2]?.trim() || null;
        } else {
            const parts = firstLine.split(/\s+at\s+/i);
            if (parts.length >= 2) {
                institution = parts.slice(1).join(" at ").trim();
                degree = parts[0].trim();
            } else {
                institution = firstLine;
            }
        }

        dates = lines.find((l) => /\d{4}/.test(l))?.trim() || null;

        entries.push({ institution, degree, field, dates });
    }

    return entries;
}

// ─── Projects Parser ───────────────────────────────────────────────────────────

function parseProjects(projectsText) {
    if (!projectsText) return [];

    const blocks = projectsText.split(/\n\s*\n/).filter(Boolean);
    const entries = [];

    for (const block of blocks) {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.length === 0) continue;

        const name = lines[0].replace(/[:\-]+$/, "").trim();
        const description = lines.slice(1).join(" ").trim() || null;

        entries.push({ name, description });
    }

    return entries;
}

// ─── Skills Extraction ─────────────────────────────────────────────────────────

function extractSkills(text) {
    if (!text) return [];

    const normalized = text.toLowerCase();
    const found = [];

    for (const [skill, category] of Object.entries(SKILLS_DB)) {
        const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const pattern = new RegExp(`(?:^|[\\s,;|/()])${escaped}(?:[\\s,;|/()]|$)`, "i");
        if (pattern.test(normalized)) {
            found.push({
                name: skill,
                category,
            });
        }
    }

    const seen = new Set();
    return found.filter((s) => {
        if (seen.has(s.name)) return false;
        seen.add(s.name);
        return true;
    });
}

// ─── Entity Extraction (wink-nlp) ──────────────────────────────────────────────

function extractEntities(text) {
    const doc = nlp.readDoc(text);
    const dates = extractDates(text);
    const organizations = extractOrganizations(text);

    return { dates, organizations };
}

// ─── Embedding Generation ──────────────────────────────────────────────────────

let embeddingPipeline = null;

async function generateEmbedding(parsedData) {
    if (!embeddingPipeline) {
        embeddingPipeline = await pipeline(
            "feature-extraction",
            "Xenova/all-MiniLM-L6-v2"
        );
    }

    const parts = [];
    if (parsedData.contact?.name) parts.push(`Name: ${parsedData.contact.name}`);
    if (parsedData.summary) parts.push(`Summary: ${parsedData.summary}`);
    if (parsedData.skills?.length) {
        parts.push(`Skills: ${parsedData.skills.map((s) => s.name).join(", ")}`);
    }
    if (parsedData.experience?.length) {
        for (const exp of parsedData.experience) {
            const desc = [exp.title, exp.company, exp.description].filter(Boolean).join(" ");
            parts.push(`Experience: ${desc}`);
        }
    }
    if (parsedData.education?.length) {
        for (const edu of parsedData.education) {
            const desc = [edu.degree, edu.field, edu.institution].filter(Boolean).join(" ");
            parts.push(`Education: ${desc}`);
        }
    }

    const text = parts.join(". ") || "Empty resume";
    const output = await embeddingPipeline(text, {
        pooling: "mean",
        normalize: true,
    });

    return Array.from(output.data);
}

// ─── Main Orchestrator ─────────────────────────────────────────────────────────

async function parseResume(pdfBuffer) {
    const rawText = await extractText(pdfBuffer);
    const sections = splitSections(rawText);

    const contact = extractContact(rawText);
    contact.name = extractName(sections.header || "", rawText);

    const experience = parseExperience(sections.experience);
    const education = parseEducation(sections.education);
    const projects = parseProjects(sections.projects);

    const certifications = sections.certifications
        ? sections.certifications.split("\n").map((l) => l.trim()).filter(Boolean).map((line) => ({ name: line }))
        : [];

    const skills = extractSkills(
        [sections.skills, sections.header, rawText].filter(Boolean).join("\n")
    );

    const entities = extractEntities(rawText);

    const parsedData = {
        contact,
        summary: sections.summary || null,
        experience,
        education,
        skills,
        projects,
        certifications,
        awards: sections.awards || null,
        languages: sections.languages || null,
        volunteer: sections.volunteer || null,
        interests: sections.interests || null,
        publications: sections.publications || null,
        detectedDates: entities.dates,
        detectedOrganizations: entities.organizations,
        rawText,
    };

    const embedding = await generateEmbedding(parsedData);

    return { parsedData, embedding };
}

export { parseResume, extractText, splitSections, extractSkills, generateEmbedding };
