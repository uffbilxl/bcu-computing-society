/* Hard-skill dictionary for computing CVs. Each entry is the display name
 * followed by the other ways people write it; matching is case-insensitive
 * on whole terms, so "java" never matches inside "javascript".
 *
 * An ATS ranks on the literal terms a recruiter searches for, so this list
 * is what "does this CV contain searchable skills" and the job-description
 * match are both measured against. */

const RAW: string[][] = [
  // Languages
  ['Python'], ['Java'], ['JavaScript', '=JS', 'ecmascript', 'es6'], ['TypeScript', '=TS'],
  ['C++', 'cpp'], ['C#', 'csharp', 'c sharp'], ['Rust'], ['Kotlin'], ['=Swift'], ['PHP'],
  ['Ruby'], ['Scala'], ['Dart'], ['Haskell'], ['Perl'], ['Lua'], ['MATLAB'], ['Julia'],
  ['Objective-C'], ['Assembly', 'asm', 'x86 assembly', 'arm assembly'], ['Bash', 'shell scripting', 'shell script', 'zsh'],
  ['PowerShell'], ['SQL'], ['PL/SQL', 'plsql'], ['T-SQL', 'tsql'], ['HTML', 'html5'], ['CSS', 'css3'],
  ['Sass', 'scss'], ['Solidity'], ['VBA'], ['Golang'], ['Elixir'], ['Groovy'], ['COBOL'], ['Fortran'], ['Prolog'],
  ['VHDL'], ['Verilog'],

  // Front end
  ['React', 'react.js', 'reactjs'], ['Next.js', 'nextjs'], ['Vue', 'vue.js', 'vuejs'], ['Nuxt', 'nuxt.js'],
  ['Angular', 'angularjs'], ['Svelte', 'sveltekit'], ['Redux'], ['Tailwind', 'tailwind css', 'tailwindcss'],
  ['Bootstrap'], ['jQuery'], ['Webpack'], ['Vite'], ['Material UI', 'mui'], ['Three.js', 'threejs'],
  ['React Native'], ['Flutter'], ['Expo'], ['SwiftUI'], ['Jetpack Compose'], ['Android'], ['iOS'],
  ['Figma'], ['Responsive Design'], ['Accessibility', 'wcag', 'a11y'], ['WebSockets', 'websocket'],

  // Back end
  ['Node.js', 'nodejs', '=Node'], ['Express.js', 'expressjs', '=Express'], ['NestJS', 'nest.js'],
  ['Django'], ['Flask'], ['FastAPI'], ['Spring Boot', 'springboot', 'spring framework', 'spring mvc'], ['.NET', 'dotnet', 'asp.net', '.net core'],
  ['Laravel'], ['Ruby on Rails', 'rails'], ['GraphQL'], ['REST APIs', '=REST', 'rest api', 'rest apis', 'restful', 'restful api', 'restful apis'],
  ['gRPC'], ['Microservices', 'microservice'], ['OAuth', 'oauth2', 'oauth 2.0'], ['JWT'], ['Prisma'],
  ['Hibernate'], ['Entity Framework'], ['RabbitMQ'], ['Kafka', 'apache kafka'], ['Nginx'], ['Apache'],

  // Data stores
  ['PostgreSQL', 'postgres'], ['MySQL'], ['SQLite'], ['MongoDB', 'mongo'], ['Redis'], ['Oracle'],
  ['SQL Server', 'mssql', 'ms sql'], ['DynamoDB'], ['Firebase', 'firestore'], ['Supabase'], ['Cassandra'],
  ['Elasticsearch', 'elastic search'], ['Neo4j'], ['MariaDB'], ['Snowflake'], ['BigQuery'], ['NoSQL'],

  // Cloud & DevOps
  ['AWS', 'amazon web services'], ['Azure', 'microsoft azure'], ['GCP', 'google cloud', 'google cloud platform'],
  ['Docker'], ['Kubernetes', 'k8s'], ['Terraform'], ['Ansible'], ['Jenkins'], ['GitHub Actions'],
  ['GitLab CI', 'gitlab ci/cd'], ['CI/CD', 'ci cd', 'continuous integration', 'continuous deployment', 'continuous delivery'],
  ['Git'], ['GitHub'], ['GitLab'], ['Bitbucket'], ['Linux'], ['Unix'], ['Ubuntu'], ['Windows Server'],
  ['Vercel'], ['Netlify'], ['Heroku'], ['AWS Lambda', '=Lambda'], ['EC2'], ['S3'], ['Serverless'],
  ['DevOps'], ['Prometheus'], ['Grafana'], ['Helm'], ['CloudFormation'], ['Infrastructure as Code', 'iac'],

  // Data & AI
  ['Machine Learning', '=ML'], ['Deep Learning'], ['Artificial Intelligence', '=AI'], ['NLP', 'natural language processing'],
  ['Computer Vision'], ['LLM', 'llms', 'large language models', 'large language model'], ['Generative AI', 'genai', 'gen ai'],
  ['RAG', 'retrieval augmented generation', 'retrieval-augmented generation'], ['Prompt Engineering'],
  ['TensorFlow'], ['PyTorch'], ['Keras'], ['scikit-learn', 'sklearn', 'scikit learn'], ['Pandas'], ['NumPy'],
  ['Matplotlib'], ['Seaborn'], ['Jupyter', 'jupyter notebook', 'jupyter notebooks'], ['OpenCV'], ['Hugging Face', 'huggingface'],
  ['LangChain'], ['Spark', 'apache spark', 'pyspark'], ['Hadoop'], ['Airflow', 'apache airflow'], ['dbt'],
  ['ETL', 'elt'], ['Data Analysis', 'data analytics'], ['Data Visualisation', 'data visualization'],
  ['Data Science'], ['Data Engineering'], ['Statistics', 'statistical analysis'], ['Power BI', 'powerbi'], ['Tableau'],
  ['Excel', '=Excel', 'microsoft excel', 'ms excel'], ['Neural Networks', 'neural network'], ['Reinforcement Learning'], ['XGBoost'],
  ['Time Series'], ['A/B Testing', 'ab testing'], ['Databricks'], ['Looker'],

  // Cyber security
  ['Cyber Security', 'cybersecurity', 'information security', 'infosec'], ['Penetration Testing', 'pen testing', 'pentesting', 'pentest'],
  ['Wireshark'], ['Nmap'], ['Metasploit'], ['Burp Suite', 'burpsuite'], ['Kali Linux', 'kali'], ['SIEM'], ['Splunk'],
  ['OWASP', 'owasp top 10'], ['Incident Response'], ['Threat Modelling', 'threat modeling'], ['Vulnerability Assessment', 'vulnerability management', 'vulnerability scanning'],
  ['Cryptography', 'encryption'], ['ISO 27001'], ['NIST'], ['GDPR'], ['Cyber Essentials'], ['=SOC'], ['Firewalls', 'firewall'],
  ['IDS/IPS', '=IDS', '=IPS', 'intrusion detection'], ['Active Directory'], ['IAM', 'identity and access management'],
  ['Digital Forensics', 'forensics'], ['Malware Analysis'], ['Reverse Engineering'], ['Nessus'], ['CTF', 'capture the flag'],
  ['Network Security'], ['Zero Trust'], ['Ethical Hacking'], ['Risk Assessment', 'risk management'],

  // Networking & systems
  ['Networking', 'computer networks'], ['TCP/IP', 'tcp'], ['DNS'], ['HTTP', 'https'], ['VPN'], ['Cisco'],
  ['Operating Systems'], ['Virtualisation', 'virtualization', 'vmware', 'virtualbox'], ['Embedded Systems', 'embedded'],
  ['Raspberry Pi'], ['Arduino'], ['IoT', 'internet of things'], ['Distributed Systems'], ['Concurrency', 'multithreading'],

  // Engineering practice
  ['Agile'], ['Scrum'], ['Kanban'], ['Jira'], ['Confluence'], ['TDD', 'test driven development', 'test-driven development'],
  ['Unit Testing', 'unit tests'], ['Integration Testing'], ['Jest'], ['Pytest'], ['JUnit'], ['Selenium'], ['Cypress'],
  ['Playwright'], ['Postman'], ['OOP', 'object oriented programming', 'object-oriented programming', 'object oriented', 'object-oriented'],
  ['Data Structures'], ['Algorithms'], ['Design Patterns'], ['System Design'], ['Code Review', 'code reviews'],
  ['Version Control'], ['API', 'apis', 'api design', 'api development'], ['SDLC', 'software development life cycle', 'software development lifecycle'],
  ['UML'], ['Debugging'], ['Automation'], ['Functional Programming'], ['MVC'], ['Web Scraping'],
  ['UX', '=UX', 'user experience', 'ui/ux', 'ux design'], ['UI', '=UI', 'user interface', 'ui design'], ['=Unity'], ['Unreal Engine', 'unreal'],
  ['Blockchain'], ['Salesforce'], ['=SAP'], ['ServiceNow'], ['SharePoint'], ['Microsoft 365', 'office 365', 'microsoft office'],
  ['Stakeholder Management'], ['Project Management'], ['Technical Documentation', 'documentation'],
]

