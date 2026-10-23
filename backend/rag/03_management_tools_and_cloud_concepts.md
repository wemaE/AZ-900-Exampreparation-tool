# User-Supplied PDF: Management Tools, Cloud Models, Scaling, Pricing, and Storage

**Source file:** `Azure Fundamentals Q&AOG.pdf`  
**Source type:** User-supplied secondary study reference  
**Authority:** Secondary; independently verify answers before treating them as correct.

## Management tools — topic summary in the supplied PDF

| Tool or concept | Description in the supplied PDF |
|---|---|
| Azure portal | Browser-based management console for deploying resources and administering users, including Microsoft Entra. |
| ARM templates | Declarative JSON files describing infrastructure and configuration for automated deployment. |
| Azure Cloud Shell | Browser-accessible interactive terminal for managing Azure resources. |
| Azure CLI | Cross-platform command-line tool; the PDF suggests it for Linux administrators. |
| Azure PowerShell | Task-oriented command-line shell and scripting language. |
| Azure Arc | Extends Azure management and governance to hybrid and multicloud environments, including on-premises servers. |
| Azure Advisor | Personalized recommendations; the PDF specifically mentions reducing cost, security, and performance improvements in its summary. Verify exact capabilities for a given scenario. |

## Cloud models and advantages

The supplied PDF describes:

- **Public cloud:** no upfront capital expenditure is required in the described model.
- **Private cloud:** provides greater direct control over security, infrastructure, and compliance.
- **Hybrid cloud:** allows use of on-premises and cloud resources according to operational needs.

These are simplified study notes. Use current official Microsoft Learn material for nuance and scenario-specific answers.

## Platform as a Service (PaaS)

The supplied PDF marks these statements:

- Creating and configuring a virtual network is part of PaaS: **No**.
- Updating the operating system of the service web app is the customer's responsibility in PaaS: **No**.
- Configuring user access to a PaaS cloud service is the customer's responsibility: **Yes**.

Cross-check against the shared responsibility model and the specific service described.

## Hybrid cloud

The supplied PDF marks:

- A company must have an on-premises network to implement a hybrid cloud: **Yes**.
- A company can extend compute resources of its internal network using hybrid cloud: **Yes**.
- Only guest users can access public-cloud resources: **No**.

These are the source's stated answers, not independently validated universal rules.

## Scaling

The supplied PDF marks:

- Adding RAM to a VM is horizontal scaling: **No**.
- Adding another VM based on demand is vertical scaling: **No**.
- Horizontal scaling can occur automatically or manually: **Yes**.

Use the standard distinction when explaining the concept, but verify details from official material:
- **Vertical scaling (scale up/down):** increase or decrease the capacity of an existing resource.
- **Horizontal scaling (scale out/in):** add or remove instances/resources.

## Application hosting and cloud service models

The supplied PDF suggests:
- App requiring code changes with minimal operating-system management: PaaS.
- App requiring interaction with the operating system: IaaS.

The PDF says Azure Policy can be used to ensure resources meet organizational standards and compliance rules.

## Cloud benefits

The PDF identifies **high availability** as the benefit that supports continuous user access to a cloud application with minimal downtime.

## Azure pricing and licensing — claims in the supplied PDF

- Azure Reservations provide a billing discount and do not change the runtime state of resources: **Yes**.
- Azure Reserved VM Instances cover Windows software, networking, and storage charges for VMs: **No**.
- Azure Hybrid Benefit for Windows Server allows a Standard Edition license to be used simultaneously for an on-premises server and an Azure VM: **No**.

Pricing, licensing, and eligibility change and are scenario-dependent. Verify current official pricing/licensing documentation before giving a definitive answer.

## Azure Storage — claims in the supplied PDF

- The Archive access tier can be set at the storage-account level: **No**.
- The Cool access tier offers the lowest blob storage cost: **No**.
- The default access tier of a storage account can be changed after blobs are uploaded: **Yes**.

Storage tier capabilities, access constraints, and pricing can change. Verify current documentation.

## Tutor handling rules

This file deliberately records what the PDF says. Do not silently “fix” the source's answer key. Instead, label the answer as source-derived, verify it against current official documentation, and clearly explain any correction or uncertainty.
