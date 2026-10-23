import { GoogleGenerativeAI } from '@google/generative-ai';
import { config, isLiveMode } from '../config.js';
import { SYSTEM_PROMPT, buildChatUserPrompt } from './prompts.js';
import { RetrievalResult } from '../rag/ragService.js';

export interface ChatResponsePayload {
  answer: string;
  analogy?: string;
  followUp?: string;
  mode: 'live' | 'demo';
  sources: RetrievalResult['sources'];
}

export interface QuizQuestionData {
  quizId: string;
  topic: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  misconceptionCorrection: string;
  disclaimer: string;
}

type Intent = 'greeting' | 'thanks' | 'help' | 'clarification' | 'az900';

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    if (isLiveMode) {
      try {
        this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
        console.log(`[Gemini] Initialized live SDK with model: ${config.geminiModel}`);
      } catch (err) {
        console.error('[Gemini] Initialization error; fallback to demo mode enabled.', err);
      }
    } else {
      console.log('[Gemini] Running in DEMO MODE (No valid GEMINI_API_KEY detected).');
    }
  }

  public async generateChatResponse(
    message: string,
    retrieval: RetrievalResult,
    action?: 'explain' | 'simplify' | 'example' | 'compare' | 'test_me',
    history?: Array<{ role: string; content: string }>,
    intent?: Intent
  ): Promise<ChatResponsePayload> {
    if (isLiveMode && this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: config.geminiModel,
          systemInstruction: SYSTEM_PROMPT
        });

        // Build prior conversation history for the Gemini chat session
        const geminiHistory = (history || []).map((turn) => ({
          role: turn.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: turn.content }]
        }));

        const chat = model.startChat({ history: geminiHistory });

        const promptText = buildChatUserPrompt(
          message,
          retrieval.contextText,
          action,
          retrieval.isLogisticsQuery,
          retrieval.hasGroundedSupport
        );

        const result = await chat.sendMessage(promptText);
        const text = result.response.text();

        return {
          answer: text,
          mode: 'live',
          sources: retrieval.sources
        };
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        // Surface quota / rate-limit errors transparently
        if (errMsg.includes('429') || errMsg.toLowerCase().includes('quota')) {
          return {
            answer:
              '⚠️ **API quota limit reached.** The live Gemini model is temporarily unavailable. Falling back to grounded demo responses. Please retry in a moment.',
            mode: 'demo',
            sources: retrieval.sources
          };
        }
        console.error('[Gemini] Live API call failed, falling back to demo mode:', errMsg);
      }
    }

    // Demo Mode Response
    return this.generateDemoResponse(message, retrieval, action, intent);
  }

  public async generateQuizQuestion(topic: string, _context?: string): Promise<QuizQuestionData> {
    const quizId = `qz_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Curated high-yield practice questions adhering to AZ-900 guidelines
    const bank: Record<string, Array<Omit<QuizQuestionData, 'quizId' | 'topic' | 'disclaimer'>>> = {
      cloud_concepts: [
        {
          question:
            'Under the Azure Shared Responsibility Model, which responsibility is ALWAYS the customer\'s responsibility regardless of cloud service model (IaaS, PaaS, or SaaS)?',
          options: [
            'Physical datacenter security',
            'Operating system patch management',
            'Data governance and information classification',
            'Physical network maintenance'
          ],
          correctOptionIndex: 2,
          explanation:
            'In all cloud models (IaaS, PaaS, and SaaS), the customer always retains full responsibility for their data, information, devices, and access management.',
          misconceptionCorrection:
            'A common misconception is thinking SaaS transfers data security to the cloud provider. While the SaaS provider runs the application and infrastructure, the customer still owns and governs their data.'
        },
        {
          question:
            'A startup wants to pay only for the compute time their microservices actually consume while processing events, without provisioning idle virtual machines. Which cloud model best fits?',
          options: [
            'Capital Expenditure (CapEx) model',
            'Serverless / Consumption-based compute',
            'Dedicated Private Cloud host',
            'Traditional Bare-Metal leasing'
          ],
          correctOptionIndex: 1,
          explanation:
            'Serverless (consumption-based) computing charges strictly for compute resources executed per event, scaling automatically to zero when idle.',
          misconceptionCorrection:
            'Do not confuse IaaS virtual machines with Serverless. In IaaS, you pay for virtual machine running time even if CPU usage is 0%.'
        }
      ],
      architecture_services: [
        {
          question:
            'Which Azure Storage redundancy option replicates data synchronously across three availability zones within the primary region?',
          options: [
            'Locally Redundant Storage (LRS)',
            'Zone-Redundant Storage (ZRS)',
            'Geo-Redundant Storage (GRS)',
            'Read-Access Geo-Zone-Redundant Storage (RA-GZRS)'
          ],
          correctOptionIndex: 1,
          explanation:
            'ZRS replicates data synchronously across three separate Availability Zones in the primary region, safeguarding against datacenter-level failures.',
          misconceptionCorrection:
            'LRS also makes 3 copies, but all 3 copies reside in a single physical facility. ZRS distributes those copies across distinct physical zones with independent power and cooling.'
        },
        {
          question:
            'What is the maximum scope to which an Azure Resource Group can belong?',
          options: [
            'Multiple Azure Subscriptions',
            'A single Azure Subscription',
            'Directly to an Azure Management Group without a subscription',
            'An Availability Set'
          ],
          correctOptionIndex: 1,
          explanation:
            'Every Azure Resource Group belongs to exactly one Azure subscription. Resources within the group can reside in different regions, but the group itself is scoped to one subscription.',
          misconceptionCorrection:
            'Learners often think resources inside a group must be in the same region as the group. In reality, a resource group can hold resources from multiple global regions.'
        }
      ],
      management_governance: [
        {
          question:
            'Which Azure tool automatically evaluates your deployed resources and delivers actionable recommendations across Cost, Security, Reliability, Operational Excellence, and Performance?',
          options: [
            'Azure Advisor',
            'Azure Cost Management + Billing only',
            'Microsoft Purview',
            'Azure Application Gateway'
          ],
          correctOptionIndex: 0,
          explanation:
            'Azure Advisor is the centralized recommendation engine covering all five pillars of the Azure Well-Architected Framework.',
          misconceptionCorrection:
            'While Azure Cost Management displays billing insights, Azure Advisor is the holistic advisor providing proactive architectural recommendations.'
        },
        {
          question:
            'An administrator needs to prevent critical production databases from being accidentally deleted, while still allowing developers to update tables and schemas. Which mechanism should be applied?',
          options: [
            'Azure Policy ReadOnly constraint',
            'A CanNotDelete (Delete) Resource Lock',
            'Microsoft Entra Conditional Access',
            'Network Security Group outbound deny'
          ],
          correctOptionIndex: 1,
          explanation:
            'A "CanNotDelete" lock prevents authorized users from deleting a resource, but still allows them to read and modify resource contents.',
          misconceptionCorrection:
            'A ReadOnly lock would block modifications to the database configurations as well. CanNotDelete allows reads and updates while blocking deletion.'
        }
      ],
      exam_logistics: [
        {
          question:
            'During a Pearson OnVUE online proctored exam, what is the policy regarding headsets, wireless earbuds, or headphones?',
          options: [
            'Allowed if wired and plugged into the laptop',
            'Prohibited unless an explicit pre-approved medical/testing accommodation was granted',
            'Allowed for listening to proctor instructions only',
            'Allowed if volume is below 50%'
          ],
          correctOptionIndex: 1,
          explanation:
            'Pearson OnVUE strictly prohibits all headphones, earbuds, and headsets. Audio must come through the computer\'s built-in speakers and microphone.',
          misconceptionCorrection:
            'Candidates often assume wired headphones are acceptable since Bluetooth is disabled. OnVUE bans all forms of headphones to maintain test security.'
        }
      ]
    };

    const targetTopic = bank[topic] ? topic : 'cloud_concepts';
    const list = bank[targetTopic] || bank.cloud_concepts;
    const item = list[Math.floor(Math.random() * list.length)];

    return {
      quizId,
      topic: targetTopic,
      question: item.question,
      options: item.options,
      correctOptionIndex: item.correctOptionIndex,
      explanation: item.explanation,
      misconceptionCorrection: item.misconceptionCorrection,
      disclaimer: 'Practice questions, not official exam questions.'
    };
  }

  private generateDemoResponse(
    message: string,
    retrieval: RetrievalResult,
    action?: 'explain' | 'simplify' | 'example' | 'compare' | 'test_me',
    _intent?: Intent
  ): ChatResponsePayload {
    const lower = message.toLowerCase();

    // ---- Exam Logistics ----
    if (retrieval.isLogisticsQuery || lower.includes('onvue') || lower.includes('proctor') || lower.includes('webcam') || lower.includes('headphone')) {
      return {
        mode: 'demo',
        answer: `### 🎯 Pearson OnVUE Online Exam Day Rules\n\nWhen taking your AZ-900 exam through online proctoring, Pearson OnVUE enforces strict security requirements:\n\n1. **Clean Desk Policy**: Your testing desk must be completely clear of electronics, notes, papers, watches, and writing utensils. Only your computer and mouse are permitted.\n2. **Audio & Devices**: Headphones, earbuds, and headsets are strictly prohibited. You must use your computer's built-in speakers and microphone.\n3. **Identification**: You must present a valid government-issued photo ID (such as a passport or driver's licence) whose name matches your exam registration exactly.\n4. **Environment**: You must remain alone in a private, quiet room with the door closed. Nobody may enter or speak to you during the session.\n\n> 💡 *Tip: Run the official OnVUE system test on the exact laptop and internet connection you plan to use at least 48 hours before test day!*`,
        analogy: `Think of online proctoring like boarding an international flight at airport security: every item in your pockets and on your desk is inspected, and you must verify your identity with official credentials before takeoff.`,
        followUp: `Would you like to test your understanding of online proctoring rules with a quick practice question?`,
        sources: retrieval.sources
      };
    }

    // ---- IaaS / PaaS / SaaS ----
    if (lower.includes('iaas') || lower.includes('paas') || lower.includes('saas') || lower.includes('service model')) {
      if (action === 'simplify') {
        return {
          mode: 'demo',
          answer: `### ☁️ IaaS, PaaS, and SaaS in Plain English\n\n- **IaaS (Infrastructure as a Service)**: Azure gives you the empty hardware and cables (like a virtual computer). You install Windows/Linux and take care of all software updates.\n- **PaaS (Platform as a Service)**: Azure gives you the runtime ready to go (like Azure App Service). You just bring your application code, and Azure manages the operating system.\n- **SaaS (Software as a Service)**: A complete ready-to-use software delivered over the internet (like Microsoft 365 or OneDrive). You just use the app!`,
          analogy: `Imagine getting a meal: IaaS is buying raw ingredients and cooking from scratch; PaaS is getting pizza delivered to bake in your oven; SaaS is dining at a restaurant where everything is made and cleaned up for you!`,
          followUp: `If an organization wants to deploy custom code without having to patch the underlying Windows OS, which model should they select?`,
          sources: retrieval.sources
        };
      }
      return {
        mode: 'demo',
        answer: `### ☁️ Cloud Service Models: IaaS vs. PaaS vs. SaaS\n\nUnder Azure Fundamentals, cloud services are categorized by how much control and maintenance you keep versus what Microsoft manages:\n\n1. **IaaS (Infrastructure as a Service)**:\n   - *Examples*: Azure Virtual Machines, Virtual Networks.\n   - *Responsibility*: You manage the OS, middleware, runtime, and apps. Microsoft manages physical servers, storage, and networking.\n\n2. **PaaS (Platform as a Service)**:\n   - *Examples*: Azure App Service, Azure SQL Database.\n   - *Responsibility*: You focus entirely on deploying your applications and configuring user access. Microsoft handles OS patching, scaling, and hardware.\n\n3. **SaaS (Software as a Service)**:\n   - *Examples*: Microsoft 365, Dynamics 365.\n   - *Responsibility*: Fully managed end-user applications accessed via web browsers. You only manage user permissions and your data.`,
        analogy: `**Renting Analogy**: \n- **IaaS** is leasing an empty warehouse: you build the interior walls and install your own equipment.\n- **PaaS** is renting a fully furnished commercial office space: utilities and maintenance are handled, so you just plug in your laptops and work.\n- **SaaS** is booking an all-inclusive hotel suite: everything is provided, cleaned, and operated for you.`,
        followUp: `What is one key security responsibility that ALWAYS stays with the customer across all three models?`,
        sources: retrieval.sources
      };
    }

    // ---- Storage Redundancy ----
    if (lower.includes('storage') || lower.includes('lrs') || lower.includes('zrs') || lower.includes('grs') || lower.includes('redundancy')) {
      return {
        mode: 'demo',
        answer: `### 💾 Azure Storage Redundancy Options\n\nAzure Storage always replicates multiple copies of your data to guard against transient hardware failures:\n\n- **LRS (Locally Redundant Storage)**: Replicates **3 synchronous copies** within a single physical facility in the primary region. Protects against individual disk or rack failure at the lowest cost.\n- **ZRS (Zone-Redundant Storage)**: Replicates data synchronously across **3 separate Availability Zones** in the primary region. Protects against a complete datacenter loss.\n- **GRS (Geo-Redundant Storage)**: Uses LRS in the primary region (3 copies), and asynchronously replicates 3 additional copies to a paired secondary region hundreds of miles away (6 copies total).\n- **GZRS (Geo-Zone-Redundant Storage)**: Uses ZRS in the primary region, plus LRS in the secondary region for maximum enterprise durability.`,
        analogy: `**Water Storage Analogy**: \n- **LRS** is having 3 interconnected water tanks in your backyard (if the yard floods, all 3 are impacted).\n- **ZRS** is having 1 water tank in your house, 1 in a neighbor's house, and 1 at your community center across town.\n- **GRS** is having 3 tanks in Nairobi, and a backup system of 3 tanks in Mombasa!`,
        followUp: `If an application requires protection against a total datacenter outage while keeping all data within a single geographical region, which tier is optimal?`,
        sources: retrieval.sources
      };
    }

    // ---- Azure Pricing / Cost ----
    if (lower.includes('pricing') || lower.includes('cost') || lower.includes('billing') || lower.includes('pay-as-you-go') || lower.includes('capex') || lower.includes('opex')) {
      return {
        mode: 'demo',
        answer: `### 💰 Azure Pricing Models\n\nOne of the biggest advantages of Azure is its flexible cost model:\n\n1. **Pay-As-You-Go (OpEx)**: You pay only for what you use — compute, storage, and bandwidth — on a per-second or per-hour basis. No upfront commitment.\n2. **Reserved Instances**: Commit to 1 or 3 years on specific VM sizes and receive up to **72% discount** vs. pay-as-you-go pricing.\n3. **Azure Hybrid Benefit**: Use existing on-premises Windows Server or SQL Server licences to save up to 40% on Azure VMs.\n4. **Azure Spot VMs**: Access spare compute capacity at up to 90% discount — suitable for interruptible workloads like batch processing.\n\n**CapEx vs OpEx**:\n- **CapEx** (Capital Expenditure): Traditional up-front investment in physical servers and data centers.\n- **OpEx** (Operational Expenditure): Cloud spending — pay as you consume, charged as an operating expense.`,
        analogy: `Think of Azure pricing like a taxi vs. car ownership: CapEx is buying a car (big upfront cost, you own it), while OpEx is using a taxi app — you pay per ride, scale up during rush hour, and pay nothing when you're not travelling!`,
        followUp: `If a company wants to run a 24/7 production database workload for the next 2 years at the lowest possible cost, which Azure pricing option would you recommend?`,
        sources: retrieval.sources
      };
    }

    // ---- Shared Responsibility Model ----
    if (lower.includes('shared responsibility') || lower.includes('responsibility model')) {
      return {
        mode: 'demo',
        answer: `### 🛡️ Azure Shared Responsibility Model\n\nThe Shared Responsibility Model defines which security tasks Microsoft handles and which remain with you:\n\n| Responsibility | On-Premises | IaaS | PaaS | SaaS |\n|---|---|---|---|---|\n| Data & access management | You | **You** | **You** | **You** |\n| Applications | You | You | You | Microsoft |\n| Operating system | You | You | Microsoft | Microsoft |\n| Physical infrastructure | You | Microsoft | Microsoft | Microsoft |\n\n**Always yours (regardless of model)**: Your data, identities, access management, and devices.\n**Always Microsoft's**: Physical datacenters, network hardware, and the host infrastructure.`,
        analogy: `It's like renting an apartment: the building owner (Microsoft) secures the lobby, lifts, and plumbing. You (the tenant) are responsible for locking your apartment door, safeguarding your valuables, and keeping your guests from causing damage.`,
        followUp: `Under a SaaS model, which single responsibility can the customer never delegate to Microsoft?`,
        sources: retrieval.sources
      };
    }

    // ---- Azure Regions / Availability Zones ----
    if (lower.includes('region') || lower.includes('availability zone') || lower.includes('datacenter') || lower.includes('geography')) {
      return {
        mode: 'demo',
        answer: `### 🌍 Azure Regions and Availability Zones\n\n**Azure Region**: A geographic area (e.g., "East US", "UK South") containing one or more physical datacenters connected by a dedicated low-latency network.\n\n**Availability Zone (AZ)**: A physically separate datacenter within a region with its own power, cooling, and networking. Each region with AZ support has at least 3 zones.\n\n**Region Pairs**: Azure pairs each region with another in the same geography (e.g. East US ↔ West US) for disaster recovery. Updates are rolled out to one region at a time.\n\n**Key rules to remember**:\n- Resource Groups do **not** have to be in the same region as their resources.\n- Some services are **global** (Azure AD, Azure DNS) and are not region-specific.\n- Availability Zones protect against **datacenter-level** failure; Regions protect against **regional** disasters.`,
        analogy: `Think of Azure as a global bank chain: a **Region** is a city branch, **Availability Zones** are separate buildings in that city (so if one building catches fire, the others keep operating), and **Region Pairs** are the bank's backup offices in a different city that activate if the whole city is affected.`,
        followUp: `If a company wants to ensure their app survives a single datacenter failure without routing traffic to another region, which infrastructure feature should they use?`,
        sources: retrieval.sources
      };
    }

    // ---- Azure Advisor / Governance tools ----
    if (lower.includes('advisor') || lower.includes('azure policy') || lower.includes('management group') || lower.includes('resource lock') || lower.includes('governance')) {
      return {
        mode: 'demo',
        answer: `### 🏛️ Azure Governance Tools\n\nAzure provides several tools for controlling and managing your cloud environment:\n\n1. **Azure Advisor**: Scans your deployed resources and provides free recommendations across 5 pillars — Cost, Security, Reliability, Operational Excellence, and Performance.\n\n2. **Azure Policy**: Enforce organizational standards at scale. Policies can **audit**, **deny**, or **auto-remediate** non-compliant resources (e.g. "All resources must be tagged with 'cost-center'").\n\n3. **Resource Locks**: Prevent accidental changes to critical resources:\n   - **CanNotDelete**: Allows reads and updates but blocks deletion.\n   - **ReadOnly**: Blocks all writes (use with care — many management operations require writes).\n\n4. **Management Groups**: Organize subscriptions into a hierarchy above the subscription level. Policies applied at a Management Group cascade to all child subscriptions.`,
        analogy: `Azure Policy is like a company HR policy: it applies the same rules to every department (subscription) from the top. Azure Advisor is your operations manager walking the floor and recommending efficiency improvements. Resource Locks are like a "Do Not Delete" label on critical server equipment — only authorized people with the right process can remove it.`,
        followUp: `A company wants to prevent developers from creating VM sizes larger than D4s_v3 in any of its 20 subscriptions. What is the most efficient Azure governance tool to achieve this?`,
        sources: retrieval.sources
      };
    }

    // ---- Insufficient grounding fallback (explicit about uncertainty) ----
    if (!retrieval.hasGroundedSupport) {
      return {
        mode: 'demo',
        answer: `I wasn't able to find specific AZ-900 reference material in my knowledge base for **"${message}"**.\n\nThis topic may be covered in the official Microsoft Learn study guide. Here's how to look it up:\n\n1. Visit the [AZ-900 Study Guide on Microsoft Learn](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-900).\n2. Use Ctrl+F to search for your keyword.\n3. Follow the linked module for an authoritative explanation.\n\nIf you believe this is an AZ-900 topic, try rephrasing your question with specific Azure service names or exam domain keywords.`,
        sources: retrieval.sources
      };
    }

    // ---- General AZ-900 grounded fallback (has some retrieval support) ----
    return {
      mode: 'demo',
      answer: `### Azure Fundamentals: ${message.length < 60 ? message : 'Key Concept'}\n\nBased on the AZ-900 skills outline, this relates to Azure's core architectural and governance principles:\n\n1. **Scope & Hierarchy**: Azure organizes resources across Management Groups → Subscriptions → Resource Groups → Resources.\n2. **Shared Responsibility**: Security responsibilities are divided between Microsoft (securing the infrastructure) and the customer (securing their data and identities).\n3. **Well-Architected Framework**: Azure Advisor evaluates workloads against five pillars: Cost, Security, Reliability, Operational Excellence, and Performance.\n\nFor an authoritative answer grounded in the official skills outline, please enable a Gemini API key in your \`.env\` file or consult [Microsoft Learn](https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/).`,
      analogy: `Think of Azure governance like a city: the city council (Management Groups) sets the regulations, different districts (Subscriptions) implement them, neighbourhoods (Resource Groups) group related buildings, and individual buildings are the resources.`,
      followUp: `Would you like to test your understanding with a practice question, or should I try to explain this concept from a different angle?`,
      sources: retrieval.sources
    };
  }
}

export const geminiService = new GeminiService();