/* One-letter and common-word languages can't be matched loosely: "C" is a
 * grade, "R" an initial, "Go" a verb. They only count when written exactly
 * like this, as a list item. */
const AMBIGUOUS = ['C', 'R', 'Go']

interface Skill {
  name: string
  patterns: RegExp[]
}

const EDGE = 'a-z0-9+#'

/* A leading "=" marks a term that is also an ordinary word or too short to
 * match loosely ("Excel", "REST", "AI"): it must appear with that exact
 * capitalisation. */
function termPattern(term: string): RegExp {
  const exact = term.startsWith('=')
  const body = exact ? term.slice(1) : term.toLowerCase()
  const escaped = body.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&').replace(/\s+/g, '[\\s-]+')
  return exact
    ? new RegExp(`(^|[^A-Za-z0-9+#])${escaped}(?![A-Za-z0-9+#])`)
    : new RegExp(`(^|[^${EDGE}])${escaped}(?![${EDGE}])`, 'i')
}

const SKILLS: Skill[] = RAW.map(terms => ({
  name: terms[0].replace(/^=/, ''),
  // A loose term is dropped when an exact-case twin of it is listed.
  patterns: terms.filter(t => !terms.includes(`=${t}`)).map(termPattern),
}))

const AMBIGUOUS_PATTERNS = AMBIGUOUS.map(name => ({
  name,
  // Case-sensitive, and only as an item in a list: after a comma, slash,
  // colon, bullet or "and", or before a comma or slash.
  pattern: new RegExp(`(?:[,/:•|(]\\s*|\\band\\s+|\\bor\\s+)${name}(?=\\s*(?:[,/;|).]|$|\\band\\b))|(?:^|\\s)${name}(?=\\s*[,/])`, 'm'),
}))

/** Every dictionary skill that appears in the text, in dictionary order. */
export function findSkills(text: string): string[] {
  const found: string[] = []
  for (const skill of SKILLS) {
    if (skill.patterns.some(p => p.test(text))) found.push(skill.name)
  }
  for (const { name, pattern } of AMBIGUOUS_PATTERNS) {
    if (pattern.test(text)) found.push(name)
  }
  return found
}
