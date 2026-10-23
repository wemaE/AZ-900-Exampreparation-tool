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
    _history?: Array<{ role: string; content: string }>
  ): Promise<ChatResponsePayload> {
    if (isLiveMode && this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: config.geminiModel,
          systemInstruction: SYSTEM_PROMPT
        });

        const promptText = buildChatUserPrompt(
          message,
          retrieval.contextText,
          action,
          retrieval.isLogisticsQuery
        );

        const result = await model.generateContent(promptText);
        const text = result.response.text();

        return {
          answer: text,
          mode: 'live',
          sources: retrieval.sources
        };
      } catch (err) {
        console.error('[Gemini] Live API call failed, falling back to demo mode:', err);
      }
    }

    // Demo Mode Response
    return this.generateDemoResponse(message, retrieval, action);
  }

  public async generateQuizQuestion(topic: string, _context?: string): Promise<QuizQuestionData> {
    const quizId = `qz_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Curated high-yield practice questions adhering to AZ-900 guidelines
    const bank: Record<string, Array<Omit<QuizQuestionData, 'quizId' | 'topic' | 'disclaimer'>>> = {
      cloud_concepts: [
        {
          question:
            'Under the Azure Shared Responsibility Model, which responsibility is ALWAYS the customer’s responsibility regardless of cloud service model (IaaS, PaaS, or SaaS)?',
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
            'ZRS replicates data synchronously across three separate availability zones within the primary region, safeguarding against datacenter-level failures.',
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
            'Pearson OnVUE strictly prohibits all headphones, earbuds, and headsets. Audio must come through the computer’s built-in speakers and microphone.',
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
    action?: 'explain' | 'simplify' | 'example' | 'compare' | 'test_me'
  ): ChatResponsePayload {
    const lower = message.toLowerCase();

    if (retrieval.isLogisticsQuery || lower.includes('onvue') || lower.includes('proctor') || lower.includes('webcam') || lower.includes('headphone')) {
      return {
        mode: 'demo',
        answer: `### 🎯 Pearson OnVUE Online Exam Day Rules\n\nWhen taking your AZ-900 exam through online proctoring, Pearson OnVUE enforces strict security requirements:\n\n1. **Clean Desk Policy**: Your testing desk must be completely clear of electronics, notes, papers, watches, and writing utensils. Only your computer and mouse are permitted.\n2. **Audio & Devices**: Headphones, earbuds, and headsets are strictly prohibited. You must use your computer's built-in speakers and microphone.\n3. **Identification**: You must present a valid government-issued photo ID (such as a passport or driver's licence) whose name matches your exam registration exactly.\n4. **Environment**: You must remain alone in a private, quiet room with the door closed. Nobody may enter or speak to you during the session.\n\n> 💡 *Tip: Run the official OnVUE system test on the exact laptop and internet connection you plan to use at least 48 hours before test day!*`,
        analogy: `Think of online proctoring like boarding an international flight at airport security: every item in your pockets and on your desk is inspected, and you must verify your identity with official credentials before takeoff.`,
        followUp: `Would you like to test your understanding of online proctoring rules with a quick practice question?`,
        sources: retrieval.sources
      };
    }

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

    if (lower.includes('storage') || lower.includes('lrs') || lower.includes('zrs') || lower.includes('grs') || lower.includes('redundancy')) {
      return {
        mode: 'demo',
        answer: `### 💾 Azure Storage Redundancy Options\n\nAzure Storage always replicates multiple copies of your data to guard against transient hardware failures:\n\n- **LRS (Locally Redundant Storage)**: Replicates **3 synchronous copies** within a single physical facility in the primary region. Protects against individual disk or rack failure at the lowest cost.\n- **ZRS (Zone-Redundant Storage)**: Replicates data synchronously across **3 separate Availability Zones** in the primary region. Protects against a complete datacenter loss.\n- **GRS (Geo-Redundant Storage)**: Uses LRS in the primary region (3 copies), and asynchronously replicates 3 additional copies to a paired secondary region hundreds of miles away (6 copies total).\n- **GZRS (Geo-Zone-Redundant Storage)**: Uses ZRS in the primary region, plus LRS in the secondary region for maximum enterprise durability.`,
        analogy: `**Water Storage Analogy**: \n- **LRS** is having 3 interconnected water tanks in your backyard (if the yard floods, all 3 are impacted).\n- **ZRS** is having 1 water tank in your house, 1 in a neighbor's house, and 1 at your community center across town.\n- **GRS** is having 3 tanks in Nairobi, and a backup system of 3 tanks in Mombasa!`,
        followUp: `If an application requires protection against a total datacenter outage while keeping all data within a single geographical region, which tier is optimal?`,
        sources: retrieval.sources
      };
    }

    // Default High-Yield AZ-900 Concept Response
    return {
      mode: 'demo',
      answer: `### 🚀 Azure Fundamentals (AZ-900) Study Overview\n\nYou asked about: **"${message}"**.\n\nIn Microsoft Azure, this relates to core architectural and governance principles:\n\n1. **Core Concept**: Microsoft Azure organizes services across global Regions, Availability Zones (independent physical datacenters with separated power/cooling/networking), and Resource Groups.\n2. **Shared Responsibility**: Security and operational tasks are divided between Microsoft (security OF the cloud) and the customer (security IN the cloud).\n3. **Governance & Optimization**: Tools like Azure Policy, Resource Locks, and Azure Advisor ensure that your cloud workloads remain compliant, cost-efficient, and highly available.\n\n*Note: This explanation is grounded in the official Microsoft AZ-900 Skills Outline.*`,
      analogy: `Think of an Azure Subscription like a family home: Resource Groups are individual rooms (kitchen, living room, office), Azure Policies are the house rules, and Azure Advisor is the smart assistant telling you how to save electricity and lock the front door!`,
      followUp: `Would you like me to test you with a practice question or simplify this further?`,
      sources: retrieval.sources
    };
  }
}

export const geminiService = new GeminiService();
