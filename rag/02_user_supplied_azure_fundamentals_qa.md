# User-Supplied PDF: Azure Fundamentals (AZ-900) Study Guide

**Source file:** `Azure Fundamentals Q&AOG.pdf`  
**Source type:** User-supplied secondary study reference  
**Authority:** Secondary; answers are claims from the PDF, not guaranteed ground truth  
**Verification status:** Not fully independently verified  
**RAG rule:** Preserve the source's intended meaning, but cross-check any answer against current Microsoft Learn before presenting it as authoritative.

## 1. Network security groups and routing

The supplied PDF states:

- Network security groups (NSGs) can contain multiple inbound and outbound security rules: **Yes**.
- A virtual machine that performs a function such as running a firewall can be called a Network Virtual Appliance (NVA): **Yes**.
- A user-defined route (UDR) can only control traffic between subnets of a single virtual network: **No**.

## 2. Azure Storage

The supplied PDF states:

- Locally redundant storage (LRS) maintains **three copies** of data.
- Azure Blob Storage is optimized for massive amounts of unstructured data.

## 3. Security and identity

The supplied PDF states:

- Microsoft Defender for Cloud is used to review Secure Score.
- Microsoft Entra ID enables users to authenticate to multiple applications using single sign-on (SSO).
- In the listed role scenario, it gives the answer “User2, User3, and User4 only” for who can edit/review a Conditional Access policy. Verify this scenario against current role permissions before using it.
- Microsoft Entra can manage access to on-premises applications: **Yes**.
- Microsoft Entra provides SSO: **Yes**.
- iOS devices can be registered in a Microsoft Entra tenant: **Yes**.
- Conditional Access evaluates sign-ins using signals such as IP location, device compliance, and real-time risk detection.

## 4. Azure resource management and architecture

The supplied PDF states:

- A resource group cannot be created inside another resource group.
- An Azure virtual machine cannot belong to multiple resource groups.
- A resource group can contain resources from multiple Azure regions.
- To maintain service availability after a datacenter failure, it suggests deploying VMs across two or more regions or two or more availability zones. Verify the scenario requirements and resiliency design in current Microsoft Learn documentation.
- Azure Container Instances is a compute service.
- Azure Arc can manage an on-premises Windows Server as an Azure resource.

## 5. Connectivity and networking

The supplied PDF states:

- Site-to-Site (S2S) VPN is a suggested option for connecting on-premises servers to Azure VMs while minimizing administrative effort and cost.
- It marks the statement “inbound data traffic from on-premises to Azure over ExpressRoute is always free” as **Yes**.
- It marks “outbound data traffic from Azure to on-premises is always free” as **No**.
- It marks “traffic between Azure services in the same region is always free” as **No**.

**Important:** Billing can depend on service, region, pricing option, and current terms. Do not generalize these statements without checking current Azure pricing documentation.

## 6. Deployment and infrastructure as code

The supplied PDF states:

- Bicep files are recommended for automated Infrastructure as Code (IaC) deployment.
- ARM templates are an example of IaC: **Yes**.
- Bicep files are an example of IaC: **Yes**.
- A Microsoft Excel template is not an example of IaC: **No**.

## 7. Governance, monitoring, and cost management

The supplied PDF states:

- Initiatives group related Azure Policy definitions.
- Budget alerts can send alerts when costs exceed a specified threshold.
- Azure Advisor does not provide recommendations to improve the security of a Microsoft Entra ID environment: **No**.
- Azure Advisor can recommend ways to reduce the cost of running Azure VMs: **Yes**.
- Azure Advisor does not provide recommendations on configuring VM network settings: **No**.
- Azure Service Health gives an overview of the status of Azure services, regions, and specific resources.
- A Read-only lock is suggested to prevent users from deleting or modifying resources in a resource group.
- An Azure resource can have multiple Delete locks: **Yes**, according to the PDF.
- A resource inherits locks from its resource group: **Yes**, according to the PDF.
- A resource with a Read-only lock can also have a Delete lock: **Yes**, according to the PDF.
- The PDF answers “Log Analytics queries” for identifying request paths and downstream dependency calls associated with failures in workspace-based Application Insights. Verify the exact monitoring workflow in current documentation.

## 8. Cloud concepts

The supplied PDF identifies Microsoft 365 as Software as a Service (SaaS).

## 9. Management tools and services

The supplied PDF's practice section gives these answers:

1. Azure portal can create resources and create Microsoft Entra users.
2. ARM templates define resources to provision in declarative JSON.
3. Azure Cloud Shell provides Azure CLI and Azure PowerShell.
4. Azure Cloud Shell is accessed using a web browser.
5. Azure CLI is suggested for Linux administrators who want to use existing command-line skills.
6. Azure Arc can centrally manage, govern, and secure on-premises servers without migrating them to Azure.
7. Azure Advisor provides recommendations to reduce Azure resource costs.

## 10. How to answer from this file

When the learner asks about a point above:
1. Retrieve the relevant item.
2. Check current official Microsoft Learn content if available.
3. If verified, explain the concept in plain language and cite the official page.
4. If not verified, say “The supplied study PDF says…” rather than “Microsoft says…”.
5. If the PDF and current official documentation conflict, prioritize the current official documentation and explain the discrepancy.
